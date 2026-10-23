"""
Upwork scraper.

Upwork's job search page is JavaScript-rendered but the URL structure is
predictable. We use Playwright to load the page and extract job cards.
"""

import re
from playwright.async_api import async_playwright, TimeoutError as PWTimeout
from .models import PersonLead


def _extract_budget(text: str) -> str | None:
    m = re.search(r"\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?(?:/hr)?", text, re.IGNORECASE)
    return m.group(0).strip() if m else None


def _extract_skills(text: str) -> list[str]:
    # Upwork lists skills in the job description after "Skills:"
    m = re.search(r"Skills?[:\s]+([^\n]+)", text, re.IGNORECASE)
    if m:
        return [s.strip() for s in m.group(1).split(",") if s.strip()][:5]
    return []


async def search_upwork(query: str, proxy: str | None = None) -> list[PersonLead]:
    """
    Scrape Upwork job search results for the given query.
    """
    results: list[PersonLead] = []

    # Upwork search URL — nq= is the query parameter
    search_url = (
        f"https://www.upwork.com/nx/search/jobs"
        f"?nq={query.replace(' ', '%20')}&sort=recency"
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
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                ),
                viewport={"width": 1440, "height": 900},
            )
            page = await context.new_page()

            # Block heavy assets
            await page.route(
                "**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot}",
                lambda r: r.abort(),
            )

            await page.goto(search_url, timeout=25_000, wait_until="networkidle")

            # Upwork job cards
            try:
                await page.wait_for_selector("[data-test='job-tile-title']", timeout=10_000)
            except PWTimeout:
                await browser.close()
                return results

            job_tiles = await page.query_selector_all("article.job-tile, [data-test='job-tile']")

            for tile in job_tiles[:15]:
                try:
                    title_el = await tile.query_selector(
                        "[data-test='job-tile-title'] a, h2 a, h3 a"
                    )
                    if not title_el:
                        continue

                    title = (await title_el.inner_text()).strip()
                    href = await title_el.get_attribute("href") or ""
                    url = href if href.startswith("http") else f"https://www.upwork.com{href}"

                    # Description / snippet
                    desc_el = await tile.query_selector(
                        "[data-test='job-description-text'], .description"
                    )
                    snippet = ""
                    if desc_el:
                        snippet = (await desc_el.inner_text()).strip()[:280]

                    # Budget
                    budget_el = await tile.query_selector(
                        "[data-test='budget'], .js-budget"
                    )
                    budget = None
                    if budget_el:
                        budget_text = (await budget_el.inner_text()).strip()
                        budget = _extract_budget(budget_text) or budget_text[:40]
                    else:
                        budget = _extract_budget(snippet)

                    results.append(
                        PersonLead(
                            source="upwork",
                            title=title,
                            url=url,
                            snippet=snippet,
                            budget=budget,
                            skills=_extract_skills(snippet),
                        )
                    )
                except Exception:
                    continue

            await browser.close()

    except Exception as e:
        print(f"[Upwork scraper] Error: {e}")

    return results[:10]
