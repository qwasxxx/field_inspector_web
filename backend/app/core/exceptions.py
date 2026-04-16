"""HTTP exception handlers."""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.domain.errors import AppException


async def app_exception_handler(
    _request: Request,
    exc: AppException,
) -> JSONResponse:
    """Map AppException to JSON response."""

    return JSONResponse(
        status_code=exc.code,
        content={"error": exc.message},
    )
