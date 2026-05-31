from io import BytesIO
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.menu import Drink

_ALLOWED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


async def upload_drink_photo(
    session: AsyncSession,
    drink_id: str,
    photo: UploadFile,
) -> dict[str, str]:
    drink = await session.get(Drink, drink_id)
    if drink is None:
        raise HTTPException(status_code=404, detail="Drink not found.")

    extension = _ALLOWED_IMAGE_TYPES.get(photo.content_type or "")
    if extension is None:
        raise HTTPException(status_code=400, detail="Upload a JPEG, PNG, or WebP image.")

    settings = get_settings()
    contents = await photo.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if not contents or len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail="Drink photo must be between 1 byte and 5 MB.")

    _verify_image(contents)
    uploads_dir = Path(settings.upload_dir) / "drinks"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    filename = f"{drink_id}-{uuid4().hex}.{extension}"
    destination = uploads_dir / filename
    destination.write_bytes(contents)

    photo_url = f"/uploads/drinks/{filename}"
    drink.photo_url = photo_url
    await session.commit()
    return {"id": drink.id, "photo_url": photo_url}


def _verify_image(contents: bytes) -> None:
    try:
        with Image.open(BytesIO(contents)) as image:
            image.verify()
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=400, detail="Upload a valid image file.")
