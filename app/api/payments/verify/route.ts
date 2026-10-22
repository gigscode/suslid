// Payment gateway disabled. To re-enable, remove the stub below and restore this file from git.

import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ error: 'Payments are not currently enabled.' }, { status: 503 })
}
