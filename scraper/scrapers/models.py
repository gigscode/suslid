"""
Shared data models.
Pydantic models are like TypeScript interfaces — they describe the shape
of data and automatically validate it.
"""

from pydantic import BaseModel
from typing import Literal


class PersonLead(BaseModel):
    source: Literal["reddit", "upwork", "forum", "web"]
    title: str
    url: str
    snippet: str = ""
    postedAt: str | None = None
    budget: str | None = None
    skills: list[str] = []
    subreddit: str | None = None
