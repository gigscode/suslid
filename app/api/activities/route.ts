import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { activitySchema } from '@/lib/pitchpilot/validation'

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
  const parsed = activitySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Add a follow-up note before saving.' }, { status: 400 })

  const { data: prospect, error: prospectError } = await supabase
    .from('prospects')
    .select('id')
    .eq('id', parsed.data.prospect_id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (prospectError) return NextResponse.json({ error: 'Could not verify this prospect.' }, { status: 500 })
  if (!prospect) return NextResponse.json({ error: 'Prospect not found.' }, { status: 404 })

  const { data, error } = await supabase.from('activities').insert({
    user_id: user.id,
    prospect_id: prospect.id,
    activity_type: 'follow_up',
    notes: parsed.data.notes,
    due_at: parsed.data.due_at ?? null,
  }).select('*').single()
  if (error) return NextResponse.json({ error: 'Could not save this follow-up.' }, { status: 500 })
  if (parsed.data.due_at) {
    const updated = await supabase.from('prospects')
      .update({ next_follow_up_at: parsed.data.due_at })
      .eq('id', prospect.id)
      .eq('user_id', user.id)
    if (updated.error) return NextResponse.json({ error: 'Follow-up note saved, but the prospect reminder could not be updated.' }, { status: 500 })
  }
  return NextResponse.json({ activity: data }, { status: 201 })
}
