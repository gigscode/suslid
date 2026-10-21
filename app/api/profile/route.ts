import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { agencyProfileSchema } from '@/lib/pitchpilot/validation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select('agency_name, agency_type, services, target_markets, ideal_client_description, preferred_outreach_channel, offer_description')
    .eq('id', user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load your agency profile.' }, { status: 500 })
  return NextResponse.json({ profile: data })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
  const parsed = agencyProfileSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Check the agency details and try again.' }, { status: 400 })

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...parsed.data }, { onConflict: 'id' })
    .select('agency_name, agency_type, services, target_markets, ideal_client_description, preferred_outreach_channel, offer_description')
    .single()
  if (error) return NextResponse.json({ error: 'Could not save your agency profile.' }, { status: 500 })
  return NextResponse.json({ profile: data })
}
