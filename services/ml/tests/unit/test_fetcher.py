"""Unit tests for ingestion/fetcher.py."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from dengueahead.ingestion.fetcher import (
    ContentTypeError,
    FetchConfig,
    FetchError,
    FetchResult,
    fetch_document,
)


def _mock_response(
    status: int = 200, content: bytes = b"data", content_type: str = "text/html"
) -> MagicMock:
    resp = MagicMock()
    resp.ok = status < 400
    resp.status_code = status
    resp.content = content
    resp.headers = {"Content-Type": content_type}
    return resp


class TestFetchDocument:
    def test_successful_html_fetch(self) -> None:
        with patch("dengueahead.ingestion.fetcher.requests.Session") as MockSession:
            session = MockSession.return_value
            session.get.return_value = _mock_response(200, b"<html></html>", "text/html")
            result = fetch_document("https://example.com/report", FetchConfig())
        assert isinstance(result, FetchResult)
        assert result.content == b"<html></html>"
        assert result.content_type == "text/html"
        assert result.http_status == 200
        assert result.url == "https://example.com/report"
        assert result.fetched_at.tzinfo is not None

    def test_successful_pdf_fetch(self) -> None:
        with patch("dengueahead.ingestion.fetcher.requests.Session") as MockSession:
            session = MockSession.return_value
            session.get.return_value = _mock_response(200, b"%PDF-1.4", "application/pdf")
            result = fetch_document("https://example.com/report.pdf", FetchConfig())
        assert result.content_type == "application/pdf"

    def test_http_error_raises_fetch_error(self) -> None:
        with patch("dengueahead.ingestion.fetcher.requests.Session") as MockSession:
            session = MockSession.return_value
            session.get.return_value = _mock_response(404, b"Not Found", "text/html")
            with pytest.raises(FetchError) as exc_info:
                fetch_document("https://example.com/missing", FetchConfig())
        assert exc_info.value.status == 404

    def test_unexpected_content_type_raises(self) -> None:
        with patch("dengueahead.ingestion.fetcher.requests.Session") as MockSession:
            session = MockSession.return_value
            session.get.return_value = _mock_response(200, b"data", "application/json")
            with pytest.raises(ContentTypeError):
                fetch_document("https://example.com/api", FetchConfig())

    def test_network_error_raises_fetch_error(self) -> None:
        import requests as req_lib

        with patch("dengueahead.ingestion.fetcher.requests.Session") as MockSession:
            session = MockSession.return_value
            session.get.side_effect = req_lib.exceptions.ConnectionError("refused")
            with pytest.raises(FetchError) as exc_info:
                fetch_document("https://unreachable.example.com", FetchConfig())
        assert exc_info.value.status is None

    def test_content_type_with_charset_accepted(self) -> None:
        """text/html; charset=utf-8 should be treated as text/html."""
        with patch("dengueahead.ingestion.fetcher.requests.Session") as MockSession:
            session = MockSession.return_value
            session.get.return_value = _mock_response(200, b"<html>", "text/html; charset=utf-8")
            result = fetch_document("https://example.com", FetchConfig())
        assert result.content_type == "text/html"

    def test_fetch_does_not_write_to_disk(self, tmp_path: object) -> None:
        """fetch_document must never create files — that is snapshot.py's job."""
        import os

        before = set(os.listdir("."))
        with patch("dengueahead.ingestion.fetcher.requests.Session") as MockSession:
            session = MockSession.return_value
            session.get.return_value = _mock_response(200, b"<html>", "text/html")
            fetch_document("https://example.com", FetchConfig())
        after = set(os.listdir("."))
        assert before == after
