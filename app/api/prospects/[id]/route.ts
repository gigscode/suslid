import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizePublicWebsiteUrl, WebsiteFetchError } from '@/lib/pitchpilot/website'
import { prospectSchema } from '@/lib/pitchpilot/validation'
import type { Database } from '@/lib/supabase/database.types'

type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, context: Context) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  const { id } = await context.params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 })
  }
  const parsed = prospectSchema.partial().safeParse(body)
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Check the prospect details and try again.' }, { status: 400 })
  }
  let previousStatus: string | null = null
  if (parsed.data.status) {
    const current = await supabase.from('prospects').select('status').eq('id', id).eq('user_id', user.id).maybeSingle()
    if (current.error) return NextResponse.json({ error: 'Could not load this prospect.' }, { status: 500 })
    if (!current.data) return NextResponse.json({ error: 'Prospect not found.' }, { status: 404 })
    previousStatus = current.data.status
  }
  const update: Database['public']['Tables']['prospects']['Update'] = { ...parsed.data }
  if (parsed.data.website_url !== undefined) {
    try {
      update.website_url = parsed.data.website_url
        ? normalizePublicWebsiteUrl(parsed.data.website_url).toString()
        : null
    } catch (error) {
      if (error instanceof WebsiteFetchError) return NextResponse.json({ error: error.message }, { status: 400 })
      throw error
    }
  }
  for (const field of ['country', 'industry', 'contact_name', 'contact_email', 'notes'] as const) {
    if (parsed.data[field] === '') update[field] = null
  }

  const { data, error } = await supabase
    .from('prospects')
    .update(update)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not update this prospect.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Prospect not found.' }, { status: 404 })
  if (previousStatus && parsed.data.status && previousStatus !== parsed.data.status) {
    const activity = await supabase.from('activities').insert({
      user_id: user.id,
      prospect_id: data.id,
      activity_type: 'status_changed',
      notes: `Status changed from ${previousStatus} to ${parsed.data.status}.`,
    })
    if (activity.error) return NextResponse.json({ error: 'Prospect was updated, but its status activity could not be recorded.' }, { status: 500 })
  }
  return NextResponse.json({ prospect: data })
}

export async function DELETE(_request: Request, context: Context) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 })
  const { id } = await context.params
  const { data, error } = await supabase
    .from('prospects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not delete this prospect.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Prospect not found.' }, { status: 404 })
  return NextResponse.json({ deleted: true })
}
