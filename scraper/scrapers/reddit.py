"""
Reddit scraper using Playwright.

Why Playwright? Reddit's HTML requires JavaScript to render fully.
Playwright opens a real (headless) browser, waits for the page to load,
then reads the content — just like a human would.
"""

import re
from datetime import datetime
from playwright.async_api import async_playwright, TimeoutError as PWTimeout
from .models import PersonLead


# Subreddits where people post "I need a developer/designer"
HIRING_SUBREDDITS = [
    "forhire",
    "hiring",
    "freelance",
    "webdev",
    "web_design",
    "wordpress",
    "javascript",
    "node",
    "reactjs",
    "nextjs",
]

# Keywords that indicate someone is HIRING (not offering services)
HIRING_SIGNALS = [
    "[hiring]", "looking for", "need a", "need an", "seeking",
    "wanted", "help wanted", "want to hire", "hiring a", "hire a",
    "looking to hire", "need help with", "need someone",
]


def _is_hiring_post(title: str, subreddit: str) -> bool:
    t = title.lower()
    if subreddit.lower() == "hiring":
        return True
    return any(signal in t for signal in HIRING_SIGNALS)


def _extract_budget(text: str) -> str | None:
    # Look for dollar amounts or budget mentions
    m = re.search(
        r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?|budget[:\s]+\$?[\d,]+",
        text,
        re.IGNORECASE,
    )
    return m.group(0).strip() if m else None


async def search_reddit(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Search Reddit for hiring posts matching the query.
    Uses old.reddit.com — it renders without JavaScript so it's faster
    and less likely to trigger bot detection.
    """
    results: list[PersonLead] = []

    # Build the search URL
    # old.reddit.com is the classic version — easier to scrape
    subreddit_str = "+".join(HIRING_SUBREDDITS)
    search_url = (
        f"https://old.reddit.com/r/{subreddit_str}/search"
        f"?q={query}&restrict_sr=on&sort=new&t=month"
    )

    launch_args: dict = {
        "headless": True,
        "args": [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
        ],
    }
    if proxy:
        launch_args["proxy"] = {"server": proxy}

    try:
        async with async_playwright() as pw:
            browser = await pw.chromium.launch(**launch_args)
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1280, "height": 800},
            )
            page = await context.new_page()

            # Block images and fonts — we only need text, this speeds things up
            await page.route(
                "**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}",
                lambda r: r.abort(),
            )

            await page.goto(search_url, timeout=20_000, wait_until="domcontentloaded")

            # Wait for search results to appear
            try:
                await page.wait_for_selector(".search-result-link", timeout=8_000)
            except PWTimeout:
                await browser.close()
                return results

            posts = await page.query_selector_all(".search-result")

            for post in posts[:20]:
                try:
                    title_el = await post.query_selector(".search-result-link")
                    if not title_el:
                        continue
                    title = (await title_el.inner_text()).strip()
                    href = await title_el.get_attribute("href") or ""

                    subreddit_el = await post.query_selector(".search-subreddit-link")
                    subreddit = ""
                    if subreddit_el:
                        subreddit = (await subreddit_el.inner_text()).strip()
                        subreddit = subreddit.replace("r/", "")

                    if not _is_hiring_post(title, subreddit):
                        continue

                    snippet_el = await post.query_selector(".search-result-body")
                    snippet = ""
                    if snippet_el:
                        snippet = (await snippet_el.inner_text()).strip()[:280]

                    # Make sure URL is absolute
                    url = href if href.startswith("http") else f"https://old.reddit.com{href}"

                    results.append(
                        PersonLead(
                            source="reddit",
                            title=title,
                            url=url,
                            snippet=snippet,
                            subreddit=subreddit or None,
                            budget=_extract_budget(snippet + " " + title),
                        )
                    )
                except Exception:
                    continue  # skip malformed posts

            await browser.close()

    except Exception as e:
        print(f"[Reddit scraper] Error: {e}")

    return results[:10]
