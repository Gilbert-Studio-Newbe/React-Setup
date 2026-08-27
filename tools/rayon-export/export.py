from __future__ import annotations

import concurrent.futures as futures
import csv
import hashlib
import html
import json
import os
import re
import shutil
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import unquote, urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://www.rayon.design"
CATALOG_URL = f"{BASE_URL}/assets/blocks"
OUTPUT_DIR = Path("export-output")
SVG_DIR = OUTPUT_DIR / "svg"
MAX_CATALOG_PAGES = 200
CATALOG_WORKERS = 6
DETAIL_WORKERS = 10
DOWNLOAD_WORKERS = 12
MIN_EXPECTED_BLOCKS = 2_000
MIN_COVERAGE = 0.985
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"
)
HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,image/svg+xml,*/*;q=0.8",
    "Accept-Language": "en-AU,en;q=0.9",
    "Cache-Control": "no-cache",
}
SVG_PATTERN = re.compile(
    r"https://cdn\.sanity\.io/images/rhvb8nfd/production/"
    r"[A-Za-z0-9._~-]+\.svg(?:\?[^\s\"'<>\\)]*)?",
    re.IGNORECASE,
)
PAGE_PATTERN = re.compile(r"[?&](?:amp;)?page=(\d+)", re.IGNORECASE)
DETAIL_PATTERN = re.compile(r"^/assets/blocks/[^/?#]+$")


@dataclass(frozen=True)
class Block:
    detail_path: str
    svg_url: str


def request_bytes(url: str, attempts: int = 6, timeout: int = 45) -> tuple[bytes, str]:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            response = requests.get(url, headers=HEADERS, timeout=timeout)
            if response.status_code == 429:
                retry_after = float(response.headers.get("Retry-After", "2"))
                time.sleep(min(20, retry_after + attempt))
                continue
            response.raise_for_status()
            return response.content, response.headers.get("content-type", "")
        except Exception as exc:  # noqa: BLE001 - retries aggregate transport failures
            last_error = exc
            if isinstance(exc, requests.HTTPError):
                status = exc.response.status_code if exc.response is not None else 0
                if status in {400, 401, 403, 404}:
                    break
            time.sleep(min(12, 0.8 * (2**attempt)))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def request_text(url: str) -> str:
    data, _ = request_bytes(url)
    return data.decode("utf-8", errors="replace")


def decoded_variants(value: str) -> list[str]:
    variants: list[str] = []
    current = html.unescape(value)
    for _ in range(5):
        current = (
            current.replace("\\/", "/")
            .replace("\\u002F", "/")
            .replace("\\u002f", "/")
            .replace("\\u003A", ":")
            .replace("\\u003a", ":")
            .replace("\\u0026", "&")
        )
        if current not in variants:
            variants.append(current)
        next_value = unquote(current)
        if next_value == current:
            break
        current = next_value
    return variants


def extract_svg_urls(value: str) -> set[str]:
    urls: set[str] = set()
    for variant in decoded_variants(value):
        for match in SVG_PATTERN.finditer(variant):
            url = match.group(0).rstrip(".,;])}")
            # The original Sanity asset is already an SVG; image-transform query strings
            # are unnecessary and sometimes cause content negotiation to return a raster.
            urls.add(url.split("?", 1)[0])
    return urls


def extract_page_numbers(value: str) -> set[int]:
    numbers: set[int] = set()
    for variant in decoded_variants(value):
        numbers.update(int(item) for item in PAGE_PATTERN.findall(variant))
    return {number for number in numbers if 1 <= number <= MAX_CATALOG_PAGES}


def detail_paths_from_soup(soup: BeautifulSoup) -> set[str]:
    paths: set[str] = set()
    for anchor in soup.find_all("a", href=True):
        href = str(anchor.get("href", ""))
        parsed = urlparse(urljoin(BASE_URL, href))
        if parsed.netloc.endswith("rayon.design") and DETAIL_PATTERN.match(parsed.path):
            paths.add(parsed.path)
    return paths


def parse_catalog_page(page_number: int, text: str) -> tuple[dict[str, str], set[str], set[int]]:
    soup = BeautifulSoup(text, "html.parser")
    paths = detail_paths_from_soup(soup)
    mapping: dict[str, str] = {}

    # A card contains both its block detail link and its Next/Image URL. Parsing the
    # card first gives us descriptive filenames without having to request every detail page.
    for anchor in soup.find_all("a", href=True):
        href = str(anchor.get("href", ""))
        parsed = urlparse(urljoin(BASE_URL, href))
        if not (parsed.netloc.endswith("rayon.design") and DETAIL_PATTERN.match(parsed.path)):
            continue
        urls = extract_svg_urls(str(anchor))
        if len(urls) == 1:
            mapping[parsed.path] = next(iter(urls))

    # Next.js can serialize card data outside the anchor markup. Keep every discovered
    # SVG URL so unpaired assets are not silently discarded.
    all_urls = extract_svg_urls(text)
    page_numbers = extract_page_numbers(text)
    print(
        f"catalog page {page_number}: {len(paths)} blocks, "
        f"{len(mapping)} paired, {len(all_urls)} SVG URLs",
        flush=True,
    )
    return mapping, all_urls, page_numbers


def catalog_page_url(page_number: int) -> str:
    return CATALOG_URL if page_number == 1 else f"{CATALOG_URL}?page={page_number}"


def fetch_catalog_page(page_number: int) -> tuple[int, str]:
    return page_number, request_text(catalog_page_url(page_number))


def discover_catalog() -> tuple[set[str], dict[str, str], set[str], list[dict[str, object]]]:
    first_text = request_text(CATALOG_URL)
    first_mapping, first_urls, page_numbers = parse_catalog_page(1, first_text)
    highest_reported_page = max(page_numbers) if page_numbers else 90
    highest_reported_page = min(MAX_CATALOG_PAGES, max(1, highest_reported_page))

    all_paths = set(first_mapping)
    # Include every detail link even when the image URL was not paired.
    all_paths.update(detail_paths_from_soup(BeautifulSoup(first_text, "html.parser")))
    mapping = dict(first_mapping)
    all_urls = set(first_urls)
    report: list[dict[str, object]] = [
        {
            "page": 1,
            "url": CATALOG_URL,
            "blocks": len(detail_paths_from_soup(BeautifulSoup(first_text, "html.parser"))),
            "paired": len(first_mapping),
            "svg_urls": len(first_urls),
        }
    ]

    pages = list(range(2, highest_reported_page + 1))
    with futures.ThreadPoolExecutor(max_workers=CATALOG_WORKERS) as executor:
        for page_number, text in executor.map(fetch_catalog_page, pages):
            page_mapping, page_urls, discovered_pages = parse_catalog_page(page_number, text)
            page_paths = detail_paths_from_soup(BeautifulSoup(text, "html.parser"))
            all_paths.update(page_paths)
            mapping.update(page_mapping)
            all_urls.update(page_urls)
            report.append(
                {
                    "page": page_number,
                    "url": catalog_page_url(page_number),
                    "blocks": len(page_paths),
                    "paired": len(page_mapping),
                    "svg_urls": len(page_urls),
                }
            )
            if discovered_pages:
                highest_reported_page = max(highest_reported_page, max(discovered_pages))

    # Probe beyond the advertised final page. Rayon has added pages over time, and stale
    # cached pagination should not truncate the export. Stop after two pages add no new blocks.
    empty_or_duplicate = 0
    probe_page = highest_reported_page + 1
    while probe_page <= MAX_CATALOG_PAGES and empty_or_duplicate < 2:
        text = request_text(catalog_page_url(probe_page))
        page_mapping, page_urls, _ = parse_catalog_page(probe_page, text)
        page_paths = detail_paths_from_soup(BeautifulSoup(text, "html.parser"))
        new_paths = page_paths - all_paths
        report.append(
            {
                "page": probe_page,
                "url": catalog_page_url(probe_page),
                "blocks": len(page_paths),
                "paired": len(page_mapping),
                "svg_urls": len(page_urls),
                "new_blocks": len(new_paths),
                "probe": True,
            }
        )
        if new_paths:
            empty_or_duplicate = 0
            all_paths.update(page_paths)
            mapping.update(page_mapping)
            all_urls.update(page_urls)
        else:
            empty_or_duplicate += 1
        probe_page += 1

    return all_paths, mapping, all_urls, sorted(report, key=lambda row: int(row["page"]))


def discover_from_detail(path: str) -> tuple[str, str | None, str | None]:
    try:
        text = request_text(urljoin(BASE_URL, path))
        urls = extract_svg_urls(text)
        if not urls:
            return path, None, "No Sanity SVG URL found"
        # Detail pages normally contain one SVG block image. When there are several,
        # prefer the first deterministic URL and record that choice in the manifest.
        return path, sorted(urls)[0], None
    except Exception as exc:  # noqa: BLE001
        return path, None, str(exc)


def fill_missing_mappings(paths: set[str], mapping: dict[str, str]) -> list[dict[str, str]]:
    missing = sorted(paths - set(mapping))
    failures: list[dict[str, str]] = []
    if not missing:
        return failures

    print(f"fetching {len(missing)} detail pages that were not paired on catalogue cards", flush=True)
    with futures.ThreadPoolExecutor(max_workers=DETAIL_WORKERS) as executor:
        for index, (path, svg_url, error) in enumerate(executor.map(discover_from_detail, missing), 1):
            if svg_url:
                mapping[path] = svg_url
            else:
                failures.append({"detail_path": path, "error": error or "Unknown error"})
            if index % 100 == 0 or index == len(missing):
                print(
                    f"detail recovery {index}/{len(missing)}: "
                    f"mapped {len(mapping)}/{len(paths)}, failures {len(failures)}",
                    flush=True,
                )
    return failures


def safe_slug(path: str) -> str:
    raw = unquote(urlparse(path).path.rstrip("/").split("/")[-1])
    display = raw.split("--", 1)[0]
    slug = re.sub(r"[^A-Za-z0-9._-]+", "-", display).strip("-._")
    return (slug or "rayon-block")[:120]


def download_svg(url: str) -> tuple[str, bytes | None, str, str | None]:
    try:
        data, content_type = request_bytes(url)
        head = data[:4096].lstrip().lower()
        if b"<svg" not in head and "image/svg" not in content_type.lower():
            return url, None, content_type, "Response was not SVG content"
        return url, data, content_type, None
    except Exception as exc:  # noqa: BLE001
        return url, None, "", str(exc)


def download_all(blocks: Iterable[Block]) -> tuple[list[dict[str, object]], list[dict[str, str]]]:
    SVG_DIR.mkdir(parents=True, exist_ok=True)
    block_list = sorted(blocks, key=lambda item: item.detail_path)
    unique_urls = sorted({block.svg_url for block in block_list})
    payloads: dict[str, tuple[bytes, str]] = {}
    failures: list[dict[str, str]] = []

    with futures.ThreadPoolExecutor(max_workers=DOWNLOAD_WORKERS) as executor:
        for index, (url, data, content_type, error) in enumerate(executor.map(download_svg, unique_urls), 1):
            if data is not None:
                payloads[url] = (data, content_type)
            else:
                failures.append({"svg_url": url, "error": error or "Unknown error"})
            if index % 100 == 0 or index == len(unique_urls):
                print(
                    f"SVG downloads {index}/{len(unique_urls)}: "
                    f"success {len(payloads)}, failures {len(failures)}",
                    flush=True,
                )

    records: list[dict[str, object]] = []
    used_names: set[str] = set()
    for block in block_list:
        payload = payloads.get(block.svg_url)
        if payload is None:
            continue
        data, content_type = payload
        suffix = hashlib.sha256(block.detail_path.encode("utf-8")).hexdigest()[:10]
        filename = f"{safe_slug(block.detail_path)}__{suffix}.svg"
        counter = 2
        while filename.lower() in used_names:
            filename = f"{safe_slug(block.detail_path)}__{suffix}_{counter}.svg"
            counter += 1
        used_names.add(filename.lower())
        (SVG_DIR / filename).write_bytes(data)
        records.append(
            {
                "filename": filename,
                "block_name": safe_slug(block.detail_path).replace("-", " "),
                "detail_url": urljoin(BASE_URL, block.detail_path),
                "svg_url": block.svg_url,
                "bytes": len(data),
                "sha256": hashlib.sha256(data).hexdigest(),
                "content_type": content_type,
            }
        )

    return records, failures


def write_outputs(
    records: list[dict[str, object]],
    catalog_paths: set[str],
    mapping: dict[str, str],
    catalogue_urls: set[str],
    catalogue_report: list[dict[str, object]],
    detail_failures: list[dict[str, str]],
    download_failures: list[dict[str, str]],
) -> dict[str, object]:
    with (OUTPUT_DIR / "manifest.csv").open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=[
                "filename",
                "block_name",
                "detail_url",
                "svg_url",
                "bytes",
                "sha256",
                "content_type",
            ],
        )
        writer.writeheader()
        writer.writerows(records)

    summary: dict[str, object] = {
        "source": CATALOG_URL,
        "catalogue_pages_fetched": len(catalogue_report),
        "block_detail_pages_discovered": len(catalog_paths),
        "catalogue_svg_urls_discovered": len(catalogue_urls),
        "blocks_mapped_to_svg": len(mapping),
        "svg_files_written": len(records),
        "unique_svg_source_urls_downloaded": len({str(row["svg_url"]) for row in records}),
        "total_uncompressed_bytes": sum(int(row["bytes"]) for row in records),
        "detail_failures": detail_failures,
        "download_failures": download_failures,
        "catalogue_report": catalogue_report,
    }
    (OUTPUT_DIR / "summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    (OUTPUT_DIR / "README.txt").write_text(
        "Rayon free block SVG export\n"
        f"Source: {CATALOG_URL}\n"
        f"SVG files: {len(records)}\n\n"
        "The svg/ folder contains one SVG file per discovered Rayon block.\n"
        "manifest.csv records the original block and SVG URLs plus SHA-256 checksums.\n"
        "summary.json records crawl coverage and any failures.\n",
        encoding="utf-8",
    )
    return summary


def main() -> None:
    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)

    paths, mapping, catalogue_urls, catalogue_report = discover_catalog()
    print(
        f"catalogue discovery: {len(paths)} block pages, {len(mapping)} paired, "
        f"{len(catalogue_urls)} unique SVG URLs",
        flush=True,
    )

    if len(paths) < MIN_EXPECTED_BLOCKS:
        raise RuntimeError(
            f"Only {len(paths)} blocks were discovered; expected at least {MIN_EXPECTED_BLOCKS}. "
            "Refusing to publish an obviously partial export."
        )

    detail_failures = fill_missing_mappings(paths, mapping)
    coverage = len(mapping) / len(paths)
    if coverage < MIN_COVERAGE:
        raise RuntimeError(
            f"Only {len(mapping)} of {len(paths)} blocks have SVG URLs "
            f"({coverage:.2%}); required coverage is {MIN_COVERAGE:.2%}."
        )

    blocks = [Block(path, mapping[path]) for path in sorted(paths) if path in mapping]
    records, download_failures = download_all(blocks)
    download_coverage = len(records) / len(blocks) if blocks else 0
    if download_coverage < MIN_COVERAGE:
        raise RuntimeError(
            f"Only {len(records)} of {len(blocks)} mapped blocks downloaded "
            f"({download_coverage:.2%}); refusing a partial export."
        )

    summary = write_outputs(
        records,
        paths,
        mapping,
        catalogue_urls,
        catalogue_report,
        detail_failures,
        download_failures,
    )
    print(json.dumps({key: value for key, value in summary.items() if not isinstance(value, list)}, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"FATAL: {exc}", file=sys.stderr, flush=True)
        raise
