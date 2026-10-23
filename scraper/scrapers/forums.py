"""
Dev forums and job board scraper.

Targets public pages that list freelance/hiring posts:
- Indie Hackers "looking for" posts
- Dev.to hiring posts
- Hashnode community
- Y Combinator "Who is hiring" threads
- Freelancer.com project listings
"""

import re
from playwright.async_api import async_playwright, TimeoutError as PWTimeout
from .models import PersonLead


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


async def _scrape_page(
    url: str,
    card_selector: str,
    title_selector: str,
    link_selector: str,
    snippet_selector: str,
    source: str,
    base_url: str,
    proxy: str | None,
    max_results: int = 8,
) -> list[PersonLead]:
    """
    Generic page scraper. Give it selectors and it extracts lead cards.
    Think of selectors like GPS coordinates for elements on a web page.
    """
    results: list[PersonLead] = []

    launch_args: dict = {
        "headless": True,
        "args": ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
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
            )
            page = await context.new_page()
            await page.route("**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2}", lambda r: r.abort())
            await page.goto(url, timeout=20_000, wait_until="domcontentloaded")

            try:
                await page.wait_for_selector(card_selector, timeout=8_000)
            except PWTimeout:
                await browser.close()
                return results

            cards = await page.query_selector_all(card_selector)

            for card in cards[:max_results]:
                try:
                    title_el = await card.query_selector(title_selector)
                    link_el = await card.query_selector(link_selector)
                    snippet_el = await card.query_selector(snippet_selector)

                    if not title_el:
                        continue

                    title = (await title_el.inner_text()).strip()
                    href = ""
                    if link_el:
                        href = await link_el.get_attribute("href") or ""
                    url_full = href if href.startswith("http") else f"{base_url}{href}"

                    snippet = ""
                    if snippet_el:
                        snippet = (await snippet_el.inner_text()).strip()[:280]

                    if not title or not url_full:
                        continue

                    results.append(PersonLead(
                        source="forum",  # type: ignore[arg-type]
                        title=title,
                        url=url_full,
                        snippet=snippet,
                        budget=_extract_budget(snippet + " " + title),
                    ))
                except Exception:
                    continue

            await browser.close()
    except Exception as e:
        print(f"[{source} scraper] Error: {e}")

    return results


async def search_indiehackers(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Indie Hackers — entrepreneurs looking for tech help."""
    url = f"https://www.indiehackers.com/search?query={query.replace(' ', '+')}"
    return await _scrape_page(
        url=url,
        card_selector=".search-result, .post-row",
        title_selector=".search-result__title, .post-row__title",
        link_selector="a",
        snippet_selector=".search-result__body, .post-row__reply-count",
        source="IndieHackers",
        base_url="https://www.indiehackers.com",
        proxy=proxy,
    )


async def search_devto(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Dev.to job listings."""
    url = f"https://dev.to/search?q={query.replace(' ', '+')}&filters=tag%3Ajobs"
    return await _scrape_page(
        url=url,
        card_selector=".crayons-story",
        title_selector=".crayons-story__title",
        link_selector=".crayons-story__title a",
        snippet_selector=".crayons-story__snippet",
        source="Dev.to",
        base_url="https://dev.to",
        proxy=proxy,
    )


async def search_forums(query: str, proxy: str | None = None) -> list[PersonLead]:
    """Run all forum scrapers in parallel and combine results."""
    import asyncio

    all_results = await asyncio.gather(
        search_indiehackers(query, proxy),
        search_devto(query, proxy),
        return_exceptions=True,
    )

    combined: list[PersonLead] = []
    for result in all_results:
        if isinstance(result, list):
            combined.extend(result)
        # if it's an exception, we just skip that source

    return combined[:10]
