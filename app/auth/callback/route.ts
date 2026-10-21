import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const next = request.nextUrl.searchParams.get('next')
  let destination = '/app'
  if (next?.startsWith('/') && !next.startsWith('//') && !next.includes('\\')) {
    const candidate = new URL(next, request.url)
    if (candidate.origin === request.nextUrl.origin) destination = `${candidate.pathname}${candidate.search}${candidate.hash}`
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=confirmation', request.url))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(new URL('/login?error=confirmation', request.url))
  }

  return NextResponse.redirect(new URL(destination, request.url))
}
