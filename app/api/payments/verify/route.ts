import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const reference = searchParams.get('reference') || searchParams.get('trxref')

  const origin = request.headers.get('origin') ||
    request.headers.get('referer')?.replace(/^(https?:\/\/[^/]+).*/, '$1') ||
    'http://localhost:3000'

  if (!reference) {
    return NextResponse.redirect(`${origin}/app?error=missing_reference`)
  }

  const paystackKey = process.env.PAYSTACK_SECRET_KEY?.trim()
  if (!paystackKey) {
    return NextResponse.redirect(`${origin}/app?error=paystack_not_configured`)
  }

  try {
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: {
        Authorization: `Bearer ${paystackKey}`,
      },
      cache: 'no-store',
    })

    const result = await verifyRes.json()
    if (!verifyRes.ok || !result.status || result.data?.status !== 'success') {
      return NextResponse.redirect(`${origin}/app?error=payment_failed`)
    }

    const { metadata } = result.data
    const userId = metadata?.user_id
    const targetPlan = metadata?.plan === 'founding' ? 'founding' : 'pro'

    if (userId) {
      const adminSupabase = createAdminClient()

      // Update payment record
      await adminSupabase.from('payments')
        .update({ status: 'success' })
        .eq('paystack_reference', reference)

      // Update user's profile with their new plan
      await adminSupabase.from('profiles')
        .update({
          plan: targetPlan,
          plan_activated_at: new Date().toISOString(),
        })
        .eq('id', userId)
    }

    return NextResponse.redirect(`${origin}/app?upgraded=true`)
  } catch (err) {
    console.error('Payment verification failed:', err)
    return NextResponse.redirect(`${origin}/app?error=verification_failed`)
  }
}

