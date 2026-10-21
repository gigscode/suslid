import { redirect } from 'next/navigation'
import { PitchPilotWorkspace } from '@/components/pitchpilot-workspace'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const profileFields = 'agency_name, agency_type, services, target_markets, ideal_client_description, preferred_outreach_channel, offer_description'

export default async function AppPage() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError && authError.name !== 'AuthSessionMissingError') {
    throw new Error('Could not verify your Supabase session.', { cause: authError })
  }
  if (!user) redirect('/login')

  const [profileResult, prospectsResult, draftsResult, activitiesResult, analysesResult] = await Promise.all([
    supabase.from('profiles').select(profileFields).eq('id', user.id).maybeSingle(),
    supabase.from('prospects').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('outreach_drafts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('activities').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    supabase.from('website_analyses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
  ])

  const profile = profileResult.data
  const agencyProfile = profile?.agency_name &&
    ['branding', 'design', 'web', 'marketing', 'other'].includes(profile.agency_type ?? '') &&
    ['email', 'dm'].includes(profile.preferred_outreach_channel)
    ? {
        agency_name: profile.agency_name,
        agency_type: profile.agency_type as 'branding' | 'design' | 'web' | 'marketing' | 'other',
        services: profile.services,
        target_markets: profile.target_markets,
        ideal_client_description: profile.ideal_client_description ?? '',
        preferred_outreach_channel: profile.preferred_outreach_channel as 'email' | 'dm',
        offer_description: profile.offer_description ?? '',
      }
    : null
  const loadError = profileResult.error || prospectsResult.error || draftsResult.error || activitiesResult.error || analysesResult.error

  return (
    <>
      {loadError && <div role="alert" className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950">
        SusLid data is not ready. Apply the migrations in <code>supabase/migrations</code> to your Supabase project, then reload.
      </div>}
      <PitchPilotWorkspace
        initialProfile={agencyProfile}
        initialProspects={prospectsResult.data ?? []}
        initialDrafts={draftsResult.data ?? []}
        initialActivities={activitiesResult.data ?? []}
        initialAnalyses={analysesResult.data ?? []}
      />
    </>
  )
}
