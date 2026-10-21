'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { brand } from '@/lib/pitchpilot/brand'
import { findingsSchema } from '@/lib/pitchpilot/validation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/database.types'

type Prospect = Database['public']['Tables']['prospects']['Row']
type Draft = Database['public']['Tables']['outreach_drafts']['Row']
type Activity = Database['public']['Tables']['activities']['Row']
type StoredAnalysis = Database['public']['Tables']['website_analyses']['Row']
type AgencyProfile = {
  agency_name: string
  agency_type: 'branding' | 'design' | 'web' | 'marketing' | 'other'
  services: string[]
  target_markets: string[]
  ideal_client_description: string
  preferred_outreach_channel: 'email' | 'dm'
  offer_description: string
}

const statusLabels: Record<string, string> = {
  new: 'New',
  researched: 'Researched',
  contacted: 'Contacted',
  replied: 'Replied',
  meeting: 'Meeting',
  won: 'Won',
  lost: 'Lost',
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function parseProspect(value: unknown): Prospect | null {
  const item = record(value)
  if (!item || typeof item.id !== 'string' || typeof item.user_id !== 'string' ||
    typeof item.business_name !== 'string' || typeof item.source !== 'string' ||
    typeof item.status !== 'string' || typeof item.created_at !== 'string' ||
    typeof item.updated_at !== 'string') return null
  const nullableString = (key: string) => typeof item[key] === 'string' ? item[key] as string : null
  return {
    id: item.id,
    user_id: item.user_id,
    business_name: item.business_name,
    website_url: nullableString('website_url'),
    country: nullableString('country'),
    industry: nullableString('industry'),
    contact_name: nullableString('contact_name'),
    contact_email: nullableString('contact_email'),
    source: item.source,
    status: item.status,
    notes: nullableString('notes'),
    next_follow_up_at: nullableString('next_follow_up_at'),
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

function parseDraft(value: unknown): Draft | null {
  const item = record(value)
  if (!item || typeof item.id !== 'string' || typeof item.user_id !== 'string' ||
    typeof item.prospect_id !== 'string' || typeof item.channel !== 'string' ||
    typeof item.body !== 'string' || typeof item.status !== 'string' ||
    typeof item.created_at !== 'string' || typeof item.updated_at !== 'string') return null
  return {
    id: item.id,
    user_id: item.user_id,
    prospect_id: item.prospect_id,
    channel: item.channel,
    subject: typeof item.subject === 'string' ? item.subject : null,
    body: item.body,
    status: item.status,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

function parseActivity(value: unknown): Activity | null {
  const item = record(value)
  if (!item || typeof item.id !== 'string' || typeof item.user_id !== 'string' ||
    typeof item.prospect_id !== 'string' || typeof item.activity_type !== 'string' ||
    typeof item.created_at !== 'string') return null
  return {
    id: item.id,
    user_id: item.user_id,
    prospect_id: item.prospect_id,
    activity_type: item.activity_type,
    notes: typeof item.notes === 'string' ? item.notes : null,
    due_at: typeof item.due_at === 'string' ? item.due_at : null,
    completed_at: typeof item.completed_at === 'string' ? item.completed_at : null,
    created_at: item.created_at,
  }
}

function parseStoredAnalysis(value: StoredAnalysis) {
  const findings = findingsSchema.safeParse(value.findings)
  return findings.success ? {
    prospect_id: value.prospect_id,
    summary: findings.data.business_summary,
    findings: findings.data,
    url: value.analyzed_url,
  } : null
}

async function responseError(response: Response): Promise<string> {
  const payload = record(await response.json().catch(() => null))
  return typeof payload?.error === 'string' ? payload.error : 'Something went wrong. Please try again.'
}

const inputClass = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus-visible:border-teal-700 focus-visible:ring-3 focus-visible:ring-teal-700/15'
const labelClass = 'grid gap-1.5 text-sm font-medium text-slate-700'
const buttonClass = 'inline-flex min-h-10 items-center justify-center rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800 disabled:cursor-not-allowed disabled:opacity-55'

function Onboarding({ onSaved }: { onSaved: (profile: AgencyProfile) => void }) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const payload = {
      agency_name: String(form.get('agency_name') ?? ''),
      agency_type: String(form.get('agency_type') ?? 'design'),
      services: String(form.get('services') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
      target_markets: String(form.get('target_markets') ?? '').split(',').map((item) => item.trim()).filter(Boolean),
      ideal_client_description: String(form.get('ideal_client_description') ?? ''),
      preferred_outreach_channel: String(form.get('preferred_outreach_channel') ?? 'email'),
      offer_description: String(form.get('offer_description') ?? ''),
    }
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await responseError(response))
      const data = record(await response.json())
      const saved = record(data?.profile)
      if (!saved || typeof saved.agency_name !== 'string') throw new Error('The server returned an invalid agency profile.')
      onSaved({
        agency_name: saved.agency_name,
        agency_type: payload.agency_type as AgencyProfile['agency_type'],
        services: payload.services,
        target_markets: payload.target_markets,
        ideal_client_description: payload.ideal_client_description,
        preferred_outreach_channel: payload.preferred_outreach_channel as AgencyProfile['preferred_outreach_channel'],
        offer_description: payload.offer_description,
      })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not save your profile.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-8 sm:py-16">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">First, your agency</p>
      <h1 className="mt-3 max-w-2xl font-serif text-4xl font-medium tracking-tight text-slate-950 sm:text-5xl">Make every introduction sound like you.</h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Tell us what you do and who you want to work with. We’ll use it to keep prospect research specific and outreach grounded.</p>
      <form onSubmit={submit} className="mt-8 grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-8">
        <label className={labelClass}>Agency name<input name="agency_name" className={inputClass} required maxLength={120} /></label>
        <label className={labelClass}>Agency focus
          <select name="agency_type" className={inputClass} defaultValue="design">
            <option value="branding">Branding</option><option value="design">Graphic / UI design</option>
            <option value="web">Web design</option><option value="marketing">Creative marketing</option><option value="other">Other creative work</option>
          </select>
        </label>
        <label className={labelClass}>Services <span className="text-xs font-normal text-slate-500">Separate with commas</span>
          <input name="services" className={inputClass} placeholder="Brand identity, web design" required maxLength={600} />
        </label>
        <label className={labelClass}>Markets you serve <span className="text-xs font-normal text-slate-500">Separate with commas</span>
          <input name="target_markets" className={inputClass} placeholder="Nigeria, Ghana" required maxLength={600} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>Your offer
          <textarea name="offer_description" className={`${inputClass} min-h-24`} placeholder="What kind of work do you help clients do?" required maxLength={1000} />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>Ideal client <span className="text-xs font-normal text-slate-500">Optional</span>
          <textarea name="ideal_client_description" className={`${inputClass} min-h-20`} placeholder="A short description of the businesses you work best with" maxLength={1000} />
        </label>
        <label className={labelClass}>Preferred outreach
          <select name="preferred_outreach_channel" className={inputClass}><option value="email">Email</option><option value="dm">Direct message</option></select>
        </label>
        {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2"><button className={buttonClass} type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save agency profile'}</button></div>
      </form>
    </main>
  )
}

function ProspectEditor({ initial, onCancel, onSave }: {
  initial?: Prospect
  onCancel: () => void
  onSave: (payload: Record<string, string>) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setPending(true)
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(['business_name', 'website_url', 'country', 'industry', 'contact_name', 'contact_email', 'notes']
      .map((key) => [key, String(form.get(key) ?? '').trim()]))
    try {
      await onSave(payload)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not save this prospect.')
    } finally {
      setPending(false)
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
      <div className="flex items-center justify-between sm:col-span-2">
        <h2 className="font-semibold text-slate-950">{initial ? 'Edit prospect' : 'Add a prospect'}</h2>
        <button type="button" onClick={onCancel} className="text-sm font-medium text-slate-500 underline">Cancel</button>
      </div>
      <label className={labelClass}>Business name<input name="business_name" className={inputClass} required maxLength={160} defaultValue={initial?.business_name} /></label>
      <label className={labelClass}>Website<input name="website_url" className={inputClass} type="text" placeholder="example.com" maxLength={2048} defaultValue={initial?.website_url ?? ''} /></label>
      <label className={labelClass}>Country<input name="country" className={inputClass} maxLength={80} defaultValue={initial?.country ?? ''} /></label>
      <label className={labelClass}>Industry<input name="industry" className={inputClass} maxLength={100} defaultValue={initial?.industry ?? ''} /></label>
      <label className={labelClass}>Contact name<input name="contact_name" className={inputClass} maxLength={160} defaultValue={initial?.contact_name ?? ''} /></label>
      <label className={labelClass}>Contact email<input name="contact_email" className={inputClass} type="email" maxLength={320} defaultValue={initial?.contact_email ?? ''} /></label>
      <label className={`${labelClass} sm:col-span-2`}>Notes<textarea name="notes" className={`${inputClass} min-h-20`} maxLength={4000} defaultValue={initial?.notes ?? ''} /></label>
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2"><button type="submit" className={buttonClass} disabled={pending}>{pending ? 'Saving…' : 'Save prospect'}</button></div>
    </form>
  )
}

export function PitchPilotWorkspace({
  initialProfile,
  initialProspects,
  initialDrafts,
  initialActivities,
  initialAnalyses,
}: {
  initialProfile: AgencyProfile | null
  initialProspects: Prospect[]
  initialDrafts: Draft[]
  initialActivities: Activity[]
  initialAnalyses: StoredAnalysis[]
}) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [prospects, setProspects] = useState(initialProspects)
  const [drafts, setDrafts] = useState(initialDrafts)
  const [activities, setActivities] = useState(initialActivities)
  const [selectedId, setSelectedId] = useState(initialProspects[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<Prospect | undefined>()
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('')
  const [analysis, setAnalysis] = useState(() => initialAnalyses.map(parseStoredAnalysis).find((item) => item?.prospect_id === initialProspects[0]?.id) ?? null)
  const [followUpNote, setFollowUpNote] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  const selected = prospects.find((item) => item.id === selectedId) ?? null
  const visibleProspects = useMemo(() => prospects.filter((item) =>
    `${item.business_name} ${item.country ?? ''} ${item.industry ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())),
  [prospects, search])
  const selectedDrafts = drafts.filter((draft) => draft.prospect_id === selectedId)
  const selectedActivities = activities.filter((activity) => activity.prospect_id === selectedId)
  const dueCount = prospects.filter((item) => item.next_follow_up_at && new Date(item.next_follow_up_at).getTime() <= Date.now()).length

  async function saveProspect(payload: Record<string, string>) {
    const editingNow = editing
    const response = await fetch(editingNow ? `/api/prospects/${editingNow.id}` : '/api/prospects', {
      method: editingNow ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(await responseError(response))
    const data = record(await response.json())
    const saved = parseProspect(data?.prospect)
    if (!saved) throw new Error('The server returned an invalid prospect.')
    const createdActivity = !editingNow ? parseActivity(data?.activity) : null
    setProspects((current) => editingNow
      ? current.map((item) => item.id === saved.id ? saved : item)
      : [saved, ...current])
    if (createdActivity) setActivities((current) => [createdActivity, ...current])
    setSelectedId(saved.id)
    setShowEditor(false)
    setEditing(undefined)
    setNotice(editingNow ? 'Prospect updated.' : 'Prospect saved.')
  }

  async function deleteProspect(prospect: Prospect) {
    if (!window.confirm(`Delete ${prospect.business_name} and its saved research?`)) return
    setWorking(true)
    try {
      const response = await fetch(`/api/prospects/${prospect.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await responseError(response))
      const rest = prospects.filter((item) => item.id !== prospect.id)
      setProspects(rest)
      setSelectedId(rest[0]?.id ?? '')
      setDrafts((current) => current.filter((item) => item.prospect_id !== prospect.id))
      setActivities((current) => current.filter((item) => item.prospect_id !== prospect.id))
      setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((item) => item?.prospect_id === rest[0]?.id) ?? null)
      setNotice('Prospect and related research deleted.')
    } catch (caughtError) {
      setNotice(caughtError instanceof Error ? caughtError.message : 'Could not delete this prospect.')
    } finally {
      setWorking(false)
    }
  }

  async function analyze() {
    if (!selected?.website_url) {
      setNotice('Add a public website URL to this prospect first.')
      return
    }
    setWorking(true)
    setNotice('')
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: selected.id, website_url: selected.website_url }),
      })
      if (!response.ok) throw new Error(await responseError(response))
      const data = record(await response.json())
      const savedAnalysis = record(data?.analysis)
      const validated = findingsSchema.safeParse(savedAnalysis?.findings)
      const nextDrafts = Array.isArray(data?.drafts) ? data.drafts.map(parseDraft).filter((item): item is Draft => item !== null) : []
      if (!validated.success || typeof savedAnalysis?.analyzed_url !== 'string') throw new Error('The server returned an invalid analysis.')
      setAnalysis({ prospect_id: selected.id, summary: validated.data.business_summary, findings: validated.data, url: savedAnalysis.analyzed_url })
      setDrafts((current) => [...nextDrafts, ...current])
      setProspects((current) => current.map((item) => item.id === selected.id ? { ...item, status: 'researched' } : item))
      setNotice('Page review and drafts saved.')
      router.refresh()
    } catch (caughtError) {
      setNotice(caughtError instanceof Error ? caughtError.message : 'Could not analyze this website.')
    } finally {
      setWorking(false)
    }
  }

  async function saveDraft(draft: Draft, subject: string, body: string) {
    const response = await fetch(`/api/outreach/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject || null, body }),
    })
    if (!response.ok) throw new Error(await responseError(response))
    const data = record(await response.json())
    const saved = parseDraft(data?.draft)
    if (!saved) throw new Error('The server returned an invalid draft.')
    setDrafts((current) => current.map((item) => item.id === saved.id ? saved : item))
    setNotice('Draft saved.')
  }

  async function saveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setWorking(true)
    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_id: selected.id,
          notes: followUpNote,
          due_at: followUpDate ? new Date(followUpDate).toISOString() : null,
        }),
      })
      if (!response.ok) throw new Error(await responseError(response))
      const data = record(await response.json())
      const activity = parseActivity(data?.activity)
      if (!activity) throw new Error('The server returned an invalid activity.')
      setActivities((current) => [activity, ...current])
      if (activity.due_at) setProspects((current) => current.map((item) => item.id === selected.id ? { ...item, next_follow_up_at: activity.due_at } : item))
      setFollowUpNote('')
      setFollowUpDate('')
      setNotice('Follow-up saved.')
    } catch (caughtError) {
      setNotice(caughtError instanceof Error ? caughtError.message : 'Could not save this follow-up.')
    } finally {
      setWorking(false)
    }
  }

  async function signOut() {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) {
      setNotice('Could not sign out. Try again.')
      return
    }
    router.replace('/login')
    router.refresh()
  }

  if (!profile) return <Onboarding onSaved={(saved) => { setProfile(saved); setNotice('Agency profile saved.') }} />

  return (
    <div className="min-h-screen bg-[#f5f4ef] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <a href="/app" className="font-serif text-2xl font-semibold tracking-tight">{brand.name}<span className="ml-1 text-teal-800">.</span></a>
          <div className="hidden text-right sm:block"><p className="text-sm font-semibold">{profile.agency_name}</p><p className="text-xs text-slate-500">Prospect workspace</p></div>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => void signOut()}>Sign out</button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-8 sm:py-10">
        <section className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">Your acquisition desk</p>
            <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight text-slate-950 sm:text-5xl">Find the opening.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Research one public page, find a grounded conversation starter, and make the pitch your own.</p>
          </div>
          <button type="button" className={buttonClass} onClick={() => { setEditing(undefined); setShowEditor(true) }}>+ Add a prospect</button>
        </section>

        <section aria-label="Prospect overview" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            ['Prospects saved', prospects.length],
            ['Pages reviewed', new Set(drafts.map((item) => item.prospect_id)).size],
            ['Follow-ups due', dueCount],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"><p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 font-serif text-3xl text-slate-950">{value}</p></div>)}
        </section>

        {notice && <p role="status" className="mt-5 rounded-xl border border-teal-900/15 bg-teal-50 px-4 py-3 text-sm text-teal-950">{notice}</p>}
        {showEditor && <div className="mt-6"><ProspectEditor initial={editing} onCancel={() => { setShowEditor(false); setEditing(undefined) }} onSave={saveProspect} /></div>}

        <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(270px,0.8fr)_minmax(0,1.7fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-slate-950">Prospects</h2><span className="text-xs text-slate-500">{prospects.length} saved</span></div>
            <label className="mt-4 block"><span className="sr-only">Search prospects</span><input className={inputClass} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search businesses" /></label>
            <div className="mt-3 grid gap-2">
              {visibleProspects.map((prospect) => <button type="button" key={prospect.id} onClick={() => { setSelectedId(prospect.id); setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((item) => item?.prospect_id === prospect.id) ?? null) }} className={`rounded-xl border p-3 text-left transition ${selectedId === prospect.id ? 'border-teal-800 bg-teal-50/70' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'}`}>
                <span className="block font-semibold text-slate-900">{prospect.business_name}</span>
                <span className="mt-1 block truncate text-xs text-slate-500">{prospect.website_url ?? 'No website added'}</span>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{statusLabels[prospect.status] ?? prospect.status}</span>
              </button>)}
              {visibleProspects.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{prospects.length ? 'No prospects match this search.' : 'Your first good prospect is one business away.'}</p>}
            </div>
          </aside>

          <div className="grid min-w-0 gap-6">
            {selected ? <>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-xs font-bold uppercase tracking-wider text-teal-800">{selected.industry || 'Prospect'}</p><h2 className="mt-1 font-serif text-3xl font-medium tracking-tight">{selected.business_name}</h2><p className="mt-2 break-all text-sm text-slate-600">{selected.website_url || 'Add a website URL to start a page review.'}</p></div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50" onClick={() => { setEditing(selected); setShowEditor(true) }}>Edit</button>
                    <button type="button" disabled={working} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-50 disabled:opacity-50" onClick={() => void deleteProspect(selected)}>Delete</button>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
                  <button type="button" className={buttonClass} disabled={working || !selected.website_url} onClick={() => void analyze()}>{working ? 'Working…' : 'Analyze a prospect'}</button>
                  <label className="flex items-center gap-2 text-sm text-slate-600">Stage
                    <select aria-label="Prospect stage" className="min-h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm" value={selected.status} onChange={async (event) => {
                      const response = await fetch(`/api/prospects/${selected.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: event.target.value }) })
                      if (!response.ok) { setNotice(await responseError(response)); return }
                      setProspects((current) => current.map((item) => item.id === selected.id ? { ...item, status: event.target.value } : item))
                      setNotice('Prospect stage updated.')
                    }}>
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                </div>
              </section>

              {analysis?.prospect_id === selected.id && <section className="rounded-2xl border border-teal-900/20 bg-[#e9f2ed] p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-wider text-teal-900">Limited page review · <a className="underline" href={analysis.url} target="_blank" rel="noreferrer">inspected page</a></p>
                <h3 className="mt-3 font-serif text-2xl">What stood out</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{analysis.summary}</p>
                <div className="mt-4 grid gap-3">
                  {analysis.findings.observations.map((item, index) => <article key={`${item.category}-${index}`} className="rounded-xl border border-teal-900/10 bg-white/75 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{item.claim}</h4><span className="text-xs capitalize text-slate-500">{item.confidence} confidence · {item.category}</span></div>
                    <blockquote className="mt-2 border-l-2 border-teal-700 pl-3 text-sm italic text-slate-600">“{item.evidence}”</blockquote>
                    <p className="mt-2 text-sm text-slate-700"><span className="font-semibold">Possible next step:</span> {item.next_step}</p>
                  </article>)}
                </div>
                {analysis.findings.suggested_services.length > 0 && <p className="mt-4 text-sm"><span className="font-semibold">Services to consider:</span> {analysis.findings.suggested_services.join(', ')}</p>}
                {analysis.findings.limitations.map((item) => <p key={item} className="mt-2 text-xs leading-5 text-slate-600">Limitation: {item}</p>)}
              </section>}

              {selectedDrafts.length > 0 && <section className="grid gap-4">
                <div><p className="text-xs font-bold uppercase tracking-wider text-teal-800">Your words, ready to edit</p><h3 className="mt-1 font-serif text-2xl">Outreach drafts</h3></div>
                {selectedDrafts.map((draft) => <DraftEditor key={draft.id} draft={draft} onSave={saveDraft} />)}
              </section>}

              <section className="grid gap-4 lg:grid-cols-2">
                <form onSubmit={(event) => void saveFollowUp(event)} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold">Save a follow-up</h3>
                  <label className={`${labelClass} mt-4`}>Note<textarea className={`${inputClass} min-h-20`} value={followUpNote} onChange={(event) => setFollowUpNote(event.target.value)} required maxLength={1000} placeholder="What should you remember?" /></label>
                  <label className={`${labelClass} mt-3`}>Reminder date <span className="text-xs font-normal text-slate-500">Optional</span><input className={inputClass} type="date" value={followUpDate} onChange={(event) => setFollowUpDate(event.target.value)} /></label>
                  <button className={`${buttonClass} mt-4`} type="submit" disabled={working}>Save activity</button>
                </form>
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="font-semibold">Recent activity</h3>
                  <ul className="mt-3 grid gap-3">
                    {selectedActivities.slice(0, 6).map((activity) => <li key={activity.id} className="border-l-2 border-teal-700/40 pl-3"><p className="text-sm text-slate-800">{activity.notes || activity.activity_type.replaceAll('_', ' ')}</p><time className="mt-1 block text-xs text-slate-500">{new Date(activity.created_at).toLocaleDateString()}</time></li>)}
                    {selectedActivities.length === 0 && <li className="text-sm leading-6 text-slate-500">Notes from your research and follow-ups will appear here.</li>}
                  </ul>
                </div>
              </section>
            </> : <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-teal-800">Start with one</p><h2 className="mt-2 font-serif text-3xl">A thoughtful prospect beats a long list.</h2><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">Add a business you would genuinely like to help. We’ll keep the research focused on public information from its website.</p><button type="button" className={`${buttonClass} mt-5`} onClick={() => setShowEditor(true)}>Add your first prospect</button>
            </section>}
          </div>
        </div>
      </main>
    </div>
  )
}

function DraftEditor({ draft, onSave }: { draft: Draft; onSave: (draft: Draft, subject: string, body: string) => Promise<void> }) {
  const [subject, setSubject] = useState(draft.subject ?? '')
  const [body, setBody] = useState(draft.body)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      await onSave(draft, subject, body)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not save this draft.')
    } finally {
      setPending(false)
    }
  }
  return <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <div className="flex items-center justify-between gap-3"><h4 className="font-semibold capitalize">{draft.channel === 'dm' ? 'Direct message' : 'Email'}</h4><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs capitalize text-slate-600">{draft.status}</span></div>
    {draft.channel === 'email' && <label className={`${labelClass} mt-4`}>Subject<input className={inputClass} value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={180} /></label>}
    <label className={`${labelClass} mt-4`}>Message<textarea className={`${inputClass} min-h-36 leading-6`} value={body} onChange={(event) => setBody(event.target.value)} required maxLength={3000} /></label>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <button type="submit" className={`${buttonClass} mt-4`} disabled={pending}>{pending ? 'Saving…' : 'Save draft'}</button>
  </form>
}
