'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  BookmarkCheck, BriefcaseBusiness, Check, FolderKanban, LogOut, Mail, Menu, Pencil, Plus, Search,
  Send, Settings2, Target, Trash2, UserRound, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProfileDocuments } from '@/components/profile-documents'
import { PitchGenerator } from '@/components/pitch-generator'
import { JobDiscovery } from '@/components/job-discovery'
import { createClient } from '@/lib/supabase/client'

export type Opportunity = {
  id: string
  company_name: string
  title: string
  description: string | null
  source_name: string | null
  source_url: string | null
  contact_name: string | null
  contact_email: string | null
  compensation: string | null
  fit_score: number | null
  status: string
  created_at: string
}

export type OpportunityFormValues = {
  company_name: string
  title: string
  description: string | null
  source_name: string | null
  source_url: string | null
  contact_name: string | null
  contact_email: string | null
  compensation: string | null
}

const opportunityFields = 'id, company_name, title, description, source_name, source_url, contact_name, contact_email, compensation, fit_score, status, created_at'
const statuses = ['new', 'saved', 'applied', 'archived']
const navItems = [
  { label: 'Discover', key: 'discovery', icon: Search },
  { label: 'Leads', key: 'opportunities', icon: Target },
  { label: 'Campaigns', key: 'campaigns', icon: FolderKanban },
  { label: 'Cover letter & DM', key: 'pitch', icon: BriefcaseBusiness },
  { label: 'Outreach', key: 'outbound', icon: Mail },
  { label: 'Profile', key: 'settings', icon: Settings2 },
]

function safeExternalUrl(value: string | null) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function OpportunityForm({
  initial,
  pending,
  onCancel,
  onSave,
}: {
  initial?: Opportunity
  pending: boolean
  onCancel: () => void
  onSave: (values: OpportunityFormValues, id?: string) => Promise<boolean>
}) {
  const [error, setError] = useState('')
  const [values, setValues] = useState({
    company_name: initial?.company_name ?? '',
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    source_name: initial?.source_name ?? '',
    source_url: initial?.source_url ?? '',
    contact_name: initial?.contact_name ?? '',
    contact_email: initial?.contact_email ?? '',
    compensation: initial?.compensation ?? '',
  })

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const sourceUrl = values.source_url.trim()
    if (sourceUrl && !safeExternalUrl(sourceUrl)) {
      setError('Enter a valid http or https link.')
      return
    }

    const saved = await onSave({
      company_name: values.company_name.trim(),
      title: values.title.trim(),
      description: values.description.trim() || null,
      source_name: values.source_name.trim() || null,
      source_url: sourceUrl || null,
      contact_name: values.contact_name.trim() || null,
      contact_email: values.contact_email.trim() || null,
      compensation: values.compensation.trim() || null,
    }, initial?.id)

    if (saved) onCancel()
    else setError('Could not save this opportunity. Check the notice for details.')
  }

  return (
    <Card className="border-violet-200 bg-white shadow-sm">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-950">{initial ? 'Edit opportunity' : 'Add an opportunity'}</h3>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Close opportunity form" onClick={onCancel}><X aria-hidden="true" /></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Company
              <Input required maxLength={150} value={values.company_name} onChange={(event) => update('company_name', event.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Role or project title
              <Input required maxLength={200} value={values.title} onChange={(event) => update('title', event.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Contact name
              <Input maxLength={150} value={values.contact_name} onChange={(event) => update('contact_name', event.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Contact email
              <Input type="email" maxLength={320} value={values.contact_email} onChange={(event) => update('contact_email', event.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Source
              <Input maxLength={100} value={values.source_name} onChange={(event) => update('source_name', event.target.value)} placeholder="Where you found it" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Source link
              <Input type="url" maxLength={2048} value={values.source_url} onChange={(event) => update('source_url', event.target.value)} placeholder="https://" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">Compensation
              <Input maxLength={100} value={values.compensation} onChange={(event) => update('compensation', event.target.value)} placeholder="Optional" />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">Notes or role details
              <textarea className="min-h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30" maxLength={10000} value={values.description} onChange={(event) => update('description', event.target.value)} />
            </label>
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Saving…' : initial ? 'Save changes' : 'Save opportunity'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function Dashboard({
  userId,
  userEmail,
  initialOpportunities,
  loadError,
}: {
  userId: string
  userEmail: string
  initialOpportunities: Opportunity[]
  loadError: string
}) {
  const router = useRouter()
  const [opportunities, setOpportunities] = useState(initialOpportunities)
  const [active, setActive] = useState('discovery')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Opportunity>()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const [dataError, setDataError] = useState(loadError)

  const filtered = useMemo(() => opportunities.filter((opportunity) => {
    const searchable = [
      opportunity.company_name,
      opportunity.title,
      opportunity.description ?? '',
      opportunity.source_name ?? '',
      opportunity.contact_name ?? '',
    ].join(' ').toLowerCase()
    return searchable.includes(query.trim().toLowerCase())
      && (statusFilter === 'all' || opportunity.status === statusFilter)
  }), [opportunities, query, statusFilter])

  function notify(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 3500)
  }

  async function saveOpportunity(values: OpportunityFormValues, id?: string) {
    setPending(true)
    setDataError('')
    try {
      const supabase = createClient()
      if (id) {
        const { data, error } = await supabase
          .from('opportunities')
          .update(values)
          .eq('id', id)
          .eq('user_id', userId)
          .select(opportunityFields)
          .single()
        if (error) throw error
        setOpportunities((current) => current.map((item) => item.id === id ? data : item))
        notify('Opportunity updated.')
      } else {
        const { data, error } = await supabase
          .from('opportunities')
          .insert({ ...values, user_id: userId })
          .select(opportunityFields)
          .single()
        if (error) throw error
        setOpportunities((current) => [data, ...current])
        notify('Opportunity saved.')
      }
      return true
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Could not save the opportunity.'
      setDataError(message)
      notify(message)
      return false
    } finally {
      setPending(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setDataError('')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('opportunities')
        .update({ status })
        .eq('id', id)
        .eq('user_id', userId)
      if (error) throw error
      setOpportunities((current) => current.map((item) => item.id === id ? { ...item, status } : item))
      notify('Status updated.')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Could not update the opportunity status.'
      setDataError(message)
      notify(`Could not update status: ${message}`)
    }
  }

  async function deleteOpportunity(opportunity: Opportunity) {
    if (!window.confirm(`Delete "${opportunity.title}" at ${opportunity.company_name}?`)) return
    setDataError('')
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunity.id)
        .eq('user_id', userId)
      if (error) throw error
      setOpportunities((current) => current.filter((item) => item.id !== opportunity.id))
      notify('Opportunity deleted.')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Could not delete the opportunity.'
      setDataError(message)
      notify(`Could not delete opportunity: ${message}`)
    }
  }

  async function signOut() {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.replace('/login')
      router.refresh()
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'Could not sign out.'
      notify(message)
    }
  }

  const title = navItems.find((item) => item.key === active)?.label ?? navItems[0].label
  const savedLeadCount = opportunities.filter((item) => item.status === 'new' || item.status === 'saved').length
  const appliedCount = opportunities.filter((item) => item.status === 'applied').length

  return (
    <div className="flex min-h-screen bg-[#fbfaf7] text-slate-900">
      <aside className="hidden w-62 shrink-0 flex-col bg-[#573da5] px-4 py-6 text-white lg:flex">
        <div className="flex items-center gap-3 px-2">
          <Image src="/gigshqicon.png" alt="" width={40} height={40} className="rounded-xl bg-white p-1" />
          <span className="text-2xl font-bold tracking-tight">remo<span className="text-violet-200">sus</span></span>
        </div>
        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[.12em] text-violet-200/70">Your workspace</p>
        <nav aria-label="Main navigation" className="flex flex-col gap-1">
          {navItems.map(({ label, key, icon: Icon }) => (
            <button key={key} type="button" aria-current={active === key ? 'page' : undefined} onClick={() => setActive(key)} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active === key ? 'bg-white font-semibold text-[#573da5] shadow-sm' : 'text-violet-50 hover:bg-white/10 hover:text-white'}`}>
              <Icon aria-hidden="true" className="size-[18px]" />{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-white/15 bg-white/10 p-4">
          <div className="mb-3 flex items-center gap-2"><UserRound aria-hidden="true" className="size-4 text-violet-200" /><span className="text-[11px] font-semibold uppercase tracking-wide text-violet-100/80">Signed in</span></div>
          <p className="break-all text-xs leading-5 text-violet-50">{userEmail}</p>
          <Button variant="ghost" size="sm" className="mt-3 px-0 text-violet-50 hover:bg-white/10 hover:text-white" onClick={signOut}><LogOut aria-hidden="true" data-icon="inline-start" />Sign out</Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-[88px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 sm:px-8">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">Personal job-search workspace</p>
            <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden max-w-48 truncate text-xs text-slate-500 sm:block">{userEmail}</span>
            <Button type="button" variant="outline" size="icon" className="lg:hidden" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-controls="mobile-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
            </Button>
          </div>
        </header>
        <nav id="mobile-navigation" aria-label="Main navigation" className={`${menuOpen ? 'block' : 'hidden'} border-b border-violet-950/20 bg-[#573da5] px-4 py-3 lg:hidden`}>
          <div className="flex flex-col gap-1">
            {navItems.map(({ label, key, icon: Icon }) => (
              <button key={key} type="button" aria-current={active === key ? 'page' : undefined} onClick={() => { setActive(key); setMenuOpen(false) }} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active === key ? 'bg-white text-[#573da5] shadow-sm' : 'text-violet-50 hover:bg-white/10 hover:text-white'}`}>
                <Icon aria-hidden="true" className="size-[18px]" />{label}
              </button>
            ))}
            <button type="button" onClick={signOut} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-violet-50 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
              <LogOut aria-hidden="true" className="size-[18px]" />Sign out
            </button>
          </div>
        </nav>
        <main className="flex-1 px-5 py-7 sm:px-8 lg:px-10">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
            {dataError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">Could not load your data: {dataError}</div>}
            {active === 'discovery' ? (
              <>
                <section aria-labelledby="job-search-overview-title" className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
                  <div className="relative px-5 py-6 sm:px-7 sm:py-7">
                    <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 size-64 rounded-full border-[32px] border-violet-50/80" />
                    <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                      <div className="max-w-2xl">
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-violet-800">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          Your personal job search
                        </p>
                        <h2 id="job-search-overview-title" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Find your next opportunity</h2>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                          Explore relevant roles, check each source for eligibility, and save the opportunities you want to pursue.
                        </p>
                      </div>
                      <p className="relative max-w-xs rounded-xl bg-violet-50 px-4 py-3 text-xs leading-5 text-violet-950">
                        Your listings are matched by role and skill signals. Confirm details on the original posting.
                      </p>
                    </div>
                  </div>
                  <div className="grid border-t border-slate-100 sm:grid-cols-2">
                    <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r sm:px-7">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-800">
                        <BookmarkCheck aria-hidden="true" className="size-5" />
                      </span>
                      <div>
                        <p className="text-2xl font-extrabold leading-none tabular-nums text-slate-950">{savedLeadCount.toLocaleString()}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Saved leads to review</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-4 sm:px-7">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
                        <Send aria-hidden="true" className="size-4" />
                      </span>
                      <div>
                        <p className="text-2xl font-extrabold leading-none tabular-nums text-slate-950">{appliedCount.toLocaleString()}</p>
                        <p className="mt-1 text-xs font-medium text-slate-500">Marked as applied</p>
                      </div>
                    </div>
                  </div>
                </section>
                <JobDiscovery
                  savedSourceUrls={opportunities.flatMap((opportunity) => opportunity.source_url ? [opportunity.source_url] : [])}
                  onSave={saveOpportunity}
                />
              </>
            ) : active === 'opportunities' ? (
              <>
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
                  <div>
                    <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your saved opportunities</p></div>
                    <p className="mt-2 max-w-2xl text-base font-medium leading-7 text-slate-600">Add roles you find and track each application from one place. These records stay private to your account.</p>
                  </div>
                  <Button className="w-full sm:w-auto" onClick={() => { setEditing(undefined); setShowForm((value) => !value) }}><Plus aria-hidden="true" data-icon="inline-start" />Add opportunity</Button>
                </section>
                {(showForm || editing) && <OpportunityForm key={editing?.id ?? 'new'} initial={editing} pending={pending} onCancel={() => { setShowForm(false); setEditing(undefined) }} onSave={saveOpportunity} />}
                <section aria-label="Search and filter opportunities" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <label className="flex min-h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
                      <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
                      <span className="sr-only">Search saved opportunities</span>
                      <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" placeholder="Search company, role, or notes" />
                    </label>
                    <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
                      <span className="sr-only">Filter by status</span>
                      <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-full bg-transparent outline-none">
                        <option value="all">All statuses</option>
                        {statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                      </select>
                    </label>
                  </div>
                </section>
                <div className="flex items-end justify-between gap-3">
                  <div><h2 className="text-xl font-bold text-slate-950">{filtered.length} {filtered.length === 1 ? 'opportunity' : 'opportunities'}</h2><p className="mt-1 text-base text-slate-600">Private to your signed-in account.</p></div>
                </div>
                {filtered.length ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((opportunity) => {
                      const sourceUrl = safeExternalUrl(opportunity.source_url)
                      return (
                        <Card key={opportunity.id} className="overflow-hidden border-slate-200 bg-white shadow-sm">
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0"><p className="text-sm font-semibold text-slate-600">{opportunity.company_name}</p><h3 className="mt-1 text-lg font-bold leading-6 text-slate-950">{opportunity.title}</h3></div>
                              <Badge variant="outline" className="shrink-0 capitalize">{opportunity.status}</Badge>
                            </div>
                            {opportunity.description && <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{opportunity.description}</p>}
                            <div className="mt-4 space-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
                              {opportunity.contact_name && <p>Contact: {opportunity.contact_name}</p>}
                              {opportunity.contact_email && <p className="break-all">{opportunity.contact_email}</p>}
                              {opportunity.compensation && <p>Compensation: {opportunity.compensation}</p>}
                              {opportunity.source_name && <p>Source: {opportunity.source_name}</p>}
                              {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer" className="inline-block pt-1 font-medium text-violet-800 underline underline-offset-2">Open source</a>}
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                              <label className="sr-only" htmlFor={`status-${opportunity.id}`}>Status for {opportunity.title}</label>
                              <select id={`status-${opportunity.id}`} value={statuses.includes(opportunity.status) ? opportunity.status : 'new'} onChange={(event) => updateStatus(opportunity.id, event.target.value)} className="h-9 min-w-28 rounded-lg border border-slate-200 bg-white px-2 text-xs">
                                {statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}
                              </select>
                              <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={() => { setShowForm(false); setEditing(opportunity) }}><Pencil aria-hidden="true" data-icon="inline-start" />Edit</Button>
                              <Button type="button" variant="ghost" size="icon-sm" aria-label={`Delete ${opportunity.title}`} onClick={() => deleteOpportunity(opportunity)}><Trash2 aria-hidden="true" className="text-red-700" /></Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500"><Target aria-hidden="true" className="size-5" /></div>
                    <h3 className="text-sm font-semibold text-slate-900">{opportunities.length ? 'No opportunities match' : 'Your list is empty'}</h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{opportunities.length ? 'Try a different search or status filter.' : 'Save a role you find to start organizing your job search.'}</p>
                    {opportunities.length === 0 && <Button className="mt-4" onClick={() => setShowForm(true)}><Plus aria-hidden="true" data-icon="inline-start" />Add your first opportunity</Button>}
                  </div>
                )}
              </>
            ) : active === 'pitch' ? (
              <PitchGenerator opportunities={opportunities} />
            ) : active === 'settings' ? (
              <>
                <ProfileDocuments userId={userId} />
                <Card className="border-slate-200 bg-white shadow-sm"><CardContent className="p-6"><h2 className="font-semibold text-slate-950">Account</h2><p className="mt-2 text-sm text-slate-600">Signed in as {userEmail}</p><Button variant="outline" className="mt-5" onClick={signOut}><LogOut aria-hidden="true" data-icon="inline-start" />Sign out</Button></CardContent></Card>
              </>
            ) : (
              <Card className="border-slate-200 bg-white shadow-sm"><CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-violet-800"><BriefcaseBusiness aria-hidden="true" className="size-6" /></div><h2 className="text-lg font-semibold text-slate-950">{title}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">This section is not connected yet. No campaigns, AI service, email delivery, or outreach data are being generated or stored here.</p></CardContent></Card>
            )}
          </div>
        </main>
      </div>
      {notice && <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><Check aria-hidden="true" className="size-4 shrink-0 text-emerald-300" /><span>{notice}</span><button type="button" onClick={() => setNotice('')} aria-label="Dismiss notification"><X aria-hidden="true" className="size-4 shrink-0 text-slate-400" /></button></div>}
    </div>
  )
}
