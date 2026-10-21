import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePublicWebsiteUrl, WebsiteFetchError } from '@/lib/pitchpilot/website'
import { prospectSchema } from '@/lib/pitchpilot/validation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  const { data, error } = await supabase
    .from('prospects')
    .select('id, business_name, website_url, country, industry, contact_name, contact_email, source, status, notes, next_follow_up_at, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'Could not load your prospects.' }, { status: 500 })
  return NextResponse.json({ prospects: data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
  const parsed = prospectSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Check the prospect details and try again.' }, { status: 400 })

  let websiteUrl: string | null = null
  if (parsed.data.website_url) {
    try {
      websiteUrl = normalizePublicWebsiteUrl(parsed.data.website_url).toString()
    } catch (error) {
      if (error instanceof WebsiteFetchError) return NextResponse.json({ error: error.message }, { status: 400 })
      throw error
    }
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert({
      user_id: user.id,
      business_name: parsed.data.business_name,
      website_url: websiteUrl,
      country: parsed.data.country || null,
      industry: parsed.data.industry || null,
      contact_name: parsed.data.contact_name || null,
      contact_email: parsed.data.contact_email || null,
      source: parsed.data.source || 'manual',
      status: parsed.data.status || 'new',
      notes: parsed.data.notes || null,
      next_follow_up_at: parsed.data.next_follow_up_at ?? null,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: 'Could not save this prospect.' }, { status: 500 })

  const { data: activity, error: activityError } = await supabase.from('activities').insert({
    user_id: user.id,
    prospect_id: data.id,
    activity_type: 'prospect_created',
    notes: 'Prospect added.',
  }).select('*').single()
  if (activityError) return NextResponse.json({ error: 'Prospect was saved, but its activity could not be recorded.' }, { status: 500 })
  return NextResponse.json({ prospect: data, activity }, { status: 201 })
}
