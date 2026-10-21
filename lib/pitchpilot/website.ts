import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import ipaddr from 'ipaddr.js'
import * as cheerio from 'cheerio'

const maxBytes = 1_000_000
const maxRedirects = 3
const timeoutMs = 8_000
const maxExtractedChars = 12_000

export type PageContent = {
  url: string
  title: string
  description: string
  headings: string[]
  text: string
}

export class WebsiteFetchError extends Error {
  constructor(message: string, readonly category: 'invalid_url' | 'unsafe_url' | 'fetch_failed' | 'blocked' | 'no_content') {
    super(message)
    this.name = 'WebsiteFetchError'
  }
}

export function normalizePublicWebsiteUrl(input: string): URL {
  const candidate = input.trim().includes('://') ? input.trim() : `https://${input.trim()}`
  let url: URL
  try {
    url = new URL(candidate)
  } catch {
    throw new WebsiteFetchError('Enter a valid public website URL.', 'invalid_url')
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new WebsiteFetchError('Only public HTTP or HTTPS websites without embedded credentials are supported.', 'unsafe_url')
  }
  if (url.port && !((url.protocol === 'http:' && url.port === '80') || (url.protocol === 'https:' && url.port === '443'))) {
    throw new WebsiteFetchError('Only websites on the standard HTTP and HTTPS ports can be inspected.', 'unsafe_url')
  }

  url.hash = ''
  url.port = ''
  url.hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  const unbracketedHostname = url.hostname.replace(/^\[|\]$/g, '')
  if (!url.hostname || url.hostname === 'localhost' || /\.(localhost|local|internal|test|invalid)$/.test(url.hostname)) {
    throw new WebsiteFetchError('That hostname is not a public website.', 'unsafe_url')
  }
  if (ipaddr.isValid(unbracketedHostname) && !isPublicAddress(unbracketedHostname)) {
    throw new WebsiteFetchError('That IP address is not publicly routable.', 'unsafe_url')
  }
  return url
}

export function isPublicAddress(address: string): boolean {
  let parsed: ipaddr.IPv4 | ipaddr.IPv6
  try {
    parsed = ipaddr.parse(address)
  } catch {
    return false
  }
  if (parsed.kind() === 'ipv6' && (parsed as ipaddr.IPv6).isIPv4MappedAddress()) return false
  return parsed.range() === 'unicast'
}

export function resolveWebsiteRedirect(location: string, currentUrl: URL): URL {
  try {
    return normalizePublicWebsiteUrl(new URL(location, currentUrl).toString())
  } catch (error) {
    if (error instanceof WebsiteFetchError) throw error
    throw new WebsiteFetchError('The website returned an invalid redirect.', 'blocked')
  }
}

async function resolvePublicAddresses(hostname: string) {
  if (ipaddr.isValid(hostname)) {
    if (!isPublicAddress(hostname)) throw new WebsiteFetchError('That IP address is not publicly routable.', 'unsafe_url')
    return [{ address: hostname, family: ipaddr.parse(hostname).kind() === 'ipv4' ? 4 : 6 }]
  }

  let addresses: Array<{ address: string; family: number }>
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true })
  } catch {
    throw new WebsiteFetchError('The website hostname could not be resolved.', 'fetch_failed')
  }
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicAddress(address))) {
    throw new WebsiteFetchError('The website resolves to a non-public or restricted address.', 'unsafe_url')
  }
  return addresses
}

function requestPinned(url: URL, address: string, family: number): Promise<{ status: number; headers: import('node:http').IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const transport = url.protocol === 'https:' ? httpsRequest : httpRequest
    const request = transport(url, {
      method: 'GET',
      headers: {
        Accept: 'text/html',
        'Accept-Encoding': 'identity',
        'User-Agent': 'PitchPilotResearch/1.0 (+public website page analysis)',
      },
      lookup: (_hostname, _options, callback) => callback(null, address, family),
    }, (response) => {
      const chunks: Buffer[] = []
      let size = 0
      response.on('data', (chunk: Buffer | string) => {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        size += buffer.length
        if (size > maxBytes) {
          request.destroy(new WebsiteFetchError('The page is too large to inspect safely.', 'blocked'))
          return
        }
        chunks.push(buffer)
      })
      response.on('end', () => resolve({
        status: response.statusCode ?? 502,
        headers: response.headers,
        body: Buffer.concat(chunks),
      }))
    })
    request.setTimeout(timeoutMs, () => request.destroy(new WebsiteFetchError('The website took too long to respond.', 'fetch_failed')))
    request.on('error', reject)
    request.end()
  })
}

export async function fetchPublicWebsite(input: string): Promise<PageContent> {
  let url = normalizePublicWebsiteUrl(input)

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const addresses = await resolvePublicAddresses(url.hostname)
    const response = await requestPinned(url, addresses[0].address, addresses[0].family)
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.location
      if (!location || redirectCount === maxRedirects) {
        throw new WebsiteFetchError('The website redirected too many times or returned an invalid redirect.', 'blocked')
      }
      url = resolveWebsiteRedirect(location, url)
      continue
    }
    if (response.status < 200 || response.status >= 300) {
      throw new WebsiteFetchError('The website declined the request or returned an error page.', 'fetch_failed')
    }
    const contentType = response.headers['content-type']?.toLowerCase() ?? ''
    if (!contentType.includes('text/html')) {
      throw new WebsiteFetchError('The requested page is not served as HTML.', 'blocked')
    }

    const $ = cheerio.load(response.body.toString('utf8'))
    $('script, style, noscript, svg, iframe, nav, footer, header, form').remove()
    const title = $('title').first().text().trim().slice(0, 300)
    const description = $('meta[name="description"]').attr('content')?.trim().slice(0, 500) ?? ''
    const headings = $('h1, h2, h3').toArray()
      .map((heading) => $(heading).text().replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 20)
    const text = $('body').text().replace(/\s+/g, ' ').trim().slice(0, maxExtractedChars)

    if (!title && !description && headings.length === 0 && !text) {
      throw new WebsiteFetchError('No readable website content was found on this page.', 'no_content')
    }
    return { url: url.toString(), title, description, headings, text }
  }
  throw new WebsiteFetchError('The website could not be inspected.', 'fetch_failed')
}
