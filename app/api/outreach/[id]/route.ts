import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { draftUpdateSchema } from '@/lib/pitchpilot/validation'

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
  const parsed = draftUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Draft text is invalid or too long.' }, { status: 400 })
  const { data, error } = await supabase.from('outreach_drafts')
    .update(parsed.data)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not save this draft.' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 })

  const activity = await supabase.from('activities').insert({
    user_id: user.id,
    prospect_id: data.prospect_id,
    activity_type: 'draft_saved',
    notes: `${data.channel === 'email' ? 'Email' : 'Direct message'} draft saved.`,
  })
  if (activity.error) return NextResponse.json({ error: 'Draft was saved, but the activity could not be recorded.' }, { status: 500 })
  return NextResponse.json({ draft: data })
}
