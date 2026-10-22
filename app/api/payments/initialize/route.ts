// Payment gateway disabled. To re-enable, remove the stub below and restore this file from git.

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json({ error: 'Payments are not currently enabled.' }, { status: 503 })
}
