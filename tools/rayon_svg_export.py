#!/usr/bin/env python3
"""Download every SVG block exposed by Rayon's public assets catalogue."""

from __future__ import annotations

import argparse
import csv
import hashlib
import html as html_lib
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlparse
from urllib.request import Request, urlopen

BASE_URL = "https://www.rayon.design/assets/blocks"
SANITY_PATH = "cdn.sanity.io/images/rhvb8nfd/production/"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)
DETAIL_LINK_RE = re.compile(
    r'''href\s*=\s*["'](?P<href>[^"']*?/assets/blocks/[^"'#?]+)["']''',
    re.IGNORECASE,
)
PAGE_RE = re.compile(r"(?:[?&]|&amp;)page=(\d+)", re.IGNORECASE)
SVG_URL_RE = re.compile(
    r"https://cdn\.sanity\.io/images/rhvb8nfd/production/[^\s\"'<>\\?&#]+?\.svg",
    re.IGNORECASE,
)
H1_RE = re.compile(r"<h1[^>]*>(.*?)</h1>", re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r"<[^>]+>")


@dataclass
class Item:
    index: int
    title: str
    detail_url: str
    svg_url: str
    filename: str = ""
    status: str = "pending"
    byte_count: int = 0
    sha256: str = ""
    error: str = ""


def log(message: str) -> None:
    print(message, flush=True)


def fetch_bytes(url: str, attempts: int = 6, timeout: int = 45) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        request = Request(
            url,
            headers={
                "User-Agent": USER_AGENT,
                "Accept": "text/html,application/xhtml+xml,application/xml,image/svg+xml,*/*;q=0.8",
                "Accept-Language": "en-AU,en;q=0.9",
                "Cache-Control": "no-cache",
            },
        )
        try:
            with urlopen(request, timeout=timeout) as response:
                return response.read()
        except HTTPError as exc:
            last_error = exc
            if exc.code not in {408, 425, 429, 500, 502, 503, 504}:
                raise
            retry_after = exc.headers.get("Retry-After")
            delay = (
                float(retry_after)
                if retry_after and retry_after.isdigit()
                else min(30.0, 1.5**attempt)
            )
        except (URLError, TimeoutError, ConnectionError) as exc:
            last_error = exc
            delay = min(30.0, 1.5**attempt)
        if attempt < attempts:
            time.sleep(delay)
    raise RuntimeError(f"Failed after {attempts} attempts: {url}: {last_error}")


def fetch_text(url: str) -> str:
    return fetch_bytes(url).decode("utf-8", errors="replace")


def unique(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value and value not in seen:
            seen.add(value)
            result.append(value)
    return result


def normalized(raw: str) -> str:
    value = html_lib.unescape(raw)
    value = re.sub(r"\\u002[fF]", "/", value)
    value = re.sub(r"\\u003[aA]", ":", value)
    value = value.replace(r"\/", "/")
    for _ in range(2):
        decoded = unquote(value)
        if decoded == value:
            break
        value = decoded
    return value


def extract_svg_urls(raw_html: str) -> list[str]:
    urls = [m.group(0) for m in SVG_URL_RE.finditer(normalized(raw_html))]
    return unique(url for url in urls if SANITY_PATH in url)


def extract_detail_links(raw_html: str) -> list[str]:
    source = html_lib.unescape(raw_html)
    links: list[str] = []
    for match in DETAIL_LINK_RE.finditer(source):
        absolute = urljoin(BASE_URL, match.group("href"))
        if urlparse(absolute).path.rstrip("/") != "/assets/blocks":
            links.append(absolute)
    return unique(links)


def title_from_url(detail_url: str) -> str:
    slug = urlparse(detail_url).path.rstrip("/").split("/")[-1]
    return slug.split("--", 1)[0].replace("-", " ").strip().title() or "Rayon block"


def title_from_html(raw_html: str, detail_url: str) -> str:
    match = H1_RE.search(raw_html)
    if match:
        value = TAG_RE.sub(" ", match.group(1))
        value = re.sub(r"\s+", " ", html_lib.unescape(value)).strip()
        if value:
            return value
    return title_from_url(detail_url)


def filename_slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value[:90] or "rayon-block"


def scrape_catalogue(max_pages: int | None) -> tuple[list[str], dict[str, str], list[str], int]:
    first_html = fetch_text(BASE_URL)
    page_numbers = [int(x) for x in PAGE_RE.findall(first_html)]
    page_count = max_pages or max(page_numbers, default=89)
    log(f"Catalogue reports up to {page_count} pages")

    all_links: list[str] = []
    fallback_map: dict[str, str] = {}
    all_listing_svgs: list[str] = []
    consecutive_empty = 0

    for page_number in range(1, page_count + 1):
        page_url = BASE_URL if page_number == 1 else f"{BASE_URL}?page={page_number}"
        raw_html = first_html if page_number == 1 else fetch_text(page_url)
        links = extract_detail_links(raw_html)
        svgs = extract_svg_urls(raw_html)

        if links and len(svgs) == len(links):
            for detail_url, svg_url in zip(links, svgs):
                fallback_map.setdefault(detail_url, svg_url)

        before = len(all_links)
        all_links = unique([*all_links, *links])
        all_listing_svgs = unique([*all_listing_svgs, *svgs])
        new_count = len(all_links) - before
        log(
            f"Page {page_number:02d}/{page_count}: {len(links)} links, "
            f"{len(svgs)} SVG URLs, {new_count} new blocks"
        )

        consecutive_empty = consecutive_empty + 1 if not links or new_count == 0 else 0
        if page_number >= 10 and consecutive_empty >= 3:
            log("Stopping after three consecutive pages with no new blocks")
            break

    return all_links, fallback_map, all_listing_svgs, page_count


def resolve_detail(detail_url: str) -> tuple[str, str]:
    raw_html = fetch_text(detail_url)
    candidates = extract_svg_urls(raw_html)
    if not candidates:
        raise RuntimeError("No direct Sanity SVG URL found in detail page")
    return title_from_html(raw_html, detail_url), candidates[0]


def resolve_items(
    detail_links: list[str], fallback_map: dict[str, str], workers: int
) -> tuple[list[Item], list[dict[str, str]]]:
    resolved: dict[str, tuple[str, str]] = {
        url: (title_from_url(url), svg_url) for url, svg_url in fallback_map.items()
    }
    failures: list[dict[str, str]] = []
    unresolved = [url for url in detail_links if url not in resolved]
    log(
        f"Resolved {len(resolved)} blocks from catalogue HTML; "
        f"fetching {len(unresolved)} detail pages"
    )

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(resolve_detail, url): url for url in unresolved}
        for completed, future in enumerate(as_completed(futures), start=1):
            detail_url = futures[future]
            try:
                resolved[detail_url] = future.result()
            except Exception as exc:
                failures.append({"detail_url": detail_url, "error": str(exc)})
            if completed % 100 == 0 or completed == len(unresolved):
                log(f"Detail pages: {completed}/{len(unresolved)} complete")

    items: list[Item] = []
    for index, detail_url in enumerate(detail_links, start=1):
        if detail_url not in resolved:
            continue
        title, svg_url = resolved[detail_url]
        short_id = hashlib.sha1(detail_url.encode()).hexdigest()[:8]
        items.append(
            Item(
                index=index,
                title=title,
                detail_url=detail_url,
                svg_url=svg_url,
                filename=f"{index:04d}_{filename_slug(title)}_{short_id}.svg",
            )
        )
    return items, failures


def looks_like_svg(data: bytes) -> bool:
    sample = data[:8192].lstrip(b"\xef\xbb\xbf\x00\t\r\n ")
    return b"<svg" in sample.lower()


def download_one(item: Item, svg_dir: Path) -> Item:
    try:
        data = fetch_bytes(item.svg_url)
        if not looks_like_svg(data):
            raise RuntimeError("Downloaded response does not contain an SVG root element")
        (svg_dir / item.filename).write_bytes(data)
        item.status = "downloaded"
        item.byte_count = len(data)
        item.sha256 = hashlib.sha256(data).hexdigest()
    except Exception as exc:
        item.status = "failed"
        item.error = str(exc)
    return item


def download_items(items: list[Item], svg_dir: Path, workers: int) -> list[Item]:
    svg_dir.mkdir(parents=True, exist_ok=True)
    completed_items: list[Item] = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(download_one, item, svg_dir): item for item in items}
        for done, future in enumerate(as_completed(futures), start=1):
            completed_items.append(future.result())
            if done % 100 == 0 or done == len(items):
                successful = sum(i.status == "downloaded" for i in completed_items)
                log(f"SVG downloads: {done}/{len(items)} complete ({successful} successful)")
    return sorted(completed_items, key=lambda item: item.index)


def write_manifest(export_dir: Path, items: list[Item]) -> None:
    fields = [
        "index",
        "title",
        "filename",
        "detail_url",
        "svg_url",
        "status",
        "byte_count",
        "sha256",
        "error",
    ]
    with (export_dir / "manifest.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        for item in items:
            row = asdict(item)
            writer.writerow({field: row[field] for field in fields})


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="export")
    parser.add_argument("--workers", type=int, default=12)
    parser.add_argument("--max-pages", type=int, default=None)
    args = parser.parse_args()

    started = datetime.now(timezone.utc)
    export_dir = Path(args.output).resolve()
    svg_dir = export_dir / "svg"
    export_dir.mkdir(parents=True, exist_ok=True)

    detail_links, fallback_map, listing_svgs, reported_pages = scrape_catalogue(args.max_pages)
    if not detail_links:
        raise RuntimeError("No Rayon block detail links were discovered")
    log(
        f"Discovered {len(detail_links)} unique block pages and "
        f"{len(listing_svgs)} unique SVG URLs in catalogue HTML"
    )

    items, resolution_failures = resolve_items(detail_links, fallback_map, args.workers)
    downloaded = download_items(items, svg_dir, args.workers)
    write_manifest(export_dir, downloaded)

    failed_downloads = [item for item in downloaded if item.status != "downloaded"]
    failures = resolution_failures + [
        {"detail_url": item.detail_url, "error": item.error} for item in failed_downloads
    ]
    if failures:
        with (export_dir / "failures.csv").open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=["detail_url", "error"])
            writer.writeheader()
            writer.writerows(failures)

    finished = datetime.now(timezone.utc)
    summary = {
        "source": BASE_URL,
        "started_utc": started.isoformat(),
        "finished_utc": finished.isoformat(),
        "duration_seconds": round((finished - started).total_seconds(), 2),
        "catalogue_pages_reported": reported_pages,
        "block_pages_discovered": len(detail_links),
        "listing_svg_urls_discovered": len(listing_svgs),
        "items_resolved": len(items),
        "svgs_downloaded": sum(item.status == "downloaded" for item in downloaded),
        "resolution_failures": len(resolution_failures),
        "download_failures": len(failed_downloads),
        "total_bytes": sum(item.byte_count for item in downloaded),
    }
    (export_dir / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (export_dir / "README.txt").write_text(
        "Rayon public block SVG export\n"
        "================================\n\n"
        f"Source: {BASE_URL}\n"
        f"Exported: {finished.isoformat()}\n"
        f"SVG files downloaded: {summary['svgs_downloaded']}\n"
        f"Block pages discovered: {summary['block_pages_discovered']}\n\n"
        "The svg/ directory contains one named SVG file per resolved catalogue block.\n"
        "manifest.csv records the original page, direct source URL, file size, and SHA-256.\n",
        encoding="utf-8",
    )
    log("EXPORT_SUMMARY=" + json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        raise
    except Exception as exc:
        print(f"FATAL: {exc}", file=sys.stderr, flush=True)
        raise
