import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'
export const maxDuration = 25

export interface DiscoveredLead {
  title: string
  url: string
  snippet: string
  domain: string
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

const BLOCKED_DOMAINS = [
  'google.', 'bing.', 'yahoo.', 'duckduckgo.', 'youtube.', 'facebook.',
  'twitter.', 'x.com', 'wikipedia.', 'reddit.', 'linkedin.',
  'tiktok.', 'instagram.', 'pinterest.',
]

function isUsableUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    return !BLOCKED_DOMAINS.some((d) => u.hostname.includes(d))
  } catch { return false }
}

// ── Strategy 1: LangSearch (free, no credit card, resets daily) ──────────
// https://langsearch.com — get a free key at https://langsearch.com/dashboard
async function searchLangSearch(query: string): Promise<DiscoveredLead[]> {
  const apiKey = process.env.LANGSEARCH_API_KEY?.trim()
  if (!apiKey) throw new Error('LANGSEARCH_API_KEY not configured')

  const response = await fetch('https://api.langsearch.com/v1/web-search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, count: 15, freshness: 'noLimit' }),
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) throw new Error(`LangSearch returned HTTP ${response.status}`)

  const data = await response.json() as {
    code?: number | string
    message?: string
    data?: {
      webPages?: {
        value?: Array<{ name: string; url: string; snippet?: string; datePublished?: string }>
      }
    }
  }

  // LangSearch wraps results — code "200" or 200 means success
  if (String(data.code) !== '200') {
    throw new Error(`LangSearch error: ${data.message ?? String(data.code)}`)
  }

  const results = data.data?.webPages?.value ?? []
  const seen = new Set<string>()
  const leads: DiscoveredLead[] = []

  for (const r of results) {
    if (!r.url || !isUsableUrl(r.url)) continue
    const domain = extractDomain(r.url)
    if (seen.has(domain)) continue
    seen.add(domain)
    leads.push({ title: r.name, url: r.url, snippet: r.snippet ?? '', domain })
  }

  return leads.slice(0, 12)
}

// ── Strategy 2: DuckDuckGo HTML (works on localhost, may be blocked in prod) ─
async function searchDuckDuckGo(query: string): Promise<DiscoveredLead[]> {
  const params = new URLSearchParams({ q: query, kl: 'us-en' })

  const response = await fetch(`https://html.duckduckgo.com/html/?${params}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) throw new Error(`DDG returned ${response.status}`)

  const html = await response.text()
  if (html.includes('captcha') || html.length < 500) {
    throw new Error('DDG blocked this request')
  }

  const $ = cheerio.load(html)
  const leads: DiscoveredLead[] = []
  const seen = new Set<string>()

  $('div.result, .web-result').each((_, el) => {
    const titleEl = $(el).find('a.result__a, h2 a').first()
    const snippetEl = $(el).find('a.result__snippet, .result__snippet').first()
    const rawHref = titleEl.attr('href') ?? ''
    const title = titleEl.text().trim()
    const snippet = snippetEl.text().trim()

    let url = rawHref
    try {
      const parsed = new URL(rawHref, 'https://html.duckduckgo.com')
      const uddg = parsed.searchParams.get('uddg')
      if (uddg) url = decodeURIComponent(uddg)
    } catch { /* keep raw */ }

    if (!title || !url || !isUsableUrl(url)) return
    const domain = extractDomain(url)
    if (seen.has(domain)) return
    seen.add(domain)
    leads.push({ title, url, snippet, domain })
  })

  if (leads.length === 0) throw new Error('DDG returned no results')
  return leads.slice(0, 12)
}

// ── Main: LangSearch first, DDG fallback ─────────────────────────────────
async function search(query: string): Promise<DiscoveredLead[]> {
  if (process.env.LANGSEARCH_API_KEY?.trim()) {
    try {
      const results = await searchLangSearch(query)
      if (results.length > 0) return results
    } catch (err) {
      console.warn('LangSearch failed, falling back to DDG:', err instanceof Error ? err.message : err)
    }
  }
  return searchDuckDuckGo(query)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Sign in to discover leads.' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() }
  catch { return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 }) }

  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const query = typeof payload.query === 'string' ? payload.query.trim() : ''

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Enter at least 2 characters to search.' }, { status: 400 })
  }
  if (query.length > 200) {
    return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 })
  }

  try {
    const leads = await search(query)
    return NextResponse.json({ leads, query })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Lead discovery failed:', msg)

    if (msg.includes('TimeoutError') || msg.includes('timeout')) {
      return NextResponse.json({ error: 'Search timed out. Try again.' }, { status: 504 })
    }
    if (msg.includes('blocked') || msg.includes('captcha')) {
      return NextResponse.json({
        error: 'Search is unavailable. Make sure LANGSEARCH_API_KEY is set in your Vercel environment variables.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: `Search failed: ${msg}` }, { status: 502 })
  }
}
