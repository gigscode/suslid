import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

export interface PersonLead {
  source: 'reddit' | 'upwork' | 'forum' | 'web'
  title: string
  url: string
  snippet: string
  postedAt?: string
  budget?: string
  skills?: string[]
  subreddit?: string
}

interface LangSearchResult {
  name: string
  url: string
  snippet?: string
  datePublished?: string
}

interface LangSearchResponse {
  code?: number | string
  message?: string
  data?: { webPages?: { value?: LangSearchResult[] } }
}

// ── Strategy 1: Python scraper service on Railway ─────────────────────────
// Set SCRAPER_SERVICE_URL in Vercel env vars once deployed to Railway
async function searchViaScraper(query: string): Promise<PersonLead[]> {
  const scraperUrl = process.env.SCRAPER_SERVICE_URL?.trim()
  const scraperSecret = process.env.SCRAPER_SECRET?.trim()
  if (!scraperUrl) throw new Error('SCRAPER_SERVICE_URL not configured')

  const response = await fetch(`${scraperUrl}/search/people`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(scraperSecret ? { 'X-Scraper-Secret': scraperSecret } : {}),
    },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(25_000),
  })

  if (!response.ok) throw new Error(`Scraper service returned ${response.status}`)

  const data = await response.json() as { leads?: PersonLead[] }
  return data.leads ?? []
}

// ── Strategy 2: LangSearch (fallback — used when scraper not deployed yet) ─
async function searchViaLangSearch(query: string): Promise<PersonLead[]> {
  const apiKey = process.env.LANGSEARCH_API_KEY?.trim()
  if (!apiKey) throw new Error('LANGSEARCH_API_KEY not configured')

  const searches = [
    {
      source: 'reddit' as const,
      q: `site:reddit.com (r/forhire OR r/hiring OR r/freelance OR r/webdev) "${query}" (hiring OR "looking for" OR "need a")`,
    },
    {
      source: 'upwork' as const,
      q: `site:upwork.com/jobs "${query}"`,
    },
    {
      source: 'forum' as const,
      q: `"${query}" ("looking for" OR "need a" OR hiring OR freelance) developer designer -site:reddit.com -site:upwork.com`,
    },
    {
      source: 'web' as const,
      q: `"${query}" freelance hire 2025 project contract`,
    },
  ]

  async function langSearch(q: string, count = 8): Promise<LangSearchResult[]> {
    const res = await fetch('https://api.langsearch.com/v1/web-search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q, count, freshness: 'Month' }),
      signal: AbortSignal.timeout(12_000),
    })
    if (!res.ok) throw new Error(`LangSearch HTTP ${res.status}`)
    const data = await res.json() as LangSearchResponse
    if (String(data.code) !== '200') throw new Error(`LangSearch: ${data.message ?? data.code}`)
    return data.data?.webPages?.value ?? []
  }

  const settled = await Promise.allSettled(
    searches.map((s) => langSearch(s.q).then((results) => ({ source: s.source, results })))
  )

  const seen = new Set<string>()
  const leads: PersonLead[] = []

  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      console.warn('LangSearch people query failed:', outcome.reason instanceof Error ? outcome.reason.message : outcome.reason)
      continue
    }
    for (const r of outcome.value.results) {
      if (!r.url || seen.has(r.url)) continue
      seen.add(r.url)
      const budgetMatch = r.snippet?.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?/)
      leads.push({
        source: outcome.value.source,
        title: r.name,
        url: r.url,
        snippet: r.snippet ?? '',
        postedAt: r.datePublished ? new Date(r.datePublished).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined,
        budget: budgetMatch?.[0],
      })
    }
  }

  const order: Record<PersonLead['source'], number> = { reddit: 0, upwork: 1, forum: 2, web: 3 }
  leads.sort((a, b) => order[a.source] - order[b.source])
  return leads
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Sign in to search for people.' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const query = typeof payload.query === 'string' ? payload.query.trim() : ''

  if (!query || query.length < 2) return NextResponse.json({ error: 'Enter at least 2 characters.' }, { status: 400 })
  if (query.length > 200) return NextResponse.json({ error: 'Query too long.' }, { status: 400 })

  // Try Python scraper first, fall back to LangSearch
  if (process.env.SCRAPER_SERVICE_URL?.trim()) {
    try {
      const leads = await searchViaScraper(query)
      return NextResponse.json({ leads, query })
    } catch (err) {
      console.warn('Scraper service failed, falling back to LangSearch:', err instanceof Error ? err.message : err)
    }
  }

  try {
    const leads = await searchViaLangSearch(query)
    return NextResponse.json({ leads, query })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('People search failed:', msg)
    return NextResponse.json({ error: `Search failed: ${msg}` }, { status: 502 })
  }
}
