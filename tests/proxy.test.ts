import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { proxy } from '../proxy'

describe('request proxy', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows public pages through when Supabase is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '')

    const response = await proxy(new NextRequest('https://example.test/'))

    expect(response.headers.get('x-middleware-next')).toBe('1')
  })
})
