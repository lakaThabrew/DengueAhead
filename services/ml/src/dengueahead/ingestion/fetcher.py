"""HTTP document fetcher with retry, timeout, and content-type validation."""

from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from dengueahead.common import logging as log

ALLOWED_CONTENT_TYPES: frozenset[str] = frozenset(
    ["application/pdf", "text/html", "text/html; charset=utf-8", "text/html;charset=utf-8"]
)


class FetchError(Exception):
    """Raised when a document cannot be fetched after all retries."""

    def __init__(self, url: str, status: int | None, message: str) -> None:
        super().__init__(message)
        self.url = url
        self.status = status


class ContentTypeError(FetchError):
    """Raised when the response Content-Type does not match expectations."""


@dataclass(frozen=True)
class FetchConfig:
    connect_timeout: float = 10.0
    read_timeout: float = 30.0
    max_retries: int = 3
    backoff_factor: float = 1.0
    retry_statuses: Sequence[int] = (429, 500, 502, 503, 504)
    user_agent: str = "DengueAhead/1.0 (research; EchoBinary)"


@dataclass(frozen=True)
class FetchResult:
    url: str
    content: bytes
    content_type: str
    http_status: int
    fetched_at: datetime  # UTC


def _make_session(config: FetchConfig) -> requests.Session:
    session = requests.Session()
    retry = Retry(
        total=config.max_retries,
        backoff_factor=config.backoff_factor,
        status_forcelist=list(config.retry_statuses),
        allowed_methods=["HEAD", "GET"],
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({"User-Agent": config.user_agent})
    return session


def fetch_document(url: str, config: FetchConfig | None = None) -> FetchResult:
    """Fetch a document from *url*, returning its raw bytes and metadata.

    Raises:
        FetchError: on HTTP error or network failure after all retries.
        ContentTypeError: when the response Content-Type is unexpected.
    """
    cfg = config or FetchConfig()
    session = _make_session(cfg)
    log.info("Fetching document", url=url)

    try:
        response = session.get(
            url,
            timeout=(cfg.connect_timeout, cfg.read_timeout),
            stream=False,
        )
    except requests.exceptions.RequestException as exc:
        raise FetchError(url=url, status=None, message=str(exc)) from exc

    if not response.ok:
        raise FetchError(
            url=url,
            status=response.status_code,
            message=f"HTTP {response.status_code} for {url}",
        )

    raw_ct = response.headers.get("Content-Type", "").lower().strip()
    # Normalise: "text/html; charset=utf-8" → "text/html"
    base_ct = raw_ct.split(";")[0].strip()
    if base_ct not in ("application/pdf", "text/html"):
        raise ContentTypeError(
            url=url,
            status=response.status_code,
            message=f"Unexpected Content-Type '{raw_ct}' for {url}",
        )

    log.info(
        "Fetch complete",
        url=url,
        status=response.status_code,
        content_type=base_ct,
        bytes=len(response.content),
    )
    return FetchResult(
        url=url,
        content=response.content,
        content_type=base_ct,
        http_status=response.status_code,
        fetched_at=datetime.now(tz=UTC),
    )


def check_robots(base_url: str, path: str = "/", config: FetchConfig | None = None) -> bool:
    """Return True if *path* is allowed by robots.txt at *base_url*, False if disallowed.

    Returns True (allowed) on any fetch error so the caller can proceed cautiously
    and the result is recorded honestly.
    """
    from urllib.parse import urljoin
    from urllib.robotparser import RobotFileParser

    cfg = config or FetchConfig()
    robots_url = urljoin(base_url, "/robots.txt")
    try:
        session = _make_session(cfg)
        resp = session.get(robots_url, timeout=(cfg.connect_timeout, cfg.read_timeout))
        if not resp.ok:
            log.warning("robots.txt not accessible", url=robots_url, status=resp.status_code)
            return True  # assume allowed; record honestly
        parser = RobotFileParser()
        parser.parse(resp.text.splitlines())
        allowed: bool = parser.can_fetch(cfg.user_agent, path)
        log.info("robots.txt checked", url=robots_url, path=path, allowed=allowed)
        return allowed
    except Exception as exc:  # noqa: BLE001
        log.warning("robots.txt check failed", url=robots_url, error=str(exc))
        return True
