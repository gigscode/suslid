"""
Reddit scraping is not available.

Reddit shut down unauthenticated scraping on May 28, 2026. All requests
return 403 or redirect to a login wall. The public API registration
window closes October 31, 2026, and full public API shutdown is March 2027.

This module is kept as a stub so imports in main.py do not break.
search_reddit() returns an empty list immediately without making any
network call — no memory cost, no hung connections.
"""

from .models import PersonLead


async def search_reddit(query: str, proxy: str | None = None) -> list[PersonLead]:
    # Reddit scraping is unavailable. Return empty immediately.
    return []
