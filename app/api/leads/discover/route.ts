import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'
export const maxDuration = 20

export interface DiscoveredLead {
  title: string
  url: string
  snippet: string
  domain: string
}

// Hardcoded safe DuckDuckGo HTML endpoint — never resolves to a private IP
const DDG_HOST = 'html.duckduckgo.com'
const DDG_PATH = '/html/'

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function isUsableUrl(url: string): boolean {
  try {
    const u = new URL(url)
    // Only public HTTP/HTTPS, no DDG internal links
    if (!['http:', 'https:'].includes(u.protocol)) return false
    if (u.hostname.includes('duckduckgo.com')) return false
    if (u.hostname.includes('google.com')) return false
    if (u.hostname.includes('bing.com')) return false
    if (u.hostname.includes('youtube.com')) return false
    if (u.hostname.includes('facebook.com')) return false
    if (u.hostname.includes('twitter.com')) return false
    if (u.hostname.includes('wikipedia.org')) return false
    return true
  } catch {
    return false
  }
}

async function searchDuckDuckGo(query: string): Promise<DiscoveredLead[]> {
  const params = new URLSearchParams({ q: query, kl: 'us-en' })

  const response = await fetch(`https://${DDG_HOST}${DDG_PATH}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SusLidResearch/1.0; +prospect lead discovery)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    // Short timeout via AbortSignal
    signal: AbortSignal.timeout(12_000),
  })

  if (!response.ok) {
    throw new Error(`Search returned status ${response.status}`)
  }

  const html = await response.text()
  const $ = cheerio.load(html)
  const leads: DiscoveredLead[] = []
  const seen = new Set<string>()

  // DuckDuckGo HTML result structure: .result__body or .result
  $('div.result, .web-result').each((_, el) => {
    const titleEl = $(el).find('a.result__a, h2 a').first()
    const snippetEl = $(el).find('a.result__snippet, .result__snippet, .result__body').first()

    const rawHref = titleEl.attr('href') ?? ''
    const title = titleEl.text().trim()
    const snippet = snippetEl.text().trim()

    // DDG wraps URLs in a redirect — try to extract the real URL
    let url = rawHref
    try {
      const parsed = new URL(rawHref, `https://${DDG_HOST}`)
      // DDG redirect format: /l/?uddg=<encoded_url>
      const uddg = parsed.searchParams.get('uddg')
      if (uddg) url = decodeURIComponent(uddg)
    } catch {
      // keep raw href
    }

    if (!title || !url || !isUsableUrl(url)) return
    const domain = extractDomain(url)
    if (seen.has(domain)) return
    seen.add(domain)

    leads.push({ title, url, snippet, domain })
  })

  return leads.slice(0, 12)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Sign in to discover leads.' }, { status: 401 })
  }

  let body: unknown
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const query = typeof payload.query === 'string' ? payload.query.trim() : ''

  if (!query || query.length < 2) {
    return NextResponse.json({ error: 'Enter at least 2 characters to search.' }, { status: 400 })
  }
  if (query.length > 200) {
    return NextResponse.json({ error: 'Search query is too long.' }, { status: 400 })
  }

  try {
    const leads = await searchDuckDuckGo(query)
    return NextResponse.json({ leads, query })
  } catch (err) {
    console.error('Lead discovery failed:', err)
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Search timed out. Try again.' }, { status: 504 })
    }
    return NextResponse.json({ error: 'Could not search for leads right now. Try again.' }, { status: 502 })
  }
}
