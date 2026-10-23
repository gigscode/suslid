"""
Forums scraper using plain HTTP + BeautifulSoup.

Targets public pages that don't need JavaScript:
- Indie Hackers (hiring/looking for posts)
- Dev.to (jobs tag)
- Freelancer.com project listings
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
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


async def search_devto(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Dev.to job/hiring posts via their public API — no browser needed."""
    results: list[PersonLead] = []
    # Dev.to has a public articles API
    url = f"https://dev.to/api/articles?tag=hiring&per_page=20&top=7"
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers={**HEADERS, "Accept": "application/json"},
            follow_redirects=True,
            timeout=12.0,
            proxies=proxies,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        articles = response.json()
        query_lower = query.lower()

        for article in articles:
            title = article.get("title", "")
            # Only include articles relevant to the query
            if query_lower not in title.lower() and query_lower not in (article.get("description") or "").lower():
                continue

            results.append(PersonLead(
                source="forum",
                title=title,
                url=article.get("url", ""),
                snippet=article.get("description", "")[:280],
                postedAt=article.get("published_at", "")[:10] or None,
            ))

    except Exception as e:
        print(f"[Dev.to scraper] Error: {e}")

    return results[:5]


async def search_freelancer(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Freelancer.com public project listings."""
    results: list[PersonLead] = []
    url = f"https://www.freelancer.com/jobs/{query.lower().replace(' ', '-')}/"
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=12.0,
            proxies=proxies,
        ) as client:
            response = await client.get(url)
            if response.status_code != 200:
                return results

        soup = BeautifulSoup(response.text, "html.parser")

        # Freelancer job cards
        cards = soup.select(".JobSearchCard-item, [data-project-id]")

        for card in cards[:10]:
            try:
                title_el = card.select_one(
                    ".JobSearchCard-primary-heading a, h2 a, .project-title a"
                )
                if not title_el:
                    continue

                title = title_el.get_text(strip=True)
                href = title_el.get("href", "")
                url_full = href if href.startswith("http") else f"https://www.freelancer.com{href}"

                desc_el = card.select_one(
                    ".JobSearchCard-primary-description, .project-description"
                )
                snippet = desc_el.get_text(strip=True)[:280] if desc_el else ""

                budget_el = card.select_one(
                    ".JobSearchCard-secondary-price, .project-budget"
                )
                budget = budget_el.get_text(strip=True)[:40] if budget_el else None

                results.append(PersonLead(
                    source="forum",
                    title=title,
                    url=url_full,
                    snippet=snippet,
                    budget=budget or _extract_budget(snippet),
                ))
            except Exception:
                continue

    except Exception as e:
        print(f"[Freelancer scraper] Error: {e}")

    return results[:5]


async def search_forums(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Run forum scrapers and combine results."""
    import asyncio
    all_results = await asyncio.gather(
        search_devto(query, proxy),
        search_freelancer(query, proxy),
        return_exceptions=True,
    )
    combined: list[PersonLead] = []
    for r in all_results:
        if isinstance(r, list):
            combined.extend(r)
    return combined[:10]
