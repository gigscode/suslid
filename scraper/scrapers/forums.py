"""
Job board scrapers using free, keyless public APIs and scrapable HTML.

Sources (all verified working October 2026):
1. RemoteJobs.org  — free JSON API, no key, remote jobs worldwide
2. Arbeitnow.com   — free JSON API, no key, aggregates Greenhouse/SmartRecruiters/etc
3. Jobicy.com      — free JSON API, no key, remote-only jobs
4. Dev.to          — free JSON API, no key, tech hiring articles

Sources removed:
- Freelancer.com HTML: JavaScript-rendered, plain httpx gets no data
- Reddit: shut down unauthenticated scraping May 28, 2026 (403)
"""

import asyncio
import re
import httpx
from .models import PersonLead

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/html",
}

# Tight timeouts so a slow source never hangs the whole request
TIMEOUT = httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
LIMITS = httpx.Limits(max_connections=5, max_keepalive_connections=2)


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


async def search_remotejobs(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    RemoteJobs.org — free JSON API, no key needed.
    https://remotejobs.org/developers/api
    """
    results: list[PersonLead] = []
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=TIMEOUT,
            limits=LIMITS,
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
            description = (job.get("description") or job.get("snippet") or "")[:280]
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
        print(f"[RemoteJobs] Error: {e}")

    return results[:8]


async def search_arbeitnow(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Arbeitnow.com — free, keyless JSON API.
    Aggregates from Greenhouse, SmartRecruiters, Join.com, TeamTailor.
    https://www.arbeitnow.com/api/job-board-api
    """
    results: list[PersonLead] = []
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=TIMEOUT,
            limits=LIMITS,
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
        print(f"[Arbeitnow] Error: {e}")

    return results[:8]


async def search_jobicy(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Jobicy.com — free, keyless JSON API for remote jobs.
    Endpoint: https://jobicy.com/api/v2/remote-jobs
    Supports ?tag= and ?count= params.
    """
    results: list[PersonLead] = []
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    # Jobicy uses a tag search — take the first meaningful word as the tag
    tag = query.split()[0].lower() if query.strip() else "developer"

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=TIMEOUT,
            limits=LIMITS,
            proxies=proxies,
        ) as client:
            response = await client.get(
                "https://jobicy.com/api/v2/remote-jobs",
                params={"tag": tag, "count": 15},
            )
            if response.status_code != 200:
                print(f"[Jobicy] HTTP {response.status_code}")
                return results

            data = response.json()

        jobs = data.get("jobs", [])
        query_lower = query.lower()

        for job in jobs[:15]:
            if not isinstance(job, dict):
                continue

            title = job.get("jobTitle", "")
            url = job.get("url", "")
            company = job.get("companyName", "")
            description = (job.get("jobExcerpt") or "")[:280]
            date = job.get("pubDate", "")

            if not title or not url:
                continue

            # Loose relevance filter when multi-word query
            if " " in query:
                combined = f"{title} {description}".lower()
                if not any(w in combined for w in query_lower.split() if len(w) > 3):
                    continue

            results.append(PersonLead(
                source="forum",
                title=f"{title} — {company}" if company else title,
                url=url,
                snippet=description,
                postedAt=str(date)[:10] if date else None,
            ))

    except Exception as e:
        print(f"[Jobicy] Error: {e}")

    return results[:8]


async def search_devto(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Dev.to public articles API — filter by 'hiring' tag.
    Only include articles that mention the query in title or description.
    """
    results: list[PersonLead] = []
    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers={**HEADERS, "Accept": "application/json"},
            follow_redirects=True,
            timeout=TIMEOUT,
            limits=LIMITS,
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
            description = (article.get("description") or "")
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
        print(f"[Dev.to] Error: {e}")

    return results[:5]


async def search_forums(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Run all job-board scrapers concurrently with per-source error isolation."""
    all_results = await asyncio.gather(
        search_remotejobs(query, proxy),
        search_arbeitnow(query, proxy),
        search_jobicy(query, proxy),
        search_devto(query, proxy),
        return_exceptions=True,
    )

    combined: list[PersonLead] = []
    labels = ["RemoteJobs", "Arbeitnow", "Jobicy", "Dev.to"]
    for label, r in zip(labels, all_results):
        if isinstance(r, list):
            combined.extend(r)
        else:
            print(f"[forums/{label}] source failed: {r}")

    return combined[:15]
