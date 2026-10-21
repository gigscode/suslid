import { describe, expect, it } from 'vitest'
import {
  findingsSchema,
  prospectSchema,
} from '../lib/pitchpilot/validation'
import {
  isPublicAddress,
  normalizePublicWebsiteUrl,
  resolveWebsiteRedirect,
  WebsiteFetchError,
} from '../lib/pitchpilot/website'

describe('public website URL handling', () => {
  it('normalizes a bare public hostname to HTTPS and removes fragments', () => {
    expect(normalizePublicWebsiteUrl('Example.com/about#team').toString())
      .toBe('https://example.com/about')
  })

  it.each([
    'http://localhost',
    'http://127.0.0.1',
    'http://2130706433',
    'http://10.1.2.3',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]',
    'http://[::ffff:127.0.0.1]',
    'file:///etc/passwd',
    'https://user:password@example.com',
    'https://example.com:8443',
  ])('rejects unsafe URL %s', (url) => {
    expect(() => normalizePublicWebsiteUrl(url)).toThrow(WebsiteFetchError)
  })

  it.each([
    '127.0.0.1',
    '10.0.0.2',
    '169.254.169.254',
    '192.0.2.10',
    '224.0.0.1',
    '::1',
    'fe80::1',
    'fc00::1',
    '2001:db8::1',
    '2002:0808:0808::1',
  ])('rejects non-public resolved IP %s', (ip) => {
    expect(isPublicAddress(ip)).toBe(false)
  })

  it('accepts public IPv4 and IPv6 addresses', () => {
    expect(isPublicAddress('8.8.8.8')).toBe(true)
    expect(isPublicAddress('2606:4700:4700::1111')).toBe(true)
  })

  it('revalidates redirect destinations before following them', () => {
    const source = new URL('https://example.com/start')
    expect(resolveWebsiteRedirect('/about', source).toString()).toBe('https://example.com/about')
    expect(() => resolveWebsiteRedirect('http://127.0.0.1/private', source)).toThrow(WebsiteFetchError)
    expect(() => resolveWebsiteRedirect('https://[::1]/', source)).toThrow(WebsiteFetchError)
  })
})

describe('request and Gemini output validation', () => {
  it('rejects incomplete prospect records', () => {
    expect(prospectSchema.safeParse({ business_name: ' ' }).success).toBe(false)
  })

  it('accepts evidence-backed structured findings', () => {
    expect(findingsSchema.safeParse({
      business_summary: 'A local studio.',
      observations: [{
        claim: 'The homepage presents a broad service promise.',
        category: 'brand',
        evidence: 'Solutions for every business',
        confidence: 'medium',
        next_step: 'Ask which service line matters most this quarter.',
      }],
      suggested_services: ['Brand strategy'],
      outreach_email: { subject: 'A thought on your services', body: 'A considered note.' },
      outreach_dm: { body: 'A short, considered note.' },
      limitations: ['Only the homepage was reviewed.'],
    }).success).toBe(true)
  })

  it('rejects incomplete Gemini findings', () => {
    expect(findingsSchema.safeParse({ business_summary: 'No evidence.' }).success).toBe(false)
  })
})
