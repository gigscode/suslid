'use client'

import { useState, type FormEvent } from 'react'
import type { DiscoveredLead } from '@/app/api/leads/discover/route'

interface Props {
  onSaveAsProspect: (lead: DiscoveredLead) => Promise<void>
}

const inputCls = 'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0B3C37] focus:ring-2 focus:ring-[#0B3C37]/10'
const btnPrimary = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#0B3C37] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d4a44] disabled:cursor-not-allowed disabled:opacity-50'

const SUGGESTED_QUERIES = [
  'dental clinics Nigeria',
  'law firms Lagos website',
  'restaurants Abuja no online ordering',
  'hotels Ghana website',
  'real estate agencies Lagos',
  'schools Nairobi website',
  'e-commerce stores Nigeria',
  'tech startups Accra',
]

export function LeadDiscovery({ onSaveAsProspect }: Props) {
  const [query, setQuery] = useState('')
  const [leads, setLeads] = useState<DiscoveredLead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [savedDomains, setSavedDomains] = useState<Set<string>>(new Set())
  const [savingDomain, setSavingDomain] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState('')

  async function search(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true); setError(''); setLeads([])
    try {
      const response = await fetch('/api/leads/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await response.json() as { leads?: DiscoveredLead[]; error?: string; hint?: string }
      if (!response.ok) throw new Error(data.error ?? 'Search failed.')
      setLeads(data.leads ?? [])
      setLastQuery(query.trim())
      if ((data.leads ?? []).length === 0) setError('No leads found. Try a broader search term.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  async function saveAsProspect(lead: DiscoveredLead) {
    setSavingDomain(lead.domain)
    try {
      await onSaveAsProspect(lead)
      setSavedDomains((prev) => new Set([...prev, lead.domain]))
    } catch {
      // error is shown by parent
    } finally {
      setSavingDomain(null)
    }
  }

  return (
    <div>
      {/* Search form */}
      <div className="glass-card rounded-2xl p-6">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-[#111827]">Discover leads</h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Search the web for businesses in any niche or location. Save promising ones as prospects with one click.
          </p>
        </div>

        <form onSubmit={(e) => void search(e)} className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">🔍</span>
            <input
              className={`${inputCls} pl-10`}
              placeholder='e.g. "dental clinics Lagos" or "e-commerce stores Ghana"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              maxLength={200}
              required
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Searching…
              </span>
            ) : 'Search'}
          </button>
        </form>

        {/* Suggested queries */}
        {leads.length === 0 && !loading && (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">Try a search like:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuery(q)}
                  className="rounded-full border border-[#E5E7EB] bg-[#F4F8F8] px-3 py-1.5 text-xs text-[#374151] transition hover:border-[#0B3C37]/30 hover:bg-[#C1EBE1]/30"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-[#FCD2D1] bg-[#FCD2D1]/40 px-4 py-3 text-sm text-[#7A1C1A]">
          {error}
        </div>
      )}

      {/* Results */}
      {leads.length > 0 && (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-[#374151]">
              {leads.length} leads found for <span className="text-[#0B3C37]">"{lastQuery}"</span>
            </p>
            <p className="text-xs text-[#9CA3AF]">Click "Save" to add any as a prospect</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {leads.map((lead) => {
              const saved = savedDomains.has(lead.domain)
              const saving = savingDomain === lead.domain

              return (
                <div
                  key={lead.domain}
                  className={`glass-card flex flex-col rounded-2xl p-5 transition ${saved ? 'opacity-60' : ''}`}
                >
                  {/* Domain badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Favicon */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${lead.domain}&sz=32`}
                        alt=""
                        aria-hidden="true"
                        className="size-5 shrink-0 rounded"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                      />
                      <span className="truncate text-xs font-semibold text-[#0B3C37]">{lead.domain}</span>
                    </div>
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[10px] text-[#9CA3AF] hover:text-[#0B3C37] underline"
                    >
                      visit ↗
                    </a>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm text-[#111827] leading-snug line-clamp-2">{lead.title}</h3>

                  {/* Snippet */}
                  {lead.snippet && (
                    <p className="mt-2 text-xs leading-5 text-[#6B7280] line-clamp-3 flex-1">{lead.snippet}</p>
                  )}

                  {/* Action */}
                  <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
                    {saved ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D4034]">
                        <span className="flex size-4 items-center justify-center rounded-full bg-[#C1EBE1] text-[9px]">✓</span>
                        Saved as prospect
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void saveAsProspect(lead)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B3C37] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#0d4a44] disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Saving…
                          </>
                        ) : (
                          <>+ Save as prospect</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state with instructions */}
      {leads.length === 0 && !loading && !error && (
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            { bg: 'bg-[#E2F4C5]', text: 'text-[#2D5016]', icon: '🎯', title: 'Search by niche', body: 'Try "dental clinics Lagos" or "hotels Accra" to find businesses in a specific sector and location.' },
            { bg: 'bg-[#C1EBE1]', text: 'text-[#0D4034]', icon: '🔍', title: 'Filter by problem', body: 'Add keywords like "no online booking" or "outdated website" to find prospects who need your services.' },
            { bg: 'bg-[#D3D6FC]', text: 'text-[#2A2A7A]', icon: '💾', title: 'Save with one click', body: 'Click "Save as prospect" on any result. It lands in your CRM with the URL pre-filled, ready to inspect.' },
          ].map((tip) => (
            <div key={tip.title} className={`rounded-2xl p-5 ${tip.bg}`}>
              <span className="text-2xl">{tip.icon}</span>
              <h4 className={`mt-3 font-bold text-sm ${tip.text}`}>{tip.title}</h4>
              <p className={`mt-1 text-xs leading-5 ${tip.text} opacity-80`}>{tip.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
