"""
Upwork scraper — NOTE: Upwork killed their RSS feed on August 20, 2024.
This module now scrapes Upwork's public job search pages directly using httpx.
No RSS, no login required for public listings.
"""

import re
import httpx
from bs4 import BeautifulSoup
from .models import PersonLead

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:/hr)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


async def search_upwork(query: str, proxy: str | None = None) -> list[PersonLead]:
    results: list[PersonLead] = []
    url = f"https://www.upwork.com/nx/search/jobs/?nq={query.replace(' ', '%20')}&sort=recency"
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=15.0,
            proxies=proxies,
        ) as client:
            response = await client.get(url)
            if response.status_code != 200:
                print(f"[Upwork] HTTP {response.status_code}")
                return results

        soup = BeautifulSoup(response.text, "html.parser")

        # Upwork job cards in their HTML search page
        cards = soup.select("article.job-tile, [data-ev-job-uid], .job-tile")

        for card in cards[:12]:
            try:
                title_el = card.select_one("h2 a, h3 a, .job-tile-title a")
                if not title_el:
                    continue
                title = title_el.get_text(strip=True)
                href = title_el.get("href", "")
                url_full = href if href.startswith("http") else f"https://www.upwork.com{href}"

                desc_el = card.select_one(".job-description, .description")
                snippet = desc_el.get_text(strip=True)[:280] if desc_el else ""

                budget_el = card.select_one(".budget, .js-budget, [data-test='budget']")
                budget = budget_el.get_text(strip=True)[:40] if budget_el else _extract_budget(snippet)

                results.append(PersonLead(
                    source="upwork",
                    title=title,
                    url=url_full,
                    snippet=snippet,
                    budget=budget,
                ))
            except Exception:
                continue

    except Exception as e:
        print(f"[Upwork scraper] Error: {e}")

    return results[:10]
