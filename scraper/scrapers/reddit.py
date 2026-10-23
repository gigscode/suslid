"""
Reddit scraper using plain HTTP (no browser needed).

old.reddit.com renders full HTML without JavaScript — so we can
use a simple HTTP request instead of launching a heavy browser.
This uses far less memory and is much faster.
"""

import re
import httpx
from bs4 import BeautifulSoup
from .models import PersonLead

HIRING_SUBREDDITS = [
    "forhire", "hiring", "freelance", "webdev",
    "web_design", "wordpress", "javascript", "node",
]

HIRING_SIGNALS = [
    "[hiring]", "looking for", "need a", "need an", "seeking",
    "wanted", "help wanted", "want to hire", "hiring a", "hire a",
    "looking to hire", "need help with", "need someone to",
]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


def _is_hiring_post(title: str, subreddit: str) -> bool:
    t = title.lower()
    if subreddit.lower() in ("hiring", "forhire"):
        return True
    return any(signal in t for signal in HIRING_SIGNALS)


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


async def search_reddit(query: str, proxy: str | None = None) -> list[PersonLead]:
    results: list[PersonLead] = []
    subreddit_str = "+".join(HIRING_SUBREDDITS)
    url = (
        f"https://old.reddit.com/r/{subreddit_str}/search"
        f"?q={query.replace(' ', '+')}&restrict_sr=on&sort=new&t=month"
    )

    proxies = {"http://": proxy, "https://": proxy} if proxy else None

    try:
        async with httpx.AsyncClient(
            headers=HEADERS,
            follow_redirects=True,
            timeout=15.0,
            proxies=proxies,
        ) as client:
            response = await client.get(url)
            response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # old.reddit search results are in <div class="search-result">
        posts = soup.select(".search-result-link")

        for post in posts[:20]:
            try:
                title_el = post.select_one("a.search-result-link, a[data-click-id='body']")
                if not title_el:
                    # fallback: the element itself might be the link
                    title = post.get_text(strip=True)
                    href = post.get("href", "")
                else:
                    title = title_el.get_text(strip=True)
                    href = title_el.get("href", "")

                if not title or not href:
                    continue

                # Extract subreddit from URL
                sub_match = re.search(r"/r/([^/]+)/", href)
                subreddit = sub_match.group(1) if sub_match else ""

                if not _is_hiring_post(title, subreddit):
                    continue

                # Get snippet from the parent container
                parent = post.find_parent(class_="search-result")
                snippet = ""
                if parent:
                    body = parent.select_one(".search-result-body, .usertext-body")
                    if body:
                        snippet = body.get_text(strip=True)[:280]

                url_full = href if href.startswith("http") else f"https://old.reddit.com{href}"

                results.append(PersonLead(
                    source="reddit",
                    title=title,
                    url=url_full,
                    snippet=snippet,
                    subreddit=subreddit or None,
                    budget=_extract_budget(snippet + " " + title),
                ))
            except Exception:
                continue

    except Exception as e:
        print(f"[Reddit scraper] Error: {e}")

    return results[:10]
