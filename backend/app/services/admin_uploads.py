from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.menu import Drink

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
# Menu photos render at card size; larger originals waste guest bandwidth.
_MAX_DIMENSION = 1600
_WEBP_QUALITY = 85


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

    photo_url = f"/uploads/drinks/{filename}"
    drink.photo_url = photo_url
    await session.commit()
    return {"id": drink.id, "photo_url": photo_url}


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
