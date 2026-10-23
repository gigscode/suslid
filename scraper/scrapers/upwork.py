"""
Upwork scraper using plain HTTP.

Upwork's RSS feed at /ab/feed/jobs/rss works without a browser.
We parse the XML directly — much lighter than Playwright.
"""

import re
import httpx
from bs4 import BeautifulSoup
from .models import PersonLead

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; SusLidResearch/1.0)",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
}


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:/hr)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


def _extract_skills(text: str) -> list[str]:
    m = re.search(r"Skills?[:\s]+([^\n<]{5,100})", text, re.IGNORECASE)
    if m:
        return [s.strip() for s in m.group(1).split(",") if s.strip()][:5]
    return []


async def search_upwork(query: str, proxy: str | None = None) -> list[PersonLead]:
    results: list[PersonLead] = []
    rss_url = f"https://www.upwork.com/ab/feed/jobs/rss?q={query.replace(' ', '+')}&sort=recency"

    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=15.0,
            proxies=proxies,
        ) as client:
            response = await client.get(rss_url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "xml")
        items = soup.find_all("item")

        for item in items[:15]:
            try:
                title = item.find("title")
                link = item.find("link")
                description = item.find("description")
                pub_date = item.find("pubDate")

                if not title or not link:
                    continue

                title_text = title.get_text(strip=True)
                link_text = link.get_text(strip=True)

                # Clean HTML from description
                desc_text = ""
                if description:
                    raw = description.get_text()
                    desc_soup = BeautifulSoup(raw, "html.parser")
                    desc_text = desc_soup.get_text(separator=" ", strip=True)[:280]

                posted_at = None
                if pub_date:
                    try:
                        from datetime import datetime
                        dt = datetime.strptime(
                            pub_date.get_text(strip=True),
                            "%a, %d %b %Y %H:%M:%S %z"
                        )
                        posted_at = dt.strftime("%b %d, %Y")
                    except Exception:
                        pass

                results.append(PersonLead(
                    source="upwork",
                    title=title_text,
                    url=link_text,
                    snippet=desc_text,
                    budget=_extract_budget(desc_text),
                    skills=_extract_skills(desc_text),
                    postedAt=posted_at,
                ))
            except Exception:
                continue

    except Exception as e:
        print(f"[Upwork scraper] Error: {e}")

    return results[:10]
