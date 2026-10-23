"""
Job board scrapers using free, keyless public APIs.

Sources (all verified working October 2026):
1. RemoteJobs.org  — free JSON API, no key, remote jobs worldwide
2. Arbeitnow.com   — free JSON API, no key, pulls from Greenhouse/SmartRecruiters/etc
3. Dev.to          — free JSON API, no key, tech hiring articles
4. Freelancer.com  — public HTML, no login required

All return JSON or parseable HTML without needing a browser.
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
    "Accept": "application/json, text/html",
}


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


async def search_remotejobs(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    RemoteJobs.org — free JSON API, no key needed.
    Returns remote freelance and full-time jobs worldwide.
    Docs: https://remotejobs.org/developers/api
    """
    results: list[PersonLead] = []
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=12.0,
            proxies=proxies,
        ) as client:
            response = await client.get(
                "https://remotejobs.org/api/jobs",
                params={"search": query, "limit": 15},
            )
            if response.status_code != 200:
                print(f"[RemoteJobs] HTTP {response.status_code}")
                return results

        data = response.json()
        jobs = data if isinstance(data, list) else data.get("jobs", data.get("data", []))

        for job in jobs[:12]:
            if not isinstance(job, dict):
                continue
            title = job.get("title") or job.get("position") or ""
            url = job.get("url") or job.get("apply_url") or job.get("link") or ""
            company = job.get("company") or job.get("company_name") or ""
            description = job.get("description") or job.get("snippet") or ""
            if isinstance(description, str):
                description = description[:280]
            date = job.get("published_at") or job.get("date") or ""

            if not title or not url:
                continue

            results.append(PersonLead(
                source="forum",
                title=f"{title} — {company}" if company else title,
                url=url,
                snippet=description,
                postedAt=str(date)[:10] if date else None,
                budget=_extract_budget(description),
            ))

    except Exception as e:
        print(f"[RemoteJobs scraper] Error: {e}")

    return results[:8]


async def search_arbeitnow(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Arbeitnow.com — free, keyless JSON API.
    Aggregates jobs from Greenhouse, SmartRecruiters, Join.com, TeamTailor, etc.
    Endpoint: https://www.arbeitnow.com/api/job-board-api
    """
    results: list[PersonLead] = []
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=12.0,
            proxies=proxies,
        ) as client:
            response = await client.get(
                "https://www.arbeitnow.com/api/job-board-api",
                params={"search": query, "page": 1},
            )
            if response.status_code != 200:
                print(f"[Arbeitnow] HTTP {response.status_code}")
                return results

        data = response.json()
        jobs = data.get("data", [])

        for job in jobs[:12]:
            title = job.get("title", "")
            url = job.get("url", "")
            company = job.get("company_name", "")
            description = (job.get("description") or "")[:280]
            date = job.get("created_at", "")
            remote = job.get("remote", False)

            if not title or not url:
                continue

            label = f"{title} — {company}" if company else title
            if remote:
                label += " [Remote]"

            results.append(PersonLead(
                source="forum",
                title=label,
                url=url,
                snippet=description,
                postedAt=str(date)[:10] if date else None,
            ))

    except Exception as e:
        print(f"[Arbeitnow scraper] Error: {e}")

    return results[:8]


async def search_devto(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Dev.to public articles API — filter by 'hiring' tag.
    Only include articles matching the query.
    """
    results: list[PersonLead] = []
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers={**HEADERS, "Accept": "application/json"},
            follow_redirects=True,
            timeout=12.0,
            proxies=proxies,
        ) as client:
            response = await client.get(
                "https://dev.to/api/articles",
                params={"tag": "hiring", "per_page": 30, "top": 7},
            )
            if response.status_code != 200:
                return results

        articles = response.json()
        query_lower = query.lower()

        for article in articles:
            title = article.get("title", "")
            description = article.get("description", "") or ""
            # Only include if relevant to query
            if query_lower not in title.lower() and query_lower not in description.lower():
                continue

            results.append(PersonLead(
                source="forum",
                title=title,
                url=article.get("url", ""),
                snippet=description[:280],
                postedAt=(article.get("published_at") or "")[:10] or None,
            ))

    except Exception as e:
        print(f"[Dev.to scraper] Error: {e}")

    return results[:5]


async def search_freelancer(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Freelancer.com public project listings — HTML scraping."""
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
        cards = soup.select(".JobSearchCard-item, [data-project-id]")

        for card in cards[:8]:
            title_el = card.select_one(".JobSearchCard-primary-heading a, h2 a")
            if not title_el:
                continue
            title = title_el.get_text(strip=True)
            href = title_el.get("href", "")
            url_full = href if href.startswith("http") else f"https://www.freelancer.com{href}"
            desc_el = card.select_one(".JobSearchCard-primary-description")
            snippet = desc_el.get_text(strip=True)[:280] if desc_el else ""
            budget_el = card.select_one(".JobSearchCard-secondary-price")
            budget = budget_el.get_text(strip=True)[:40] if budget_el else None

            results.append(PersonLead(
                source="forum",
                title=title,
                url=url_full,
                snippet=snippet,
                budget=budget,
            ))

    except Exception as e:
        print(f"[Freelancer scraper] Error: {e}")

    return results[:8]


async def search_forums(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Run all forum/job-board scrapers in parallel."""
    import asyncio
    all_results = await asyncio.gather(
        search_remotejobs(query, proxy),
        search_arbeitnow(query, proxy),
        search_devto(query, proxy),
        search_freelancer(query, proxy),
        return_exceptions=True,
    )
    combined: list[PersonLead] = []
    for r in all_results:
        if isinstance(r, list):
            combined.extend(r)
        else:
            print(f"[forums] source failed: {r}")
    return combined[:15]
