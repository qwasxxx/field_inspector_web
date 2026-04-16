"""Logging setup."""

import logging
import sys


def configure_logging() -> None:
    """Configure root logging for the application."""

    root = logging.getLogger()
    if root.handlers:
        return
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
        stream=sys.stdout,
    )
