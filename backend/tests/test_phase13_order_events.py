import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from starlette.requests import Request

from app.services import order_events as events


class PubSub:
    def __init__(self):
        self.channel = None
        self.closed = False
        self.messages = asyncio.Queue()

    async def subscribe(self, channel):
        self.channel = channel
        await self.messages.put({'type': 'subscribe', 'channel': channel})

    async def get_message(self, **kwargs):
        return await self.messages.get()

    async def aclose(self):
        self.closed = True


def test_subscribe_before_connected_and_guest_isolation(monkeypatch):
    async def run():
        pubsub = PubSub()
        monkeypatch.setattr(events, 'get_redis', lambda: SimpleNamespace(pubsub=lambda: pubsub))
        response = await events.order_event_response(events.guest_channel('random-code'), 'order-changed')
        assert pubsub.channel == events.guest_channel('random-code')
        assert pubsub.channel != events.guest_channel('other-code')
        assert await anext(response.body_iterator) == 'event: connected\ndata: {}\n\n'
        await pubsub.messages.put({'type': 'message', 'channel': pubsub.channel, 'data': 'private data'})
        assert await anext(response.body_iterator) == 'event: order-changed\ndata: {}\n\n'
        await response.close()
        assert pubsub.closed
    asyncio.run(run())


def test_initial_redis_failure_is_503_and_closes(monkeypatch):
    async def run():
        pubsub = PubSub()
        pubsub.subscribe = AsyncMock(side_effect=ConnectionError('down'))
        monkeypatch.setattr(events, 'get_redis', lambda: SimpleNamespace(pubsub=lambda: pubsub))
        with pytest.raises(HTTPException) as error:
            await events.order_event_response('admin', 'orders-changed')
        assert error.value.status_code == 503
        assert pubsub.closed
    asyncio.run(run())


def test_publish_failure_and_timeout_are_best_effort(monkeypatch):
    async def run():
        publish = AsyncMock(side_effect=ConnectionError('down'))
        monkeypatch.setattr(events, 'get_redis', lambda: SimpleNamespace(publish=publish))
        await events.publish_order_changed('public-code')
        async def stalled(*args):
            await asyncio.Event().wait()
        monkeypatch.setattr(events, 'IO_TIMEOUT', .01)
        monkeypatch.setattr(events, 'get_redis', lambda: SimpleNamespace(publish=stalled))
        await asyncio.wait_for(events.publish_order_changed('public-code'), .2)
    asyncio.run(run())


def test_pubsub_creation_failure_is_503(monkeypatch):
    async def run():
        def unavailable():
            raise ConnectionError('down')
        monkeypatch.setattr(events, 'get_redis', unavailable)
        with pytest.raises(HTTPException) as error:
            await events.order_event_response('admin', 'orders-changed')
        assert error.value.status_code == 503
    asyncio.run(run())


def test_idle_stream_sends_heartbeat_and_security_headers(monkeypatch):
    async def run():
        pubsub = PubSub()
        monkeypatch.setattr(events, 'HEARTBEAT_SECONDS', .01)
        monkeypatch.setattr(events, 'get_redis', lambda: SimpleNamespace(pubsub=lambda: pubsub))
        response = await events.order_event_response('admin', 'orders-changed')
        assert response.headers['content-type'].startswith('text/event-stream')
        assert response.headers['cache-control'] == 'no-store'
        assert response.headers['x-accel-buffering'] == 'no'
        assert await anext(response.body_iterator) == 'event: connected\ndata: {}\n\n'
        assert await anext(response.body_iterator) == ': heartbeat\n\n'
        await response.close()
        assert pubsub.closed
    asyncio.run(run())


def test_creation_and_status_publish_only_empty_invalidations(monkeypatch):
    async def run():
        publish = AsyncMock(return_value=1)
        monkeypatch.setattr(events, 'get_redis', lambda: SimpleNamespace(publish=publish))
        await events.publish_orders_changed()
        assert publish.await_args_list[0].args == (events.ADMIN_CHANNEL, '{}')
        publish.reset_mock()
        await events.publish_order_changed('private-code')
        assert [call.args for call in publish.await_args_list] == [
            (events.ADMIN_CHANNEL, '{}'),
            (events.guest_channel('private-code'), '{}'),
        ]
    asyncio.run(run())


class SessionContext:
    def __init__(self, scalar_result=1):
        self.scalar_result = scalar_result

    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return None

    async def scalar(self, _statement):
        return self.scalar_result


def test_guest_route_requires_an_existing_private_public_code(monkeypatch):
    from app.api.public import routes

    code = 'abcdefghijklmnop'
    monkeypatch.setattr(routes, 'AsyncSessionLocal', lambda: SessionContext(None))
    with pytest.raises(Exception) as error:
        asyncio.run(routes.order_events(code))
    assert error.value.status_code == 404

    response = object()
    event_response = AsyncMock(return_value=response)
    monkeypatch.setattr(routes, 'AsyncSessionLocal', lambda: SessionContext(12))
    monkeypatch.setattr(routes, 'order_event_response', event_response)
    assert asyncio.run(routes.order_events(code)) is response
    event_response.assert_awaited_once_with(routes.guest_channel(code), 'order-changed')


def test_admin_route_authenticates_before_subscribing(monkeypatch):
    from app.api.admin import routes

    request = Request({'type': 'http', 'headers': []})
    credentials = HTTPAuthorizationCredentials(scheme='Bearer', credentials='token')
    authenticated = AsyncMock(return_value='1')
    event_response = AsyncMock(return_value=object())
    monkeypatch.setattr(routes, 'require_admin', authenticated)
    monkeypatch.setattr(routes, 'AsyncSessionLocal', lambda: SessionContext())
    monkeypatch.setattr(routes.jwt, 'decode', lambda *_args, **_kwargs: {'exp': 12345})
    monkeypatch.setattr(routes, 'order_event_response', event_response)

    asyncio.run(routes.admin_order_events(request, credentials))

    authenticated.assert_awaited_once()
    event_response.assert_awaited_once_with(routes.ADMIN_CHANNEL, 'orders-changed', 12345.0)


def test_failed_status_commit_does_not_publish(monkeypatch):
    from app.services import admin_orders

    order = SimpleNamespace(
        id=12,
        public_code='private-order-code',
        status='new',
        received_at=None,
        preparing_at=None,
        ready_at=None,
        cancelled_at=None,
    )

    class FailedSession:
        async def get(self, *_args):
            return order

        async def commit(self):
            raise RuntimeError('commit failed')

    publish = AsyncMock()
    monkeypatch.setattr(admin_orders, 'publish_order_changed', publish)

    with pytest.raises(RuntimeError, match='commit failed'):
        asyncio.run(admin_orders.update_order_status(FailedSession(), 12, 'preparing'))

    publish.assert_not_awaited()
