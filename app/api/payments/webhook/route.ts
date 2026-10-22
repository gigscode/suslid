// Payment gateway disabled — uncomment to re-enable
/*
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const paystackKey = process.env.PAYSTACK_SECRET_KEY?.trim()
  if (!paystackKey) {
    return NextResponse.json({ error: 'Paystack secret is not configured' }, { status: 500 })
  }

  const signature = request.headers.get('x-paystack-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()
  const hash = crypto.createHmac('sha512', paystackKey).update(rawBody).digest('hex')
  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { event?: string; data?: { status?: string; reference?: string; metadata?: { user_id?: string; plan?: string } } }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.event === 'charge.success' && event.data?.status === 'success') {
    const userId = event.data.metadata?.user_id
    const targetPlan = event.data.metadata?.plan === 'founding' ? 'founding' : 'pro'
    const reference = event.data.reference

    if (userId && reference) {
      const adminSupabase = createAdminClient()

      await adminSupabase.from('payments')
        .update({ status: 'success' })
        .eq('paystack_reference', reference)

      await adminSupabase.from('profiles')
        .update({
          plan: targetPlan,
          plan_activated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    }
  }

  return NextResponse.json({ received: true })
}
*/

import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json({ error: 'Payments are not currently enabled.' }, { status: 503 })
}
