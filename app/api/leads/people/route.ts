import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

export const runtime = 'nodejs'
export const maxDuration = 25

export interface PersonLead {
  source: 'reddit' | 'upwork' | 'web'
  title: string
  url: string
  snippet: string
  postedAt?: string
  budget?: string
  skills?: string[]
  subreddit?: string
}

// ── Reddit search (public JSON API, no key needed) ────────────────────────
// Targets hiring/forhire/freelance subreddits
const HIRING_SUBREDDITS = [
  'forhire', 'hiring', 'freelance', 'web_design', 'webdev',
  'wordpress', 'learnprogramming', 'javascript', 'node',
]

async function searchReddit(query: string): Promise<PersonLead[]> {
  const subredditStr = HIRING_SUBREDDITS.join('+')
  // Reddit public search — no auth needed
  const params = new URLSearchParams({
    q: query,
    sort: 'new',
    limit: '25',
    restrict_sr: 'true',
    t: 'month',
  })

  const response = await fetch(
    `https://www.reddit.com/r/${subredditStr}/search.json?${params}`,
    {
      headers: {
        'User-Agent': 'SusLidLeadDiscovery/1.0 (prospect research tool)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10_000),
    }
  )

  if (!response.ok) throw new Error(`Reddit API returned ${response.status}`)

  const data = await response.json() as {
    data?: {
      children?: Array<{
        data: {
          title: string
          url: string
          selftext: string
          subreddit: string
          created_utc: number
          permalink: string
        }
      }>
    }
  }

  const posts = data.data?.children ?? []
  const leads: PersonLead[] = []

  for (const { data: post } of posts) {
    // Filter to posts that are looking for help (not offering services)
    const titleLower = post.title.toLowerCase()
    const isHiring = titleLower.includes('[hiring]') ||
      titleLower.includes('looking for') ||
      titleLower.includes('need a') ||
      titleLower.includes('need an') ||
      titleLower.includes('seeking') ||
      titleLower.includes('wanted') ||
      titleLower.includes('help wanted') ||
      titleLower.includes('hire') ||
      post.subreddit.toLowerCase() === 'hiring'

    if (!isHiring) continue

    const snippet = post.selftext?.slice(0, 280).replace(/\n+/g, ' ').trim() || post.title

    leads.push({
      source: 'reddit',
      title: post.title,
      url: `https://www.reddit.com${post.permalink}`,
      snippet,
      subreddit: post.subreddit,
      postedAt: new Date(post.created_utc * 1000).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }),
    })
  }

  return leads.slice(0, 10)
}

// ── Upwork RSS feed (public, no key needed) ────────────────────────────────
async function searchUpwork(query: string): Promise<PersonLead[]> {
  const params = new URLSearchParams({ q: query, sort: 'recency' })
  const rssUrl = `https://www.upwork.com/ab/feed/jobs/rss?${params}`

  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; SusLidResearch/1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) throw new Error(`Upwork RSS returned ${response.status}`)

  const xml = await response.text()
  const $ = cheerio.load(xml, { xmlMode: true })
  const leads: PersonLead[] = []

  $('item').each((_, el) => {
    const title = $(el).find('title').first().text().trim()
    const link = $(el).find('link').first().text().trim() ||
      $(el).find('guid').first().text().trim()
    const description = $(el).find('description').first().text()
    const pubDate = $(el).find('pubDate').first().text().trim()

    if (!title || !link) return

    // Extract budget from description if present
    const budgetMatch = description.match(/Budget:\s*([^\n<]+)/i)
    const budget = budgetMatch?.[1]?.trim()

    // Extract skills
    const skillsMatch = description.match(/Skills:\s*([^\n<]+)/i)
    const skills = skillsMatch?.[1]?.split(',').map((s) => s.trim()).filter(Boolean)

    // Clean HTML from snippet
    const snippet = description
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280)

    leads.push({
      source: 'upwork',
      title,
      url: link,
      snippet,
      budget,
      skills,
      postedAt: pubDate ? new Date(pubDate).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric',
      }) : undefined,
    })
  })

  return leads.slice(0, 10)
}

// ── LangSearch targeted at hiring/job boards ──────────────────────────────
async function searchWebHiring(query: string): Promise<PersonLead[]> {
  const apiKey = process.env.LANGSEARCH_API_KEY?.trim()
  if (!apiKey) throw new Error('LANGSEARCH_API_KEY not configured')

  // Target job boards and hiring posts specifically
  const enhancedQuery = `"${query}" (hiring OR "looking for" OR "need a" OR "seeking" OR freelance)`

  const response = await fetch('https://api.langsearch.com/v1/web-search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: enhancedQuery,
      count: 10,
      freshness: 'Month',
    }),
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

  if (String(data.code) !== '200') {
    throw new Error(`LangSearch error: ${data.message ?? String(data.code)}`)
  }

  const results = data.data?.webPages?.value ?? []
  const seen = new Set<string>()
  const leads: PersonLead[] = []

  for (const r of results) {
    try {
      const domain = new URL(r.url).hostname
      if (seen.has(domain)) continue
      seen.add(domain)
      leads.push({
        source: 'web',
        title: r.name,
        url: r.url,
        snippet: r.snippet ?? '',
        postedAt: r.datePublished
          ? new Date(r.datePublished).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : undefined,
      })
    } catch { /* skip invalid URLs */ }
  }

  return leads.slice(0, 8)
}

// ── Main: run all three in parallel ──────────────────────────────────────
async function searchPeople(query: string): Promise<PersonLead[]> {
  const results = await Promise.allSettled([
    searchReddit(query),
    searchUpwork(query),
    searchWebHiring(query),
  ])

  const leads: PersonLead[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') leads.push(...result.value)
    else console.warn('People search source failed:', result.reason instanceof Error ? result.reason.message : result.reason)
  }

  // Sort: reddit + upwork first (most relevant), web last
  leads.sort((a, b) => {
    const order = { reddit: 0, upwork: 1, web: 2 }
    return order[a.source] - order[b.source]
  })

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
    console.error('People search failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Search failed. Try again.' }, { status: 502 })
  }
}
