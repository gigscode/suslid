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
  data?: {
    webPages?: { value?: LangSearchResult[] }
  }
}

async function langSearch(query: string, count = 10): Promise<LangSearchResult[]> {
  const apiKey = process.env.LANGSEARCH_API_KEY?.trim()
  if (!apiKey) throw new Error('LANGSEARCH_API_KEY not set')

  const response = await fetch('https://api.langsearch.com/v1/web-search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, count, freshness: 'oneMonth' }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) throw new Error(`LangSearch HTTP ${response.status}`)

  const data = await response.json() as LangSearchResponse
  if (String(data.code) !== '200') {
    throw new Error(`LangSearch: ${data.message ?? data.code}`)
  }

  return data.data?.webPages?.value ?? []
}

function parseDate(raw?: string): string | undefined {
  if (!raw) return undefined
  try {
    return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return undefined }
}

function extractSubreddit(url: string): string | undefined {
  const m = url.match(/reddit\.com\/r\/([^/]+)/)
  return m?.[1]
}

function extractBudget(text: string): string | undefined {
  const m = text.match(/\$[\d,]+(?:\s*[-–]\s*\$[\d,]+)?|\₦[\d,]+|budget[:\s]+([^\n,.]+)/i)
  return m?.[0]?.trim()
}

// ── Run 4 targeted queries in parallel via LangSearch ─────────────────────
async function searchPeople(query: string): Promise<PersonLead[]> {
  const q = query.trim()

  const searches = [
    // Reddit hiring posts
    {
      source: 'reddit' as const,
      query: `site:reddit.com (r/forhire OR r/hiring OR r/freelance OR r/webdev OR r/wordpress) "${q}" (hiring OR "looking for" OR "need a" OR wanted)`,
    },
    // Upwork job listings
    {
      source: 'upwork' as const,
      query: `site:upwork.com/jobs "${q}"`,
    },
    // Dev/design forums and communities
    {
      source: 'forum' as const,
      query: `"${q}" ("looking for" OR "need a" OR hiring OR "seeking a") (developer OR designer OR freelancer) -site:reddit.com -site:upwork.com`,
    },
    // Broader web — job boards, Twitter, LinkedIn posts
    {
      source: 'web' as const,
      query: `"${q}" freelance hire (job OR project OR contract OR "work with")`,
    },
  ]

  const settled = await Promise.allSettled(
    searches.map((s) => langSearch(s.query, 8).then((results) => ({ source: s.source, results })))
  )

  if (settled.every((outcome) => outcome.status === 'rejected')) {
    throw new Error('All people search requests failed.')
  }

  const seen = new Set<string>()
  const leads: PersonLead[] = []

  for (const outcome of settled) {
    if (outcome.status === 'rejected') {
      console.warn('People search query failed:', outcome.reason instanceof Error ? outcome.reason.message : outcome.reason)
      continue
    }

    const { source, results } = outcome.value

    for (const r of results) {
      if (!r.url || seen.has(r.url)) continue
      seen.add(r.url)

      const snippet = r.snippet ?? ''
      const lead: PersonLead = {
        source,
        title: r.name,
        url: r.url,
        snippet,
        postedAt: parseDate(r.datePublished),
        budget: extractBudget(snippet),
      }

      if (source === 'reddit') {
        lead.subreddit = extractSubreddit(r.url)
      }

      leads.push(lead)
    }
  }

  // Sort: reddit, upwork, forum, web
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

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Enter at least 2 characters.' }, { status: 400 })
  }
  if (query.length > 200) {
    return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 })
  }

  try {
    const leads = await searchPeople(query)
    return NextResponse.json({ leads, query })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('People search failed:', msg)
    return NextResponse.json({ error: `Search failed: ${msg}` }, { status: 502 })
  }
}
