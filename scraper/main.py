"""
SusLid Scraper Service
======================
A small FastAPI web server that scrapes job/hiring posts from Reddit,
Upwork, and dev forums using Playwright (a real browser in headless mode).

Why FastAPI?
  - It's fast and simple, like Express.js but for Python
  - It automatically generates API docs at /docs
  - It validates request/response data automatically

This runs on Railway as a separate service.
Your Next.js app calls it just like any other API.
"""

import asyncio
import os
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from scrapers.models import PersonLead
from scrapers.reddit import search_reddit
from scrapers.upwork import search_upwork
from scrapers.forums import search_forums

# ── App setup ────────────────────────────────────────────────────────────
app = FastAPI(
    title="SusLid Scraper Service",
    description="Scrapes Reddit, Upwork, and dev forums for hiring/freelance posts",
    version="1.0.0",
)

# CORS — allow requests from your Vercel app and localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://suslid.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        os.getenv("ALLOWED_ORIGIN", ""),
    ],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Secret key — your Next.js app sends this header so random people
# can't use your scraper. Set SCRAPER_SECRET in Railway env vars.
SCRAPER_SECRET = os.getenv("SCRAPER_SECRET", "")


# ── Request / Response models ─────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str
    proxy: str | None = None  # optional proxy URL e.g. "http://user:pass@host:port"


class SearchResponse(BaseModel):
    leads: list[PersonLead]
    query: str
    total: int
    sources: dict[str, int]


# ── Health check — Railway uses this to know the server is alive ──────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "suslid-scraper"}


# ── Main search endpoint ──────────────────────────────────────────────────
@app.post("/search/people", response_model=SearchResponse)
async def search_people(
    body: SearchRequest,
    x_scraper_secret: str | None = Header(default=None),
):
    """
    Search Reddit, Upwork, and forums for people hiring or looking for help.

    Send a POST request with:
    {
        "query": "WordPress developer",
        "proxy": "http://user:pass@proxyhost:port"  (optional)
    }

    Returns up to 30 leads sorted by source priority.
    """
    # Auth check — only allow requests with the right secret
    if SCRAPER_SECRET and x_scraper_secret != SCRAPER_SECRET:
        raise HTTPException(status_code=401, detail="Invalid or missing X-Scraper-Secret header")

    query = body.query.strip()
    if not query or len(query) < 2:
        raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
    if len(query) > 200:
        raise HTTPException(status_code=400, detail="Query too long")

    proxy = body.proxy or os.getenv("PROXY_URL")  # fall back to env proxy if set

    # Run all three scrapers at the same time (parallel)
    # asyncio.gather = "start all three, wait for all to finish"
    reddit_results, upwork_results, forum_results = await asyncio.gather(
        search_reddit(query, proxy),
        search_upwork(query, proxy),
        search_forums(query, proxy),
        return_exceptions=True,
    )

    all_leads: list[PersonLead] = []

    for label, result in [
        ("reddit", reddit_results),
        ("upwork", upwork_results),
        ("forum", forum_results),
    ]:
        if isinstance(result, list):
            all_leads.extend(result)
        else:
            # Log errors but don't crash the whole request
            print(f"[{label}] failed: {result}")

    # Deduplicate by URL
    seen_urls: set[str] = set()
    unique_leads: list[PersonLead] = []
    for lead in all_leads:
        if lead.url not in seen_urls:
            seen_urls.add(lead.url)
            unique_leads.append(lead)

    # Sort: reddit first, then upwork, then forums
    order = {"reddit": 0, "upwork": 1, "forum": 2, "web": 3}
    unique_leads.sort(key=lambda l: order.get(l.source, 9))

    sources = {
        "reddit": sum(1 for l in unique_leads if l.source == "reddit"),
        "upwork": sum(1 for l in unique_leads if l.source == "upwork"),
        "forum": sum(1 for l in unique_leads if l.source == "forum"),
    }

    return SearchResponse(
        leads=unique_leads[:30],
        query=query,
        total=len(unique_leads),
        sources=sources,
    )


# ── Website search endpoint (for future use) ─────────────────────────────
@app.post("/search/websites")
async def search_websites(
    body: SearchRequest,
    x_scraper_secret: str | None = Header(default=None),
):
    """Placeholder for future website business scraping."""
    if SCRAPER_SECRET and x_scraper_secret != SCRAPER_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return {"leads": [], "query": body.query, "message": "Coming soon"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
