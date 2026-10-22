'use client'

import { useMemo, useState, useEffect, useRef, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { brand } from '@/lib/pitchpilot/brand'
import { findingsSchema } from '@/lib/pitchpilot/validation'
import { createClient } from '@/lib/supabase/client'
import { PLANS, type PlanType } from '@/lib/pitchpilot/pricing'
import type { Database } from '@/lib/supabase/database.types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { LeadDiscovery } from '@/components/lead-discovery'
import { OutreachView } from '@/components/views/outreach-view'
import { PipelineView } from '@/components/views/pipeline-view'
import { ActivityView } from '@/components/views/activity-view'
import type { DiscoveredLead } from '@/app/api/leads/discover/route'

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
  plan?: PlanType
}

const statusLabels: Record<string, string> = {
  new: 'New', researched: 'Researched', contacted: 'Contacted',
  replied: 'Replied', meeting: 'Meeting', won: 'Won', lost: 'Lost',
}

const statusColors: Record<string, string> = {
  new: 'bg-[#D3D6FC] text-[#2A2A7A]',
  researched: 'bg-[#C1EBE1] text-[#0D4034]',
  contacted: 'bg-[#E2F4C5] text-[#2D5016]',
  replied: 'bg-[#E2F4C5] text-[#2D5016]',
  meeting: 'bg-amber-100 text-amber-800',
  won: 'bg-[#C1EBE1] text-[#0D4034]',
  lost: 'bg-[#FCD2D1] text-[#7A1C1A]',
}

// ── helpers ────────────────────────────────────────────────────────────────
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null
}
function parseProspect(value: unknown): Prospect | null {
  const item = record(value)
  if (!item || typeof item.id !== 'string' || typeof item.user_id !== 'string' ||
    typeof item.business_name !== 'string' || typeof item.source !== 'string' ||
    typeof item.status !== 'string' || typeof item.created_at !== 'string' ||
    typeof item.updated_at !== 'string') return null
  const ns = (key: string) => typeof item[key] === 'string' ? item[key] as string : null
  return {
    id: item.id, user_id: item.user_id, business_name: item.business_name,
    website_url: ns('website_url'), country: ns('country'), industry: ns('industry'),
    contact_name: ns('contact_name'), contact_email: ns('contact_email'),
    source: item.source, status: item.status, notes: ns('notes'),
    next_follow_up_at: ns('next_follow_up_at'),
    created_at: item.created_at, updated_at: item.updated_at,
  }
}
function parseDraft(value: unknown): Draft | null {
  const item = record(value)
  if (!item || typeof item.id !== 'string' || typeof item.user_id !== 'string' ||
    typeof item.prospect_id !== 'string' || typeof item.channel !== 'string' ||
    typeof item.body !== 'string' || typeof item.status !== 'string' ||
    typeof item.created_at !== 'string' || typeof item.updated_at !== 'string') return null
  return {
    id: item.id, user_id: item.user_id, prospect_id: item.prospect_id,
    channel: item.channel, subject: typeof item.subject === 'string' ? item.subject : null,
    body: item.body, status: item.status, created_at: item.created_at, updated_at: item.updated_at,
  }
}
function parseActivity(value: unknown): Activity | null {
  const item = record(value)
  if (!item || typeof item.id !== 'string' || typeof item.user_id !== 'string' ||
    typeof item.prospect_id !== 'string' || typeof item.activity_type !== 'string' ||
    typeof item.created_at !== 'string') return null
  return {
    id: item.id, user_id: item.user_id, prospect_id: item.prospect_id,
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
    prospect_id: value.prospect_id, summary: findings.data.business_summary,
    findings: findings.data, url: value.analyzed_url,
  } : null
}
async function responseError(response: Response): Promise<string> {
  const payload = record(await response.json().catch(() => null))
  return typeof payload?.error === 'string' ? payload.error : 'Something went wrong. Please try again.'
}

// ── design tokens ──────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0B3C37] focus:ring-2 focus:ring-[#0B3C37]/10'
const labelCls = 'grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]'
const btnPrimary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0B3C37] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d4a44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C37] disabled:cursor-not-allowed disabled:opacity-50'

// ── Sidebar ────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    label: 'MAIN MENU',
    items: [
      { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
      { id: 'prospects', icon: '◎', label: 'Prospects' },
      { id: 'discover', icon: '🔭', label: 'Discover leads' },
      { id: 'outreach', icon: '✉', label: 'Outreach' },
    ],
  },
  {
    label: 'LEADS',
    items: [
      { id: 'pipeline', icon: '⬡', label: 'Pipeline' },
      { id: 'activity', icon: '↑', label: 'Activity' },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { id: 'profile', icon: '⚙', label: 'Settings' },
    ],
  },
]

function Sidebar({ active, onNavigate, agencyName, onSignOut }: {
  active: string
  onNavigate: (id: string) => void
  agencyName: string
  onSignOut: () => void
}) {
  return (
    <aside className="flex h-full flex-col bg-[#0B3C37] text-white">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-6">
        <span className="text-xl font-extrabold tracking-[-0.02em] text-white leading-none">Sus</span>
        <span className="text-xl font-extrabold tracking-[-0.02em] text-white/80 leading-none">Lid</span>
        <span className="text-2xl font-black text-[#E53E3E] leading-none" style={{ lineHeight: 0.7 }}>.</span>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Sidebar navigation">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/40">{group.label}</p>
            {group.items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active === item.id
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom user */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E2F4C5] text-xs font-bold text-[#0B3C37]">
            {agencyName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{agencyName}</p>
            <p className="text-[10px] text-white/50">Workspace</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            title="Sign out"
            className="shrink-0 rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white"
          >
            ↩
          </button>
        </div>
      </div>
    </aside>
  )
}

// ── Metric card ────────────────────────────────────────────────────────────
function MetricCard({ label, value, badge, bg, textColor, icon }: {
  label: string; value: string | number; badge?: string
  bg: string; textColor: string; icon: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${bg}`}>
      <div className="flex items-start justify-between">
        <span className={`flex size-9 items-center justify-center rounded-xl bg-white/40 text-base ${textColor}`}>{icon}</span>
        <span className="text-lg font-light text-black/20">···</span>
      </div>
      <p className={`mt-3 text-xs font-semibold uppercase tracking-wide ${textColor} opacity-70`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold ${textColor}`}>{value}</p>
      {badge && (
        <span className={`mt-3 inline-block rounded-full bg-white/40 px-2.5 py-1 text-[11px] font-semibold ${textColor}`}>
          {badge}
        </span>
      )}
    </div>
  )
}

// ── Donut chart (Recharts PieChart) ────────────────────────────────────────
const DONUT_COLORS = ['#E2F4C5', '#C1EBE1', '#FCD2D1', '#D3D6FC']
const DONUT_STROKE = ['#8BBF52', '#3BA88A', '#E86461', '#7B83ED']

function DonutChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#111827]">Prospect Breakdown</h3>
        <span className="text-lg text-[#9CA3AF]">···</span>
      </div>
      <div className="relative mt-4 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={68}
              outerRadius={100}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={2}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke={DONUT_STROKE[i % DONUT_STROKE.length]} />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-[#6B7280]">{value}</span>}
            />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.10)', fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="pointer-events-none absolute flex flex-col items-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -68%)' }}>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Total</span>
          <span className="text-2xl font-bold text-[#111827]">{total}</span>
        </div>
      </div>
    </div>
  )
}

// ── Bar chart (Recharts BarChart) ──────────────────────────────────────────
const BAR_FILL = ['#E2F4C5', '#C1EBE1', '#FCD2D1', '#D3D6FC', '#B3E5CF', '#F5C6C5']

function SalesBarChart({ data }: { data: { month: string; value: number }[] }) {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#111827]">Prospects Over Time</h3>
        <span className="text-lg text-[#9CA3AF]">···</span>
      </div>
      <div className="mt-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="#F3F4F6" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', background: '#111827', color: '#fff', fontSize: 12 }}
              labelStyle={{ color: '#9CA3AF', fontSize: 10 }}
            />
            <Bar dataKey="value" name="Prospects" radius={[8, 8, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={BAR_FILL[i % BAR_FILL.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Onboarding ─────────────────────────────────────────────────────────────
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
      services: String(form.get('services') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      target_markets: String(form.get('target_markets') ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      ideal_client_description: String(form.get('ideal_client_description') ?? ''),
      preferred_outreach_channel: String(form.get('preferred_outreach_channel') ?? 'email'),
      offer_description: String(form.get('offer_description') ?? ''),
    }
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(await responseError(response))
      const data = record(await response.json())
      const saved = record(data?.profile)
      if (!saved || typeof saved.agency_name !== 'string') throw new Error('Invalid profile response.')
      onSaved({
        agency_name: saved.agency_name,
        agency_type: payload.agency_type as AgencyProfile['agency_type'],
        services: payload.services,
        target_markets: payload.target_markets,
        ideal_client_description: payload.ideal_client_description,
        preferred_outreach_channel: payload.preferred_outreach_channel as AgencyProfile['preferred_outreach_channel'],
        offer_description: payload.offer_description,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your profile.')
    } finally { setPending(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F8F8] p-6">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-[#0B3C37] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
            Welcome to {brand.name}
          </span>
          <h1 className="mt-4 font-bold text-3xl text-[#111827] tracking-tight">Set up your workspace</h1>
          <p className="mt-2 text-sm text-[#6B7280]">Tell us about your agency so we can personalise every prospect analysis.</p>
        </div>
        <form onSubmit={submit} className="glass-card grid gap-5 rounded-3xl p-8 sm:grid-cols-2">
          <label className={labelCls}>Agency name<input name="agency_name" className={inputCls} required maxLength={120} /></label>
          <label className={labelCls}>Focus area
            <select name="agency_type" className={inputCls} defaultValue="design">
              <option value="branding">Branding</option>
              <option value="design">Graphic / UI design</option>
              <option value="web">Web design</option>
              <option value="marketing">Creative marketing</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className={labelCls}>Services <span className="normal-case font-normal tracking-normal text-[#9CA3AF]">comma-separated</span>
            <input name="services" className={inputCls} placeholder="Brand identity, web design" required maxLength={600} />
          </label>
          <label className={labelCls}>Markets <span className="normal-case font-normal tracking-normal text-[#9CA3AF]">comma-separated</span>
            <input name="target_markets" className={inputCls} placeholder="Nigeria, Ghana" required maxLength={600} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>Your offer
            <textarea name="offer_description" className={`${inputCls} min-h-24`} placeholder="Describe the work you help clients do" required maxLength={1000} />
          </label>
          <label className={`${labelCls} sm:col-span-2`}>Ideal client <span className="normal-case font-normal tracking-normal text-[#9CA3AF]">optional</span>
            <textarea name="ideal_client_description" className={`${inputCls} min-h-20`} maxLength={1000} />
          </label>
          <label className={labelCls}>Preferred outreach
            <select name="preferred_outreach_channel" className={inputCls}>
              <option value="email">Email</option>
              <option value="dm">Direct message</option>
            </select>
          </label>
          {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button className={btnPrimary} type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save and continue →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Prospect editor modal ──────────────────────────────────────────────────
function ProspectEditor({ initial, onCancel, onSave }: {
  initial?: Prospect
  onCancel: () => void
  onSave: (payload: Record<string, string>) => Promise<void>
}) {
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(''); setPending(true)
    const form = new FormData(event.currentTarget)
    const payload = Object.fromEntries(
      ['business_name', 'website_url', 'country', 'industry', 'contact_name', 'contact_email', 'notes']
        .map((k) => [k, String(form.get(k) ?? '').trim()])
    )
    try { await onSave(payload) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save.') }
    finally { setPending(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl glass-card rounded-3xl p-7 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#111827]">{initial ? 'Edit prospect' : 'Add a prospect'}</h2>
          <button type="button" onClick={onCancel} className="rounded-lg px-3 py-1.5 text-sm text-[#6B7280] hover:bg-[#F4F8F8]">Cancel</button>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className={labelCls}>Business name<input name="business_name" className={inputCls} required maxLength={160} defaultValue={initial?.business_name} /></label>
          <label className={labelCls}>Website<input name="website_url" className={inputCls} placeholder="example.com" maxLength={2048} defaultValue={initial?.website_url ?? ''} /></label>
          <label className={labelCls}>Country<input name="country" className={inputCls} maxLength={80} defaultValue={initial?.country ?? ''} /></label>
          <label className={labelCls}>Industry<input name="industry" className={inputCls} maxLength={100} defaultValue={initial?.industry ?? ''} /></label>
          <label className={labelCls}>Contact name<input name="contact_name" className={inputCls} maxLength={160} defaultValue={initial?.contact_name ?? ''} /></label>
          <label className={labelCls}>Contact email<input name="contact_email" className={inputCls} type="email" maxLength={320} defaultValue={initial?.contact_email ?? ''} /></label>
          <label className={`${labelCls} sm:col-span-2`}>Notes<textarea name="notes" className={`${inputCls} min-h-20`} maxLength={4000} defaultValue={initial?.notes ?? ''} /></label>
          {error && <p role="alert" className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" className={btnPrimary} disabled={pending}>{pending ? 'Saving…' : 'Save prospect'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Draft editor ───────────────────────────────────────────────────────────
function DraftEditor({ draft, onSave }: { draft: Draft; onSave: (draft: Draft, subject: string, body: string) => Promise<void> }) {
  const [subject, setSubject] = useState(draft.subject ?? '')
  const [body, setBody] = useState(draft.body)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError('')
    try { await onSave(draft, subject, body) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save.') }
    finally { setPending(false) }
  }

  return (
    <form onSubmit={submit} className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h4 className="font-semibold text-[#111827] capitalize">{draft.channel === 'dm' ? 'Direct message' : 'Email draft'}</h4>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
          draft.status === 'draft' ? 'bg-[#D3D6FC] text-[#2A2A7A]' : 'bg-[#C1EBE1] text-[#0D4034]'
        }`}>{draft.status}</span>
      </div>
      {draft.channel === 'email' && (
        <label className={`${labelCls} mb-3`}>Subject
          <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={180} />
        </label>
      )}
      <label className={labelCls}>Message
        <textarea className={`${inputCls} min-h-36 leading-6`} value={body} onChange={(e) => setBody(e.target.value)} required maxLength={3000} />
      </label>
      {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
      <button type="submit" className={`${btnPrimary} mt-4`} disabled={pending}>{pending ? 'Saving…' : 'Save draft'}</button>
    </form>
  )
}

// ── Main workspace ─────────────────────────────────────────────────────────
export function PitchPilotWorkspace({
  initialProfile,
  initialPlan = 'free',
  userEmail = '',
  initialProspects,
  initialDrafts,
  initialActivities,
  initialAnalyses,
}: {
  initialProfile: AgencyProfile | null
  initialPlan?: PlanType
  userEmail?: string
  initialProspects: Prospect[]
  initialDrafts: Draft[]
  initialActivities: Activity[]
  initialAnalyses: StoredAnalysis[]
}) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const [plan] = useState<PlanType>(initialPlan || initialProfile?.plan || 'free')
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState<string | null>(null)
  const [prospects, setProspects] = useState(initialProspects)
  const [drafts, setDrafts] = useState(initialDrafts)
  const [activities, setActivities] = useState(initialActivities)
  const [selectedId, setSelectedId] = useState(initialProspects[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [activeNav, setActiveNav] = useState('dashboard')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<Prospect | undefined>()
  const [working, setWorking] = useState(false)
  const [notice, setNotice] = useState('')
  const [analysis, setAnalysis] = useState(
    () => initialAnalyses.map(parseStoredAnalysis).find((item) => item?.prospect_id === initialProspects[0]?.id) ?? null
  )
  const [followUpNote, setFollowUpNote] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  const selected = prospects.find((p) => p.id === selectedId) ?? null
  const visibleProspects = useMemo(() =>
    prospects.filter((p) =>
      `${p.business_name} ${p.country ?? ''} ${p.industry ?? ''}`.toLowerCase().includes(search.trim().toLowerCase())
    ), [prospects, search])
  const selectedDrafts = drafts.filter((d) => d.prospect_id === selectedId)
  const selectedActivities = activities.filter((a) => a.prospect_id === selectedId)
  const dueCount = prospects.filter((p) => p.next_follow_up_at && new Date(p.next_follow_up_at).getTime() <= Date.now()).length
  const analysedCount = new Set(drafts.map((d) => d.prospect_id)).size

  // Pipeline data for donut
  const pipelineData = useMemo(() => {
    const groups: Record<string, number> = {}
    for (const p of prospects) { groups[p.status] = (groups[p.status] ?? 0) + 1 }
    return Object.entries(groups).map(([name, value]) => ({ name: statusLabels[name] ?? name, value }))
  }, [prospects])

  // Prospects over last 6 months for bar chart
  const barData = useMemo(() => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = d.toLocaleString('default', { month: 'short' })
      months[key] = 0
    }
    for (const p of prospects) {
      const d = new Date(p.created_at)
      const key = d.toLocaleString('default', { month: 'short' })
      if (key in months) months[key]++
    }
    return Object.entries(months).map(([month, value]) => ({ month, value }))
  }, [prospects])

  async function handleCheckout(targetPlan: 'pro' | 'founding') {
    setPaymentLoading(targetPlan)
    try {
      const response = await fetch('/api/payments/initialize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      })
      const data = await response.json()
      if (!response.ok) {
        if (data.code === 'PAYSTACK_NOT_CONFIGURED') {
          setNotice('Paystack is not configured. Update your plan directly in Supabase for testing.')
          setShowPricingModal(false); return
        }
        throw new Error(data.error || 'Could not start checkout.')
      }
      if (data.authorization_url) window.location.href = data.authorization_url
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not initialize payment.')
      setShowPricingModal(false)
    } finally { setPaymentLoading(null) }
  }

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
    if (!saved) throw new Error('Invalid prospect response.')
    const createdActivity = !editingNow ? parseActivity(data?.activity) : null
    setProspects((cur) => editingNow ? cur.map((p) => p.id === saved.id ? saved : p) : [saved, ...cur])
    if (createdActivity) setActivities((cur) => [createdActivity, ...cur])
    setSelectedId(saved.id)
    setShowEditor(false); setEditing(undefined)
    setNotice(editingNow ? 'Prospect updated.' : 'Prospect saved.')
  }

  async function deleteProspect(prospect: Prospect) {
    if (!window.confirm(`Delete ${prospect.business_name} and its saved research?`)) return
    setWorking(true)
    try {
      const response = await fetch(`/api/prospects/${prospect.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await responseError(response))
      const rest = prospects.filter((p) => p.id !== prospect.id)
      setProspects(rest); setSelectedId(rest[0]?.id ?? '')
      setDrafts((cur) => cur.filter((d) => d.prospect_id !== prospect.id))
      setActivities((cur) => cur.filter((a) => a.prospect_id !== prospect.id))
      setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((a) => a?.prospect_id === rest[0]?.id) ?? null)
      setNotice('Prospect deleted.')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not delete.')
    } finally { setWorking(false) }
  }

  async function analyze() {
    if (!selected?.website_url) { setNotice('Add a website URL first.'); return }
    setWorking(true); setNotice('')
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospect_id: selected.id, website_url: selected.website_url }),
      })
      if (!response.ok) {
        const errPayload = record(await response.json().catch(() => null))
        if (response.status === 503 && typeof errPayload?.error === 'string' && errPayload.error.includes('Gemini')) {
          throw new Error('GEMINI_API_KEY is not set in your .env.local file. Add it to enable website analysis.')
        }
        if (response.status === 403 || errPayload?.code === 'LIMIT_REACHED') {
          setShowPricingModal(true)
          throw new Error(typeof errPayload?.error === 'string' ? errPayload.error : 'Monthly limit reached. Upgrade to continue.')
        }
        throw new Error(typeof errPayload?.error === 'string' ? errPayload.error : 'Could not analyze this website.')
      }
      const data = record(await response.json())
      const savedAnalysis = record(data?.analysis)
      const validated = findingsSchema.safeParse(savedAnalysis?.findings)
      const nextDrafts = Array.isArray(data?.drafts) ? data.drafts.map(parseDraft).filter((d): d is Draft => d !== null) : []
      if (!validated.success || typeof savedAnalysis?.analyzed_url !== 'string') throw new Error('Invalid analysis response.')
      setAnalysis({ prospect_id: selected.id, summary: validated.data.business_summary, findings: validated.data, url: savedAnalysis.analyzed_url })
      setDrafts((cur) => [...nextDrafts, ...cur])
      setProspects((cur) => cur.map((p) => p.id === selected.id ? { ...p, status: 'researched' } : p))
      setNotice('Page inspected. Drafts ready.')
      router.refresh()
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not analyze this website.')
    } finally { setWorking(false) }
  }

  async function saveDraft(draft: Draft, subject: string, body: string) {
    const response = await fetch(`/api/outreach/${draft.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject || null, body }),
    })
    if (!response.ok) throw new Error(await responseError(response))
    const data = record(await response.json())
    const saved = parseDraft(data?.draft)
    if (!saved) throw new Error('Invalid draft response.')
    setDrafts((cur) => cur.map((d) => d.id === saved.id ? saved : d))
    setNotice('Draft saved.')
  }

  async function saveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selected) return
    setWorking(true)
    try {
      const response = await fetch('/api/activities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect_id: selected.id, notes: followUpNote,
          due_at: followUpDate ? new Date(followUpDate).toISOString() : null,
        }),
      })
      if (!response.ok) throw new Error(await responseError(response))
      const data = record(await response.json())
      const activity = parseActivity(data?.activity)
      if (!activity) throw new Error('Invalid activity response.')
      setActivities((cur) => [activity, ...cur])
      if (activity.due_at) setProspects((cur) => cur.map((p) => p.id === selected.id ? { ...p, next_follow_up_at: activity.due_at } : p))
      setFollowUpNote(''); setFollowUpDate('')
      setNotice('Follow-up saved.')
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Could not save follow-up.')
    } finally { setWorking(false) }
  }

  async function saveDiscoveredLead(lead: DiscoveredLead) {
    const payload = {
      business_name: lead.title.slice(0, 160),
      website_url: lead.url,
      country: '',
      industry: '',
      contact_name: '',
      contact_email: '',
      notes: lead.snippet ? `Discovered via search.\n\n${lead.snippet}` : 'Discovered via lead search.',
    }
    const response = await fetch('/api/prospects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => null) as Record<string, unknown> | null
      throw new Error(typeof err?.error === 'string' ? err.error : 'Could not save this lead.')
    }
    const data = await response.json() as Record<string, unknown>
    const saved = parseProspect(data?.prospect)
    if (saved) {
      const createdActivity = parseActivity(data?.activity)
      setProspects((cur) => [saved, ...cur])
      if (createdActivity) setActivities((cur) => [createdActivity, ...cur])
      setSelectedId(saved.id)
      setNotice(`${saved.business_name} saved as a prospect.`)
    }
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login'); router.refresh()
  }

  if (!profile) return <Onboarding onSaved={(saved) => { setProfile(saved); setNotice('Profile saved.') }} />

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F8F8]">

      {/* ── Mobile sidebar backdrop ── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:static lg:translate-x-0 ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          active={activeNav}
          onNavigate={(id) => { setActiveNav(id); setMobileSidebarOpen(false) }}
          agencyName={profile.agency_name}
          onSignOut={() => void signOut()}
        />
      </div>

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-[#E5E7EB] bg-white px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation"
          >☰</button>

          {/* Welcome — truncates gracefully on mobile */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Prospect workspace</p>
            <h1 className="truncate text-base font-bold text-[#111827] sm:text-lg">Welcome, {profile.agency_name}!</h1>
          </div>

          {/* Search — hidden on small, visible md+ */}
          <div className="hidden max-w-xs flex-1 md:block">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">🔍</span>
              <input
                className="w-full rounded-full border border-[#E5E7EB] bg-[#F4F8F8] py-2 pl-9 pr-4 text-sm outline-none focus:border-[#0B3C37] focus:ring-2 focus:ring-[#0B3C37]/10"
                placeholder="Search prospects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Right utilities */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowPricingModal(true)}
              className="hidden items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-[#F4F8F8] px-3 py-1.5 text-xs font-semibold text-[#374151] transition hover:border-[#0B3C37] sm:flex"
            >
              <span className="capitalize">{plan}</span>
              {plan === 'free' && <span className="text-[#0B3C37]">↑ Upgrade</span>}
            </button>
            <div className="hidden text-right lg:block">
              <p className="max-w-[120px] truncate text-xs font-semibold text-[#111827]">{profile.agency_name}</p>
              <p className="text-[10px] text-[#9CA3AF]">{userEmail}</p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0B3C37] text-xs font-bold text-white">
              {profile.agency_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">

          {notice && (
            <div role="status" className="mb-5 flex items-center gap-3 rounded-2xl border border-[#C1EBE1] bg-[#E9F5F1] px-4 py-3 text-sm text-[#0D4034]">
              <span>✓</span> {notice}
              <button type="button" className="ml-auto text-[#0D4034]/50 hover:text-[#0D4034]" onClick={() => setNotice('')}>✕</button>
            </div>
          )}

          {/* ── Lead Discovery view ── */}
          {activeNav === 'discover' && (
            <LeadDiscovery onSaveAsProspect={saveDiscoveredLead} />
          )}

          {/* ── Dashboard view: metrics + charts only ── */}
          {activeNav === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Prospects saved" value={prospects.length} badge={`+${prospects.filter(p => new Date(p.created_at) > new Date(Date.now() - 30*86400000)).length} this month`} bg="bg-[#E2F4C5]" textColor="text-[#2D5016]" icon="◎" />
                <MetricCard label="Pages inspected" value={analysedCount} badge={`${Math.round(analysedCount / Math.max(prospects.length, 1) * 100)}% coverage`} bg="bg-[#C1EBE1]" textColor="text-[#0D4034]" icon="🔍" />
                <MetricCard label="Follow-ups due" value={dueCount} badge={dueCount > 0 ? 'Action needed' : 'All clear'} bg="bg-[#FCD2D1]" textColor="text-[#7A1C1A]" icon="⏰" />
                <MetricCard label="Drafts created" value={drafts.length} badge={`${new Set(drafts.map(d => d.prospect_id)).size} prospects`} bg="bg-[#D3D6FC]" textColor="text-[#2A2A7A]" icon="✉" />
              </div>
              <div className="mt-5 grid gap-5 grid-cols-1 lg:grid-cols-[2fr_3fr]">
                <DonutChart data={pipelineData.length ? pipelineData : [{ name: 'No data yet', value: 1 }]} />
                <SalesBarChart data={barData} />
              </div>
              {/* Quick prospect list on dashboard */}
              <div className="mt-5 glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-[#111827]">Recent prospects</h2>
                  <button type="button" onClick={() => setActiveNav('prospects')} className="text-xs font-semibold text-[#0B3C37] hover:underline">View all →</button>
                </div>
                {prospects.length === 0 ? (
                  <p className="text-sm text-[#9CA3AF]">No prospects yet. <button type="button" onClick={() => setActiveNav('discover')} className="text-[#0B3C37] underline">Discover leads</button> or <button type="button" onClick={() => { setEditing(undefined); setShowEditor(true) }} className="text-[#0B3C37] underline">add one manually</button>.</p>
                ) : (
                  <div className="grid gap-2">
                    {prospects.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-sm text-[#111827]">{p.business_name}</p>
                          <p className="truncate text-xs text-[#9CA3AF]">{p.website_url ?? 'No URL'}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{statusLabels[p.status] ?? p.status}</span>
                          <button type="button" onClick={() => { setSelectedId(p.id); setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((a) => a?.prospect_id === p.id) ?? null); setActiveNav('prospects') }} className="text-xs font-semibold text-[#0B3C37] hover:underline">Open →</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Outreach view ── */}
          {activeNav === 'outreach' && (
            <OutreachView
              drafts={drafts}
              prospects={prospects}
              onSaveDraft={saveDraft}
              onOpenProspect={(id) => { setSelectedId(id); setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((a) => a?.prospect_id === id) ?? null); setActiveNav('prospects') }}
            />
          )}

          {/* ── Pipeline view ── */}
          {activeNav === 'pipeline' && (
            <PipelineView
              prospects={prospects}
              onStageChange={async (prospectId, newStatus) => {
                const response = await fetch(`/api/prospects/${prospectId}`, {
                  method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: newStatus }),
                })
                if (!response.ok) { setNotice(await responseError(response)); return }
                setProspects((cur) => cur.map((p) => p.id === prospectId ? { ...p, status: newStatus } : p))
              }}
              onOpenProspect={(id) => { setSelectedId(id); setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((a) => a?.prospect_id === id) ?? null); setActiveNav('prospects') }}
            />
          )}

          {/* ── Activity view ── */}
          {activeNav === 'activity' && (
            <ActivityView
              activities={activities}
              prospects={prospects}
              onAddFollowUp={async (prospectId, notes, dueAt) => {
                const response = await fetch('/api/activities', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prospect_id: prospectId, notes, due_at: dueAt }),
                })
                if (!response.ok) throw new Error(await responseError(response))
                const data = record(await response.json()) as Record<string, unknown> | null
                const activity = parseActivity(data?.activity)
                if (activity) {
                  setActivities((cur) => [activity, ...cur])
                  if (activity.due_at) setProspects((cur) => cur.map((p) => p.id === prospectId ? { ...p, next_follow_up_at: activity.due_at } : p))
                  setNotice('Follow-up saved.')
                }
              }}
              onOpenProspect={(id) => { setSelectedId(id); setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((a) => a?.prospect_id === id) ?? null); setActiveNav('prospects') }}
            />
          )}

          {/* ── Prospects view: list + detail ── */}
          {activeNav === 'prospects' && (
          <div className="grid items-start gap-5 xl:grid-cols-[320px_1fr]">

            {/* Prospect list */}
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[#111827]">Prospects <span className="ml-1.5 rounded-full bg-[#F4F8F8] px-2 py-0.5 text-xs text-[#6B7280]">{prospects.length}</span></h2>
                <button type="button" className={btnPrimary} style={{ minHeight: 'unset', padding: '6px 14px', fontSize: 12 }} onClick={() => { setEditing(undefined); setShowEditor(true) }}>
                  + Add
                </button>
              </div>
              <div className="mb-3 md:hidden">
                <input className={inputCls} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
              </div>
              <div className="grid gap-2 max-h-[480px] overflow-y-auto pr-1">
                {visibleProspects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedId(p.id); setAnalysis(initialAnalyses.map(parseStoredAnalysis).find((a) => a?.prospect_id === p.id) ?? null) }}
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      selectedId === p.id
                        ? 'border-[#0B3C37]/20 bg-[#0B3C37]/5'
                        : 'border-transparent hover:border-[#E5E7EB] hover:bg-[#F4F8F8]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#111827] truncate">{p.business_name}</span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColors[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[p.status] ?? p.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#9CA3AF]">{p.website_url ?? 'No URL yet'}</p>
                  </button>
                ))}
                {visibleProspects.length === 0 && (
                  <div className="rounded-xl bg-[#F4F8F8] p-5 text-center">
                    <p className="text-sm text-[#9CA3AF]">{prospects.length ? 'No matches.' : 'Add your first prospect above.'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div className="grid gap-5">
              {selected ? (
                <>
                  {/* Prospect header */}
                  <div className="glass-card rounded-2xl p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">{selected.industry || 'Prospect'}</p>
                        <h2 className="mt-1 text-2xl font-bold text-[#111827]">{selected.business_name}</h2>
                        {selected.website_url
                          ? <p className="mt-1 text-sm text-[#6B7280] break-all">{selected.website_url}</p>
                          : <p className="mt-1 inline-block rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700">Add a website URL to enable inspection</p>
                        }
                      </div>
                      <div className="flex gap-2">
                        <button type="button" className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#374151] hover:bg-[#F4F8F8]" onClick={() => { setEditing(selected); setShowEditor(true) }}>Edit</button>
                        <button type="button" disabled={working} className="rounded-xl border border-[#FCD2D1] bg-white px-3 py-2 text-sm font-medium text-[#7A1C1A] hover:bg-[#FCD2D1]/30 disabled:opacity-50" onClick={() => void deleteProspect(selected)}>Delete</button>
                      </div>
                    </div>

                    {selected.website_url && !analysis && (
                      <div className="mt-4 rounded-xl border border-[#C1EBE1] bg-[#E9F5F1] px-4 py-3 text-sm text-[#0D4034]">
                        <span className="font-semibold">Ready to inspect.</span> Click &ldquo;Inspect website&rdquo; to fetch the page, extract observations, and generate a personalised outreach draft.
                      </div>
                    )}

                    {/* How inspect works */}
                    <details className="mt-3 rounded-xl border border-[#E5E7EB] bg-[#F4F8F8] px-4 py-3 text-xs text-[#6B7280]">
                      <summary className="cursor-pointer font-semibold text-[#374151] select-none">How does &ldquo;Inspect website&rdquo; work?</summary>
                      <ul className="mt-2 space-y-1.5 leading-5">
                        <li>1. We fetch the public homepage (no login, no scraping private data).</li>
                        <li>2. Scripts and ads are stripped. Clean text, headings and meta tags are extracted.</li>
                        <li>3. Gemini AI analyses the text and returns observations grounded in verbatim quotes from the page.</li>
                        <li>4. A personalised email + DM draft is generated based on the findings and your agency profile.</li>
                        <li>5. Everything is saved to this prospect. You edit and send manually.</li>
                      </ul>
                    </details>

                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#E5E7EB] pt-5">
                      <button type="button" className={btnPrimary} disabled={working || !selected.website_url} onClick={() => { void analyze().catch((e: unknown) => setNotice(e instanceof Error ? e.message : 'Analyze failed.')) }}>
                        {working ? '⟳ Inspecting…' : '🔍 Inspect website'}
                      </button>
                      <label className="flex items-center gap-2 text-sm text-[#6B7280]">
                        Stage
                        <select
                          aria-label="Prospect stage"
                          className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827]"
                          value={selected.status}
                          onChange={async (e) => {
                            try {
                              const response = await fetch(`/api/prospects/${selected.id}`, {
                                method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ status: e.target.value }),
                              })
                              if (!response.ok) { setNotice(await responseError(response)); return }
                              setProspects((cur) => cur.map((p) => p.id === selected.id ? { ...p, status: e.target.value } : p))
                              setNotice('Stage updated.')
                            } catch (err) {
                              setNotice(err instanceof Error ? err.message : 'Could not update stage.')
                            }
                          }}
                        >
                          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </label>
                    </div>
                  </div>

                  {/* Analysis results */}
                  {analysis?.prospect_id === selected.id && (
                    <div className="rounded-2xl border border-[#C1EBE1] bg-[#E9F5F1] p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">Website inspection</span>
                        <a className="text-xs text-[#0B3C37] underline" href={analysis.url} target="_blank" rel="noreferrer">view page ↗</a>
                      </div>
                      <p className="text-sm leading-6 text-[#374151]">{analysis.summary}</p>
                      <div className="mt-4 grid gap-3">
                        {analysis.findings.observations.map((item, i) => (
                          <div key={i} className="rounded-xl border border-[#C1EBE1]/60 bg-white/70 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-semibold text-[#111827] text-sm">{item.claim}</h4>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold capitalize ${
                                item.confidence === 'high' ? 'bg-[#E2F4C5] text-[#2D5016]' :
                                item.confidence === 'medium' ? 'bg-[#D3D6FC] text-[#2A2A7A]' :
                                'bg-[#FCD2D1] text-[#7A1C1A]'
                              }`}>{item.confidence} · {item.category}</span>
                            </div>
                            <blockquote className="mt-2 border-l-2 border-[#0B3C37]/30 pl-3 text-xs italic text-[#6B7280]">"{item.evidence}"</blockquote>
                            <p className="mt-2 text-xs text-[#374151]"><span className="font-semibold">Next step:</span> {item.next_step}</p>
                          </div>
                        ))}
                      </div>
                      {analysis.findings.suggested_services.length > 0 && (
                        <p className="mt-4 text-sm"><span className="font-semibold text-[#0D4034]">Services to consider:</span> {analysis.findings.suggested_services.join(', ')}</p>
                      )}
                      {analysis.findings.limitations.map((l) => (
                        <p key={l} className="mt-1 text-xs text-[#6B7280]">⚠ {l}</p>
                      ))}
                    </div>
                  )}

                  {/* Outreach drafts */}
                  {selectedDrafts.length > 0 && (
                    <div className="grid gap-4">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">Outreach drafts</p>
                        <h3 className="mt-1 text-xl font-bold text-[#111827]">Your words, ready to edit</h3>
                      </div>
                      {selectedDrafts.map((d) => <DraftEditor key={d.id} draft={d} onSave={saveDraft} />)}
                    </div>
                  )}

                  {/* Follow-up & activity */}
                  <div className="grid gap-4 lg:grid-cols-2">
                    <form onSubmit={(e) => void saveFollowUp(e)} className="glass-card rounded-2xl p-5">
                      <h3 className="font-bold text-[#111827] mb-4">Save a follow-up</h3>
                      <label className={`${labelCls} mb-3`}>Note
                        <textarea className={`${inputCls} min-h-20`} value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} required maxLength={1000} placeholder="What to remember?" />
                      </label>
                      <label className={labelCls}>Reminder date <span className="normal-case font-normal tracking-normal text-[#9CA3AF]">optional</span>
                        <input className={inputCls} type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                      </label>
                      <button className={`${btnPrimary} mt-4`} type="submit" disabled={working}>Save activity</button>
                    </form>

                    <div className="glass-card rounded-2xl p-5">
                      <h3 className="font-bold text-[#111827] mb-4">Recent activity</h3>
                      <ul className="grid gap-3">
                        {selectedActivities.slice(0, 6).map((a) => (
                          <li key={a.id} className="flex gap-3">
                            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-[#0B3C37] mt-2" />
                            <div>
                              <p className="text-sm text-[#374151]">{a.notes || a.activity_type.replaceAll('_', ' ')}</p>
                              <time className="text-xs text-[#9CA3AF]">{new Date(a.created_at).toLocaleDateString()}</time>
                            </div>
                          </li>
                        ))}
                        {selectedActivities.length === 0 && (
                          <li className="text-sm text-[#9CA3AF]">Activity will appear here after research and follow-ups.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-12 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-[#E2F4C5] text-2xl">◎</div>
                  <h2 className="mt-4 text-xl font-bold text-[#111827]">A thoughtful prospect beats a long list</h2>
                  <p className="mt-2 max-w-sm text-sm text-[#6B7280]">Add a business you'd genuinely like to help. We'll keep research focused on public information from its website.</p>
                  <button type="button" className={`${btnPrimary} mt-6`} onClick={() => setShowEditor(true)}>Add your first prospect</button>
                </div>
              )}
            </div>
          </div>
          )}

          {/* ── Settings view ── */}
          {activeNav === 'profile' && (
            <div className="glass-card rounded-2xl p-8 max-w-xl">
              <h2 className="font-bold text-lg text-[#111827] mb-1">Workspace settings</h2>
              <p className="text-sm text-[#6B7280] mb-6">Update your agency profile to keep outreach personalised.</p>
              <p className="text-sm text-[#374151]">To update your profile, sign out and complete onboarding again, or contact support.</p>
            </div>
          )}
        </main>
      </div>

      {/* ── Prospect editor modal ── */}
      {showEditor && (
        <ProspectEditor
          initial={editing}
          onCancel={() => { setShowEditor(false); setEditing(undefined) }}
          onSave={saveProspect}
        />
      )}

      {/* ── Pricing modal ── */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#0B3C37] p-7 text-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C1EBE1]">Plans & Capacity</span>
                <h2 className="mt-1 text-2xl font-bold">Choose your plan</h2>
                <p className="mt-1 text-sm text-white/60">Upgrade to analyze more websites and unlock unlimited drafts.</p>
              </div>
              <button type="button" onClick={() => setShowPricingModal(false)} className="rounded-full bg-white/10 p-2 text-white/60 hover:bg-white/20">✕</button>
            </div>

            <div className="grid gap-4">
              {/* Free */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Free</h3>
                  <span className="rounded-full bg-white/10 px-3 py-0.5 text-xs text-white/70">Current</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold">₦0</div>
                <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                  <li>• 3 prospect analyses per month</li>
                  <li>• Limited outreach drafts</li>
                  <li>• Basic pipeline tracking</li>
                </ul>
                {plan === 'free' && <span className="mt-3 inline-block rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/60">Current plan</span>}
              </div>

              {/* Pro */}
              <div className="rounded-2xl border-2 border-[#C1EBE1]/40 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Pro</h3>
                  <span className="rounded-full border border-[#C1EBE1]/30 bg-[#C1EBE1]/10 px-3 py-0.5 text-xs text-[#C1EBE1]">Recommended</span>
                </div>
                <div className="mt-2 text-3xl font-extrabold">₦15,000<span className="text-base font-normal text-white/50">/month</span></div>
                <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                  <li>• 50 analyses per month</li>
                  <li>• Unlimited outreach drafts</li>
                  <li>• Pipeline + follow-up workflows</li>
                </ul>
                {plan === 'pro'
                  ? <span className="mt-4 inline-block rounded-md bg-[#C1EBE1]/10 px-3 py-1.5 text-xs font-semibold text-[#C1EBE1]">Active plan</span>
                  : <button type="button" disabled={paymentLoading === 'pro'} onClick={() => void handleCheckout('pro')} className="mt-4 rounded-xl bg-[#C1EBE1] px-4 py-2.5 text-sm font-semibold text-[#0D4034] transition hover:bg-[#a8ddd3] disabled:opacity-50">
                      {paymentLoading === 'pro' ? 'Connecting…' : 'Upgrade to Pro'}
                    </button>
                }
              </div>

              {/* Founding */}
              <div className="rounded-2xl border border-amber-400/30 bg-white/5 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Founding customer</h3>
                  <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-0.5 text-xs text-amber-300">Limited</span>
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-200">₦35,000 <span className="text-sm font-normal text-white/50">one-time</span></div>
                <ul className="mt-3 space-y-1.5 text-sm text-white/70">
                  <li>• Early product access</li>
                  <li>• Direct roadmap input</li>
                  <li>• Personal onboarding</li>
                </ul>
                {plan === 'founding'
                  ? <span className="mt-4 inline-block rounded-md bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300">Active</span>
                  : <button type="button" disabled={paymentLoading === 'founding'} onClick={() => void handleCheckout('founding')} className="mt-4 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50">
                      {paymentLoading === 'founding' ? 'Connecting…' : 'Join Founding Cohort'}
                    </button>
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
