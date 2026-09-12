"""Ephemeral, PII-free invalidations. REST remains the source of truth."""
import asyncio
import logging
import time

import anyio
from fastapi import HTTPException
from starlette.responses import StreamingResponse

from app.db.redis import get_redis

logger = logging.getLogger(__name__)
ADMIN_CHANNEL = "dom:orders:admin"
HEARTBEAT_SECONDS = 15
IO_TIMEOUT = 1


def guest_channel(public_code: str) -> str:
    return f"dom:orders:guest:{public_code}"


async def publish_order_changed(public_code: str) -> None:
    """Invalidate admin and one private guest stream after a status commit."""
    await _publish_channels(ADMIN_CHANNEL, guest_channel(public_code))


async def publish_orders_changed() -> None:
    """Invalidate only the admin order list after an order creation commit."""
    await _publish_channels(ADMIN_CHANNEL)


async def _publish_channels(*channels: str) -> None:
    """Best-effort publication with a strict latency bound for write routes."""
    try:
        async with asyncio.timeout(IO_TIMEOUT):
            redis = get_redis()
            for channel in channels:
                await redis.publish(channel, "{}")
    except Exception:
        # Do not log exception text: connection URLs can contain credentials.
        logger.warning("Order event publication unavailable")


class OrderEventResponse(StreamingResponse):
    def __init__(self, pubsub, channel: str, event: str, expires_at: float | None):
        self.pubsub = pubsub
        self.closed = False
        super().__init__(
            self.events(channel, event, expires_at),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"},
        )

    async def close(self):
        if not self.closed:
            self.closed = True
            # Starlette cancels its task group on disconnect. Shield cleanup,
            # but bound it even when the Redis connection is broken.
            try:
                with anyio.move_on_after(IO_TIMEOUT, shield=True):
                    await self.pubsub.aclose()
            except Exception:
                logger.warning("Order event subscription cleanup unavailable")

    async def __call__(self, scope, receive, send):
        try:
            await super().__call__(scope, receive, send)
        finally:
            await self.close()

    async def events(self, channel, event, expires_at):
        try:
            if expires_at is not None and time.time() >= expires_at:
                return
            yield "event: connected\ndata: {}\n\n"
            while True:
                timeout = HEARTBEAT_SECONDS
                if expires_at is not None:
                    timeout = min(timeout, expires_at - time.time())
                    if timeout <= 0:
                        return
                try:
                    async with asyncio.timeout(timeout):
                        message = await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=timeout)
                except TimeoutError:
                    message = None
                if expires_at is not None and time.time() >= expires_at:
                    return
                if message and message["type"] == "message" and message["channel"] == channel:
                    yield f"event: {event}\ndata: {{}}\n\n"
                elif message is None:
                    yield ": heartbeat\n\n"
        except Exception:
            logger.warning("Order event subscription interrupted")
        finally:
            await self.close()


async def order_event_response(channel: str, event: str, expires_at: float | None = None):
    try:
        pubsub = get_redis().pubsub()
    except Exception:
        raise HTTPException(status_code=503, detail="Live updates unavailable.") from None
    response = OrderEventResponse(pubsub, channel, event, expires_at)
    try:
        async with asyncio.timeout(IO_TIMEOUT):
            await pubsub.subscribe(channel)
            # subscribe() sends the command; wait for Redis's ACK before the
            # connected/refetch signal, otherwise a mutation can be missed.
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=False, timeout=IO_TIMEOUT)
                if message and message["type"] == "subscribe" and message["channel"] == channel:
                    break
    except BaseException as exc:
        await response.close()
        if isinstance(exc, asyncio.CancelledError):
            raise
        raise HTTPException(status_code=503, detail="Live updates unavailable.") from None
    return response
