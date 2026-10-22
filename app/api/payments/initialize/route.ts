import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanType } from '@/lib/pitchpilot/pricing'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Sign in to select a plan.' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }

  const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {}
  const requestedPlan = payload.plan
  if (requestedPlan !== 'pro' && requestedPlan !== 'founding') {
    return NextResponse.json({ error: 'Choose either the Pro or Founding customer plan.' }, { status: 400 })
  }
  const targetPlan: 'pro' | 'founding' = requestedPlan

  const planDetails = PLANS[targetPlan]
  const paystackKey = process.env.PAYSTACK_SECRET_KEY?.trim()

  const origin = request.headers.get('origin') ||
    request.headers.get('referer')?.replace(/^(https?:\/\/[^/]+).*/, '$1') ||
    'http://localhost:3000'

  // If Paystack key is not configured, provide a clear response
  if (!paystackKey) {
    return NextResponse.json({
      error: 'Paystack is not configured. Add PAYSTACK_SECRET_KEY to your server environment.',
      code: 'PAYSTACK_NOT_CONFIGURED',
      plan: planDetails.id,
      amountKobo: planDetails.amountKobo,
    }, { status: 503 })
  }

  try {
    const callbackUrl = `${origin}/api/payments/verify`
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: planDetails.amountKobo,
        currency: 'NGN',
        callback_url: callbackUrl,
        metadata: {
          user_id: user.id,
          plan: planDetails.id,
        },
      }),
    })

    const result = await paystackRes.json()
    if (!paystackRes.ok || !result.status) {
      return NextResponse.json({
        error: result.message || 'Could not initialize payment with Paystack.',
      }, { status: 502 })
    }

    const { authorization_url, reference } = result.data

    // Record pending transaction in Supabase
    await supabase.from('payments').insert({
      user_id: user.id,
      paystack_reference: reference,
      amount_kobo: planDetails.amountKobo,
      currency: 'NGN',
      status: 'pending',
      plan: targetPlan,
    })

    return NextResponse.json({
      authorization_url,
      reference,
    })
  } catch (err) {
    console.error('Paystack initialization failed:', err)
    return NextResponse.json({ error: 'Could not connect to payment provider. Try again.' }, { status: 502 })
  }
}
