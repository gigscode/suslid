"""
We Work Remotely scraper — replaces the broken Upwork scraper.

Upwork's search page is a React SPA: plain httpx gets an empty shell
with no job data. We Work Remotely serves full HTML server-side and
is scrapable without a browser.

Source: https://weworkremotely.com
- No login required for public listings
- Server-rendered HTML, no JavaScript needed
- Covers web, design, programming, and other remote freelance work
"""

import re
import httpx
from bs4 import BeautifulSoup
from .models import PersonLead

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

# Timeout config — short enough to not block; long enough for slow responses
TIMEOUT = httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)

# Cap concurrent connections so we never hold a pool of open sockets
LIMITS = httpx.Limits(max_connections=5, max_keepalive_connections=2)


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:/hr)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


async def search_upwork(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Scrape We Work Remotely for jobs matching the query.
    The function name is kept as search_upwork so main.py needs no changes.
    """
    results: list[PersonLead] = []
    search_url = f"https://weworkremotely.com/remote-jobs/search?term={query.replace(' ', '+')}"
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=TIMEOUT,
            limits=LIMITS,
            proxies=proxies,
        ) as client:
            response = await client.get(search_url)
            if response.status_code != 200:
                print(f"[WeWorkRemotely] HTTP {response.status_code}")
                return results

        soup = BeautifulSoup(response.text, "html.parser")

        # WWR search results: <li class="feature"> or generic <li> inside <section>
        job_items = soup.select("section.jobs li:not(.view-all)")

        for item in job_items[:15]:
            try:
                link_el = item.select_one("a")
                if not link_el:
                    continue

                href = link_el.get("href", "")
                if not href or href == "#":
                    continue

                url_full = href if href.startswith("http") else f"https://weworkremotely.com{href}"

                # Title is in <span class="title">
                title_el = item.select_one("span.title")
                title = title_el.get_text(strip=True) if title_el else link_el.get_text(strip=True)
                if not title:
                    continue

                # Company in <span class="company">
                company_el = item.select_one("span.company")
                company = company_el.get_text(strip=True) if company_el else ""

                # Region/location
                region_el = item.select_one("span.region")
                region = region_el.get_text(strip=True) if region_el else ""

                snippet_parts = [p for p in [company, region] if p]
                snippet = " · ".join(snippet_parts)

                results.append(PersonLead(
                    source="upwork",  # kept as "upwork" so existing consumers don't change
                    title=title,
                    url=url_full,
                    snippet=snippet[:280],
                    budget=None,
                ))
            except Exception:
                continue

    except Exception as e:
        print(f"[WeWorkRemotely scraper] Error: {e}")

    return results[:10]
