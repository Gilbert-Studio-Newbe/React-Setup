#!/usr/bin/env python3
"""Export every unique SVG URL exposed by Rayon's public block catalogue.

This second-pass exporter treats the listing pages as the authoritative asset
inventory. It also resolves detail pages where possible so filenames retain
useful block names, but a missing detail-page association never causes an SVG
from the catalogue to be omitted.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from rayon_svg_export import (
    BASE_URL,
    Item,
    download_items,
    filename_slug,
    log,
    resolve_items,
    scrape_catalogue,
    write_manifest,
)


def asset_title(svg_url: str) -> str:
    basename = urlparse(svg_url).path.rsplit("/", 1)[-1]
    asset_id = basename.split("-", 1)[0]
    return f"Rayon asset {asset_id[:12]}"


def build_unique_asset_items(
    resolved_items: list[Item], listing_svg_urls: list[str]
) -> list[Item]:
    """Return exactly one item per unique direct SVG URL."""
    ordered_urls: list[str] = []
    preferred_by_url: dict[str, Item] = {}

    for item in resolved_items:
        if item.svg_url not in preferred_by_url:
            preferred_by_url[item.svg_url] = item
            ordered_urls.append(item.svg_url)

    for svg_url in listing_svg_urls:
        if svg_url not in preferred_by_url:
            preferred_by_url[svg_url] = Item(
                index=0,
                title=asset_title(svg_url),
                detail_url="",
                svg_url=svg_url,
            )
            ordered_urls.append(svg_url)

    unique_items: list[Item] = []
    for index, svg_url in enumerate(ordered_urls, start=1):
        source = preferred_by_url[svg_url]
        short_id = hashlib.sha1(svg_url.encode("utf-8")).hexdigest()[:8]
        unique_items.append(
            Item(
                index=index,
                title=source.title,
                detail_url=source.detail_url,
                svg_url=svg_url,
                filename=f"{index:04d}_{filename_slug(source.title)}_{short_id}.svg",
            )
        )
    return unique_items


def write_unresolved_pages(export_dir: Path, failures: list[dict[str, str]]) -> None:
    if not failures:
        return
    with (export_dir / "unresolved_block_pages.csv").open(
        "w", newline="", encoding="utf-8"
    ) as handle:
        writer = csv.DictWriter(handle, fieldnames=["detail_url", "error"])
        writer.writeheader()
        writer.writerows(failures)


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

    detail_links, fallback_map, listing_svgs, reported_pages = scrape_catalogue(
        args.max_pages
    )
    if not listing_svgs:
        raise RuntimeError("No SVG asset URLs were discovered in the Rayon catalogue")

    resolved_items, unresolved_pages = resolve_items(
        detail_links, fallback_map, args.workers
    )
    unique_items = build_unique_asset_items(resolved_items, listing_svgs)

    log(
        f"Preparing {len(unique_items)} unique SVG assets from "
        f"{len(detail_links)} catalogue entries"
    )
    downloaded = download_items(unique_items, svg_dir, args.workers)
    write_manifest(export_dir, downloaded)
    write_unresolved_pages(export_dir, unresolved_pages)

    failed_downloads = [item for item in downloaded if item.status != "downloaded"]
    if failed_downloads:
        with (export_dir / "download_failures.csv").open(
            "w", newline="", encoding="utf-8"
        ) as handle:
            writer = csv.DictWriter(
                handle, fieldnames=["svg_url", "filename", "error"]
            )
            writer.writeheader()
            for item in failed_downloads:
                writer.writerow(
                    {
                        "svg_url": item.svg_url,
                        "filename": item.filename,
                        "error": item.error,
                    }
                )

    finished = datetime.now(timezone.utc)
    summary = {
        "source": BASE_URL,
        "started_utc": started.isoformat(),
        "finished_utc": finished.isoformat(),
        "duration_seconds": round((finished - started).total_seconds(), 2),
        "catalogue_pages_reported": reported_pages,
        "catalogue_entries_discovered": len(detail_links),
        "unique_listing_svg_urls": len(listing_svgs),
        "unique_svg_assets_packaged": len(unique_items),
        "svgs_downloaded": sum(item.status == "downloaded" for item in downloaded),
        "download_failures": len(failed_downloads),
        "block_pages_without_metadata_association": len(unresolved_pages),
        "total_uncompressed_svg_bytes": sum(item.byte_count for item in downloaded),
    }
    (export_dir / "summary.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )
    (export_dir / "README.txt").write_text(
        "Rayon public block SVG export\n"
        "================================\n\n"
        f"Source: {BASE_URL}\n"
        f"Exported: {finished.isoformat()}\n"
        f"Catalogue entries found: {summary['catalogue_entries_discovered']}\n"
        f"Unique SVG assets found: {summary['unique_listing_svg_urls']}\n"
        f"SVG files downloaded: {summary['svgs_downloaded']}\n\n"
        "The svg/ directory contains one file for every unique SVG URL exposed by\n"
        "the public catalogue listing pages. manifest.csv records the direct source\n"
        "URL, optional block detail-page association, file size, and SHA-256 checksum.\n"
        "unresolved_block_pages.csv concerns only missing title/page associations;\n"
        "it does not remove SVG URLs found directly in the catalogue.\n",
        encoding="utf-8",
    )

    log("EXPORT_SUMMARY=" + json.dumps(summary, sort_keys=True))
    return 0 if not failed_downloads else 1


if __name__ == "__main__":
    raise SystemExit(main())
