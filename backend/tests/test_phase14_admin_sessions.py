import asyncio
import time
from types import SimpleNamespace
from unittest.mock import AsyncMock

import jwt
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.security import create_access_token
from app.services import admin_auth, admin_sessions, order_events
from app.api.admin import routes
from app.main import app


class SessionRedis:
    def __init__(self):
        self.values = {}

    async def set(self, key, value, *, exat, nx):
        assert nx
        if key in self.values:
            return None
        self.values[key] = (value, exat)
        return True

    async def get(self, key):
        value, expiry = self.values.get(key, (None, 0))
        return value if expiry > time.time() else None

    async def delete(self, key):
        return self.values.pop(key, None) is not None


@pytest.fixture
def store(monkeypatch):
    redis = SessionRedis()
    monkeypatch.setattr(admin_sessions, 'get_redis', lambda: redis)
    return redis


@pytest.fixture(autouse=True)
def session_settings(monkeypatch):
    monkeypatch.setattr(get_settings(), 'jwt_secret', 'test-session-secret-at-least-32-bytes-long')
    monkeypatch.setattr(get_settings(), 'jwt_expires_minutes', 60)


def test_token_has_unique_id_and_default_security():
    first = jwt.decode(create_access_token('1'), get_settings().jwt_secret, algorithms=['HS256'])
    second = jwt.decode(create_access_token('1'), get_settings().jwt_secret, algorithms=['HS256'])
    assert first['jti'] != second['jti']
    assert 3590 <= first['exp'] - time.time() <= 3600
    # Owner confirmed HTTPS-only admin access.
    from app.core.config import Settings
    assert Settings.model_fields['admin_cookie_secure'].default is True
    assert Settings.model_fields['jwt_expires_minutes'].default == 60


def test_successful_login_registers_session(store, monkeypatch):
    async def run():
        admin = SimpleNamespace(id=1, password_hash='hash')
        db = SimpleNamespace(execute=AsyncMock(return_value=SimpleNamespace(scalar_one_or_none=lambda: admin)))
        monkeypatch.setattr(admin_auth, 'verify_password', lambda *_: True)
        result = await admin_auth.authenticate_admin(db, 'admin', 'password')
        assert await admin_sessions.active_admin_subject(result['access_token']) == '1'
        assert len(store.values) == 1
    asyncio.run(run())


@pytest.mark.parametrize('logout_with', ['cookie', 'bearer'])
def test_logout_revokes_copied_bearer_and_other_sessions_survive(store, monkeypatch, logout_with):
    token, other = create_access_token('1'), create_access_token('1')
    asyncio.run(admin_sessions.register_admin_session(token))
    asyncio.run(admin_sessions.register_admin_session(other))
    db = SimpleNamespace(get=AsyncMock(return_value=SimpleNamespace(id=1, is_active=True)))
    async def get_session():
        yield db
    app.dependency_overrides[routes.get_session] = get_session
    monkeypatch.setattr(routes, 'list_recent_orders', AsyncMock(return_value=[]))
    try:
        with TestClient(app, base_url='https://testserver') as client:
            header = {'Authorization': f'Bearer {token}'}
            assert client.get('/api/admin/orders', headers=header).status_code == 200
            if logout_with == 'cookie':
                client.cookies.set(routes.JWT_COOKIE, token)
            assert client.post('/api/admin/logout', headers=header if logout_with == 'bearer' else {}).status_code == 200
            assert client.get('/api/admin/orders', headers=header).status_code == 401
            assert client.get('/api/admin/orders', headers={'Authorization': f'Bearer {other}'}).status_code == 200
    finally:
        app.dependency_overrides.clear()


def test_unregistered_old_expired_and_lost_sessions_rejected(store):
    async def run():
        token = create_access_token('1')
        assert await admin_sessions.active_admin_subject(token) is None
        await admin_sessions.register_admin_session(token)
        store.values.clear()  # Redis restart/eviction cannot resurrect access.
        assert await admin_sessions.active_admin_subject(token) is None
        for payload in [
            {'sub': '1', 'scope': 'admin', 'exp': time.time() + 60},
            {'sub': '1', 'scope': 'admin', 'jti': 'old', 'exp': time.time() - 1},
            {'sub': '1', 'scope': 'admin', 'jti': 'missing-exp'},
        ]:
            old = jwt.encode(payload, get_settings().jwt_secret, algorithm='HS256')
            assert await admin_sessions.active_admin_subject(old) is None
    asyncio.run(run())


def test_registration_expiry_matches_jwt_and_cannot_overwrite(store):
    async def run():
        token = create_access_token('1')
        claims = jwt.decode(token, get_settings().jwt_secret, algorithms=['HS256'])
        await admin_sessions.register_admin_session(token)
        assert store.values[f"dom:admin:session:{claims['jti']}"] == ('1', claims['exp'])
        with pytest.raises(HTTPException) as error:
            await admin_sessions.register_admin_session(token)
        assert error.value.status_code == 503
    asyncio.run(run())


def test_login_rest_logout_fail_closed_during_outage(store, monkeypatch):
    token = create_access_token('1')
    async def unavailable(*args, **kwargs):
        raise ConnectionError('private details')
    store.set = store.get = store.delete = unavailable
    admin = SimpleNamespace(id=1, is_active=True, password_hash='hash')
    db = SimpleNamespace(
        execute=AsyncMock(return_value=SimpleNamespace(scalar_one_or_none=lambda: admin)),
        get=AsyncMock(return_value=admin),
    )
    async def get_session():
        yield db
    app.dependency_overrides[routes.get_session] = get_session
    app.dependency_overrides[routes.enforce_admin_login_rate_limit] = lambda: None
    monkeypatch.setattr(admin_auth, 'verify_password', lambda *_: True)
    try:
        with TestClient(app) as client:
            login = client.post('/api/admin/login', json={'username': 'admin', 'password': 'password'})
            assert login.status_code == 503
            assert 'set-cookie' not in login.headers
            header = {'Authorization': f'Bearer {token}'}
            assert client.get('/api/admin/orders', headers=header).status_code == 503
            assert client.post('/api/admin/logout', headers=header).status_code == 503
        db.get.assert_not_awaited()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize('operation', ['register_admin_session', 'active_admin_subject', 'revoke_admin_session'])
@pytest.mark.parametrize('failure', ['error', 'stall'])
def test_session_io_fails_closed_and_is_bounded(monkeypatch, operation, failure):
    async def run():
        async def unavailable(*args, **kwargs):
            if failure == 'stall':
                await asyncio.Event().wait()
            raise ConnectionError('private connection details')
        monkeypatch.setattr(admin_sessions, 'IO_TIMEOUT', .01)
        monkeypatch.setattr(admin_sessions, 'get_redis', lambda: SimpleNamespace(set=unavailable, get=unavailable, delete=unavailable))
        with pytest.raises(HTTPException) as error:
            await asyncio.wait_for(getattr(admin_sessions, operation)(create_access_token('1')), .2)
        assert error.value.status_code == 503
        assert 'private' not in error.value.detail
    asyncio.run(run())


@pytest.mark.parametrize('failure', ['revoke', 'outage', 'expire'])
def test_open_sse_stops_on_revocation_failure_or_expiry(store, monkeypatch, failure):
    async def run():
        token = create_access_token('1')
        await admin_sessions.register_admin_session(token)
        class PubSub:
            closed = False
            async def get_message(self, **kwargs):
                await asyncio.Event().wait()
            async def aclose(self):
                self.closed = True
        pubsub = PubSub()
        monkeypatch.setattr(order_events, 'SESSION_CHECK_SECONDS', .01)
        async def check():
            return await admin_sessions.active_admin_subject(token) is not None
        response = order_events.OrderEventResponse(pubsub, order_events.ADMIN_CHANNEL, 'orders-changed', time.time() + (.03 if failure == 'expire' else 60), session_check=check)
        assert await anext(response.body_iterator) == 'event: connected\ndata: {}\n\n'
        if failure == 'revoke':
            await admin_sessions.revoke_admin_session(token)
        elif failure == 'outage':
            store.get = AsyncMock(side_effect=ConnectionError('private'))
        async def exhaust():
            async for chunk in response.body_iterator:
                assert chunk == ': heartbeat\n\n'
        await asyncio.wait_for(exhaust(), .2)
        assert pubsub.closed
    asyncio.run(run())
