'use client'

import { useState, type FormEvent } from 'react'
import type { DiscoveredLead } from '@/app/api/leads/discover/route'
import type { PersonLead } from '@/app/api/leads/people/route'

interface Props {
  onSaveAsProspect: (lead: DiscoveredLead | PersonLead) => Promise<void>
}

const inputCls = 'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0B3C37] focus:ring-2 focus:ring-[#0B3C37]/10'
const btnPrimary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0B3C37] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d4a44] disabled:cursor-not-allowed disabled:opacity-50'

// ── Suggested queries per mode ────────────────────────────────────────────
const WEBSITE_QUERIES = [
  'dental clinics Nigeria', 'law firms Lagos website',
  'restaurants Abuja no online ordering', 'hotels Ghana website',
  'real estate agencies Lagos', 'schools Nairobi website',
  'e-commerce stores Nigeria', 'tech startups Accra',
]

const PEOPLE_QUERIES = [
  'email designer', 'WordPress developer',
  'fullstack Node.js Supabase developer', 'React frontend developer',
  'graphics designer branding', 'UI UX designer Figma',
  'Next.js developer', 'Shopify developer',
]

// ── Source badge config ───────────────────────────────────────────────────
const SOURCE_STYLES = {
  reddit:  { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Reddit' },
  upwork:  { bg: 'bg-[#E2F4C5]',  text: 'text-[#2D5016]',  label: 'Upwork' },
  web:     { bg: 'bg-[#D3D6FC]',  text: 'text-[#2A2A7A]',  label: 'Web' },
}

// ── Spinner ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}

// ── Website lead card ─────────────────────────────────────────────────────
function WebsiteLeadCard({ lead, saved, saving, onSave }: {
  lead: DiscoveredLead
  saved: boolean
  saving: boolean
  onSave: () => void
}) {
  return (
    <div className={`glass-card flex flex-col rounded-2xl p-5 transition ${saved ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`https://www.google.com/s2/favicons?domain=${lead.domain}&sz=32`} alt="" aria-hidden className="size-5 shrink-0 rounded" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          <span className="truncate text-xs font-semibold text-[#0B3C37]">{lead.domain}</span>
        </div>
        <a href={lead.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[10px] text-[#9CA3AF] hover:text-[#0B3C37] underline">visit ↗</a>
      </div>
      <h3 className="font-semibold text-sm text-[#111827] leading-snug line-clamp-2">{lead.title}</h3>
      {lead.snippet && <p className="mt-2 text-xs leading-5 text-[#6B7280] line-clamp-3 flex-1">{lead.snippet}</p>}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D4034]">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#C1EBE1] text-[9px]">✓</span>
            Saved as prospect
          </span>
        ) : (
          <button type="button" disabled={saving} onClick={onSave} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B3C37] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0d4a44] disabled:opacity-50">
            {saving ? <><Spinner /> Saving…</> : '+ Save as prospect'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── People lead card ──────────────────────────────────────────────────────
function PeopleLeadCard({ lead, saved, saving, onSave }: {
  lead: PersonLead
  saved: boolean
  saving: boolean
  onSave: () => void
}) {
  const style = SOURCE_STYLES[lead.source]
  return (
    <div className={`glass-card flex flex-col rounded-2xl p-5 transition ${saved ? 'opacity-60' : ''}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${style.bg} ${style.text}`}>
            {style.label}
          </span>
          {lead.subreddit && (
            <span className="text-[10px] text-[#9CA3AF]">r/{lead.subreddit}</span>
          )}
          {lead.postedAt && (
            <span className="text-[10px] text-[#9CA3AF]">{lead.postedAt}</span>
          )}
        </div>
        <a href={lead.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[10px] text-[#9CA3AF] hover:text-[#0B3C37] underline">view ↗</a>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm text-[#111827] leading-snug line-clamp-2">{lead.title}</h3>

      {/* Snippet */}
      {lead.snippet && <p className="mt-2 text-xs leading-5 text-[#6B7280] line-clamp-3 flex-1">{lead.snippet}</p>}

      {/* Budget + skills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {lead.budget && (
          <span className="rounded-full bg-[#E2F4C5] px-2.5 py-0.5 text-[10px] font-semibold text-[#2D5016]">
            {lead.budget}
          </span>
        )}
        {lead.skills?.slice(0, 3).map((skill) => (
          <span key={skill} className="rounded-full bg-[#F4F8F8] border border-[#E5E7EB] px-2.5 py-0.5 text-[10px] text-[#6B7280]">
            {skill}
          </span>
        ))}
      </div>

      {/* Action */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
        {saved ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D4034]">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#C1EBE1] text-[9px]">✓</span>
            Saved as prospect
          </span>
        ) : (
          <button type="button" disabled={saving} onClick={onSave} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B3C37] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0d4a44] disabled:opacity-50">
            {saving ? <><Spinner /> Saving…</> : '+ Save as prospect'}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────
export function LeadDiscovery({ onSaveAsProspect }: Props) {
  const [mode, setMode] = useState<'website' | 'people'>('website')
  const [query, setQuery] = useState('')
  const [websiteLeads, setWebsiteLeads] = useState<DiscoveredLead[]>([])
  const [peopleLeads, setPeopleLeads] = useState<PersonLead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  const leads = mode === 'website' ? websiteLeads : peopleLeads
  const suggested = mode === 'website' ? WEBSITE_QUERIES : PEOPLE_QUERIES

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError('')
    if (mode === 'website') setWebsiteLeads([])
    else setPeopleLeads([])

    const endpoint = mode === 'website' ? '/api/leads/discover' : '/api/leads/people'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await response.json() as { leads?: (DiscoveredLead | PersonLead)[]; error?: string }
      if (!response.ok) throw new Error(data.error ?? 'Search failed.')

      if (mode === 'website') setWebsiteLeads((data.leads ?? []) as DiscoveredLead[])
      else setPeopleLeads((data.leads ?? []) as PersonLead[])

      setLastQuery(query.trim())
      if ((data.leads ?? []).length === 0) setError('No results found. Try a different search term.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  async function save(lead: DiscoveredLead | PersonLead, key: string) {
    setSavingKey(key)
    try {
      await onSaveAsProspect(lead)
      setSavedKeys((prev) => new Set([...prev, key]))
    } catch { /* parent shows error */ }
    finally { setSavingKey(null) }
  }

  function switchMode(next: 'website' | 'people') {
    setMode(next); setQuery(''); setError(''); setLastQuery('')
  }

  return (
    <div>
      {/* Mode tabs */}
      <div className="glass-card mb-5 rounded-2xl p-2 flex gap-2">
        <button
          type="button"
          onClick={() => switchMode('website')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === 'website'
              ? 'bg-[#0B3C37] text-white shadow-sm'
              : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          🌐 Business websites
        </button>
        <button
          type="button"
          onClick={() => switchMode('people')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
            mode === 'people'
              ? 'bg-[#0B3C37] text-white shadow-sm'
              : 'text-[#6B7280] hover:text-[#111827]'
          }`}
        >
          👤 People with needs
        </button>
      </div>

      {/* Search panel */}
      <div className="glass-card rounded-2xl p-6 mb-5">
        <div className="mb-4">
          {mode === 'website' ? (
            <>
              <h2 className="text-lg font-bold text-[#111827]">Find business websites</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Search for businesses in any niche or location. Save promising ones as prospects.</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-[#111827]">Find people who need your skills</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Search Reddit, Upwork, and the web for people actively hiring or requesting specific services.</p>
            </>
          )}
        </div>

        <form onSubmit={(e) => void search(e)} className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">🔍</span>
            <input
              className={`${inputCls} pl-10`}
              placeholder={mode === 'website'
                ? 'e.g. "dental clinics Lagos" or "hotels Ghana"'
                : 'e.g. "WordPress developer" or "email designer"'}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? <><Spinner /> Searching…</> : 'Search'}
          </button>
        </form>

        {/* Suggested chips */}
        {leads.length === 0 && !loading && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">Try:</p>
            <div className="flex flex-wrap gap-2">
              {suggested.map((q) => (
                <button key={q} type="button" onClick={() => setQuery(q)}
                  className="rounded-full border border-[#E5E7EB] bg-[#F4F8F8] px-3 py-1.5 text-xs text-[#374151] transition hover:border-[#0B3C37]/30 hover:bg-[#C1EBE1]/30">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-[#F5ABAA] bg-[#FCD2D1]/40 px-4 py-3 text-sm text-[#7A1C1A]">{error}</div>
      )}

      {/* People mode: source legend */}
      {mode === 'people' && peopleLeads.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-xs text-[#9CA3AF]">Sources:</span>
          {(['reddit', 'upwork', 'web'] as const).map((src) => {
            const count = peopleLeads.filter((l) => l.source === src).length
            if (count === 0) return null
            const s = SOURCE_STYLES[src]
            return (
              <span key={src} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.bg} ${s.text}`}>
                {s.label} <span className="opacity-70">{count}</span>
              </span>
            )
          })}
          <span className="ml-auto text-xs text-[#9CA3AF]">{peopleLeads.length} results for &ldquo;{lastQuery}&rdquo;</span>
        </div>
      )}

      {mode === 'website' && websiteLeads.length > 0 && (
        <p className="mb-4 text-sm font-semibold text-[#374151]">
          {websiteLeads.length} businesses found for <span className="text-[#0B3C37]">&ldquo;{lastQuery}&rdquo;</span>
          <span className="ml-2 text-xs font-normal text-[#9CA3AF]">Click &ldquo;Save as prospect&rdquo; to add any to your CRM</span>
        </p>
      )}

      {/* Results grid */}
      {mode === 'website' && websiteLeads.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {websiteLeads.map((lead) => {
            const key = lead.domain
            return (
              <WebsiteLeadCard
                key={key}
                lead={lead}
                saved={savedKeys.has(key)}
                saving={savingKey === key}
                onSave={() => void save(lead, key)}
              />
            )
          })}
        </div>
      )}

      {mode === 'people' && peopleLeads.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {peopleLeads.map((lead, i) => {
            const key = `${lead.source}-${i}-${lead.url}`
            return (
              <PeopleLeadCard
                key={key}
                lead={lead}
                saved={savedKeys.has(key)}
                saving={savingKey === key}
                onSave={() => void save(lead, key)}
              />
            )
          })}
        </div>
      )}

      {/* Empty state tips */}
      {leads.length === 0 && !loading && !error && (
        <div className="grid gap-4 sm:grid-cols-3">
          {mode === 'website' ? (
            <>
              {[
                { bg: 'bg-[#E2F4C5]', text: 'text-[#2D5016]', icon: '🎯', title: 'Search by niche', body: 'Try "dental clinics Lagos" or "hotels Accra" to find businesses in a specific sector.' },
                { bg: 'bg-[#C1EBE1]', text: 'text-[#0D4034]', icon: '🔍', title: 'Add a problem keyword', body: 'Add "no online booking" or "outdated website" to narrow results.' },
                { bg: 'bg-[#D3D6FC]', text: 'text-[#2A2A7A]', icon: '💾', title: 'One-click save', body: 'Click "Save as prospect" on any result. The URL is pre-filled, ready to inspect.' },
              ].map((tip) => (
                <div key={tip.title} className={`rounded-2xl p-5 ${tip.bg}`}>
                  <span className="text-2xl">{tip.icon}</span>
                  <h4 className={`mt-3 font-bold text-sm ${tip.text}`}>{tip.title}</h4>
                  <p className={`mt-1 text-xs leading-5 ${tip.text} opacity-80`}>{tip.body}</p>
                </div>
              ))}
            </>
          ) : (
            <>
              {[
                { bg: 'bg-orange-50', text: 'text-orange-800', icon: '🟠', title: 'Reddit hiring posts', body: 'Searches r/forhire, r/hiring, r/freelance, r/webdev and more for people actively looking.' },
                { bg: 'bg-[#E2F4C5]', text: 'text-[#2D5016]', icon: '🟢', title: 'Upwork job feed', body: 'Live job postings on Upwork matching your skill keyword, sorted by most recent.' },
                { bg: 'bg-[#D3D6FC]', text: 'text-[#2A2A7A]', icon: '🌐', title: 'Web hiring posts', body: 'Broader web search targeting job boards, forums, and hiring posts from the last 30 days.' },
              ].map((tip) => (
                <div key={tip.title} className={`rounded-2xl p-5 ${tip.bg}`}>
                  <span className="text-2xl">{tip.icon}</span>
                  <h4 className={`mt-3 font-bold text-sm ${tip.text}`}>{tip.title}</h4>
                  <p className={`mt-1 text-xs leading-5 ${tip.text} opacity-80`}>{tip.body}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
