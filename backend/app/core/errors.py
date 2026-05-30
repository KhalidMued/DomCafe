from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class GuestApiError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message


def friendly_error(status_code: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={"error": True, "code": code, "message": message},
    )


async def guest_api_error_handler(_request: Request, exc: GuestApiError) -> JSONResponse:
    return friendly_error(exc.status_code, exc.code, exc.message)


async def validation_exception_handler(
    _request: Request, _exc: RequestValidationError
) -> JSONResponse:
    return friendly_error(
        422,
        "INVALID_INPUT",
        "Please check your order details and try again.",
    )
