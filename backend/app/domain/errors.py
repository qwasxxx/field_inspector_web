"""Domain-level application errors."""


class AppException(Exception):
    """Base application exception with HTTP status mapping."""

    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)
