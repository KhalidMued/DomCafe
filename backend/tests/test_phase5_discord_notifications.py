from types import SimpleNamespace

import pytest

from app.services.discord import build_order_notification_message, notify_new_order_if_enabled


class FakeItem:
    quantity = 2
    drink_name_snapshot = "Iced Spanish Latte"
    temperature = "iced"
    milk = "whole milk"
    item_note = "Less sweet"


class FakeOrder:
    id = 1201
    guest_name = "Ahmed"
    guest_note = "Outside table"
    status = "new"
    items = [FakeItem()]


class FakeSession:
    def __init__(self, order=None, setting_value=None):
        self.order = order or FakeOrder()
        self.setting_value = setting_value

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def scalar(self, _statement):
        return self.setting_value

    async def get(self, _model, order_id, options=None):
        if order_id == self.order.id:
            return self.order
        return None


class FakeAsyncClient:
    requests = []

    def __init__(self, *args, **kwargs):
        pass

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url, json):
        self.requests.append({"url": url, "json": json})
        return FakeResponse()


class FakeResponse:
    def raise_for_status(self):
        return None


def settings(enabled):
    return SimpleNamespace(
        discord_webhook_url="https://discord.example/webhook",
        discord_notifications_enabled=enabled,
    )


@pytest.mark.asyncio
async def test_build_order_notification_message_contains_order_details():
    message = await build_order_notification_message(FakeSession(), FakeOrder())

    assert "☕ New DŌM order" in message
    assert "Order #1201" in message
    assert "Guest: Ahmed" in message
    assert "- 2x Iced Spanish Latte" in message
    assert "Milk: whole milk" in message
    assert "Note: Less sweet" in message
    assert "Status: New" in message
    assert "Outside table" not in message


@pytest.mark.asyncio
async def test_notify_new_order_skips_when_disabled(monkeypatch):
    from app.services import discord

    FakeAsyncClient.requests = []
    monkeypatch.setattr(discord, "AsyncSessionLocal", lambda: FakeSession())
    monkeypatch.setattr(discord.httpx, "AsyncClient", FakeAsyncClient)
    monkeypatch.setattr(discord, "get_settings", lambda: settings(False))

    await notify_new_order_if_enabled(1201)

    assert FakeAsyncClient.requests == []


@pytest.mark.asyncio
async def test_notify_new_order_posts_when_enabled(monkeypatch):
    from app.services import discord

    FakeAsyncClient.requests = []
    monkeypatch.setattr(discord, "AsyncSessionLocal", lambda: FakeSession())
    monkeypatch.setattr(discord.httpx, "AsyncClient", FakeAsyncClient)
    monkeypatch.setattr(discord, "get_settings", lambda: settings(True))

    await notify_new_order_if_enabled(1201)

    assert FakeAsyncClient.requests == [
        {
            "url": "https://discord.example/webhook",
            "json": {"content": "☕ New DŌM order\n\nOrder #1201\nGuest: Ahmed\n\nItems:\n- 2x Iced Spanish Latte\n  Temperature: iced\n  Milk: whole milk\n  Note: Less sweet\n\nStatus: New"},
        }
    ]


@pytest.mark.asyncio
async def test_notify_new_order_setting_can_enable_notifications(monkeypatch):
    from app.services import discord

    FakeAsyncClient.requests = []
    monkeypatch.setattr(discord, "AsyncSessionLocal", lambda: FakeSession(setting_value="true"))
    monkeypatch.setattr(discord.httpx, "AsyncClient", FakeAsyncClient)
    monkeypatch.setattr(discord, "get_settings", lambda: settings(False))

    await notify_new_order_if_enabled(1201)

    assert len(FakeAsyncClient.requests) == 1


@pytest.mark.asyncio
async def test_notify_new_order_does_not_break_order_flow_on_webhook_failure(monkeypatch):
    from app.services import discord

    class FailingClient(FakeAsyncClient):
        async def post(self, url, json):
            raise RuntimeError("network unavailable")

    monkeypatch.setattr(discord, "AsyncSessionLocal", lambda: FakeSession())
    monkeypatch.setattr(discord.httpx, "AsyncClient", FailingClient)
    monkeypatch.setattr(discord, "get_settings", lambda: settings(True))

    await notify_new_order_if_enabled(1201)
