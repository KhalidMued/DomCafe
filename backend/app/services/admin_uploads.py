import logging
import re
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.menu import Drink

logger = logging.getLogger(__name__)

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
# Menu photos render at card size; larger originals waste guest bandwidth.
_MAX_DIMENSION = 1600
_WEBP_QUALITY = 85
_PHOTO_URL_PREFIX = "/uploads/drinks/"


async def upload_drink_photo(
    session: AsyncSession,
    drink_id: str,
    photo: UploadFile,
) -> dict[str, str]:
    drink = await session.get(Drink, drink_id)
    if drink is None:
        raise HTTPException(status_code=404, detail="Drink not found.")

    if (photo.content_type or "") not in _ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, or WebP image.")

    settings = get_settings()
    contents = await photo.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if not contents or len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail="Drink photo must be between 1 byte and 5 MB.")

    normalized = _normalize_image(contents)
    uploads_dir = Path(settings.upload_dir) / "drinks"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{drink_id}-{uuid4().hex}.webp"
    destination = uploads_dir / filename
    destination.write_bytes(normalized)

    replaced_photo_url = drink.photo_url
    photo_url = f"{_PHOTO_URL_PREFIX}{filename}"
    drink.photo_url = photo_url
    await session.commit()
    await _delete_replaced_photo(session, drink_id, replaced_photo_url, uploads_dir)
    return {"id": drink.id, "photo_url": photo_url}


def _generated_photo_filename(drink_id: str, photo_url: str) -> str | None:
    """Return the filename only if photo_url is a server-generated photo of this drink.

    Generated uploads are always `{drink_id}-{uuid4().hex}.webp`. Curated assets
    (tracked `.png` files, `placeholder.jpg`, anything hand-promoted) never match,
    so they are never candidates for deletion.
    """
    if not photo_url.startswith(_PHOTO_URL_PREFIX):
        return None
    filename = photo_url[len(_PHOTO_URL_PREFIX) :]
    if re.fullmatch(rf"{re.escape(drink_id)}-[0-9a-f]{{32}}\.webp", filename):
        return filename
    return None


async def _delete_replaced_photo(
    session: AsyncSession,
    drink_id: str,
    replaced_photo_url: str,
    uploads_dir: Path,
) -> None:
    """Best-effort cleanup of the replaced generated file; the upload already succeeded."""
    filename = _generated_photo_filename(drink_id, replaced_photo_url or "")
    if filename is None:
        return
    still_referenced = await session.execute(
        select(Drink.id).where(Drink.photo_url == replaced_photo_url).limit(1)
    )
    if still_referenced.scalar_one_or_none() is not None:
        return
    try:
        (uploads_dir / filename).unlink(missing_ok=True)
    except OSError:
        logger.warning("Could not delete replaced drink photo %s", filename)


def _normalize_image(contents: bytes) -> bytes:
    """Re-encode as WebP: caps dimensions, strips EXIF, and rules out decoys."""
    try:
        with Image.open(BytesIO(contents)) as image:
            image.verify()
        with Image.open(BytesIO(contents)) as image:
            image = ImageOps.exif_transpose(image)
            if image.mode not in ("RGB", "RGBA"):
                image = image.convert("RGB")
            image.thumbnail((_MAX_DIMENSION, _MAX_DIMENSION))
            output = BytesIO()
            image.save(output, format="WEBP", quality=_WEBP_QUALITY)
            return output.getvalue()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Upload a valid image file.")
