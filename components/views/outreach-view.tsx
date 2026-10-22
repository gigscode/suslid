'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type Draft = Database['public']['Tables']['outreach_drafts']['Row']
type Prospect = Database['public']['Tables']['prospects']['Row']

interface Props {
  drafts: Draft[]
  prospects: Prospect[]
  onSaveDraft: (draft: Draft, subject: string, body: string) => Promise<void>
  onOpenProspect: (prospectId: string) => void
}

const statusColors: Record<string, string> = {
  draft:    'bg-[#D3D6FC] text-[#2A2A7A]',
  copied:   'bg-[#E2F4C5] text-[#2D5016]',
  sent:     'bg-[#C1EBE1] text-[#0D4034]',
  replied:  'bg-amber-100 text-amber-800',
  archived: 'bg-gray-100 text-gray-500',
}

const inputCls = 'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0B3C37] focus:ring-2 focus:ring-[#0B3C37]/10'
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3C37] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0d4a44] disabled:opacity-50'

function DraftCard({ draft, prospect, onSave, onOpenProspect }: {
  draft: Draft
  prospect: Prospect | undefined
  onSave: (draft: Draft, subject: string, body: string) => Promise<void>
  onOpenProspect: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [subject, setSubject] = useState(draft.subject ?? '')
  const [body, setBody] = useState(draft.body)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try { await onSave(draft, subject, body) }
    finally { setSaving(false) }
  }

  function handleCopy() {
    const text = draft.channel === 'email'
      ? `Subject: ${subject}\n\n${body}`
      : body
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`shrink-0 flex size-8 items-center justify-center rounded-xl text-sm ${
            draft.channel === 'email' ? 'bg-[#D3D6FC] text-[#2A2A7A]' : 'bg-[#C1EBE1] text-[#0D4034]'
          }`}>
            {draft.channel === 'email' ? '✉' : '💬'}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-[#111827] truncate">
                {prospect?.business_name ?? 'Unknown prospect'}
              </p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusColors[draft.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {draft.status}
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] capitalize">
              {draft.channel === 'dm' ? 'Direct message' : 'Email'}
              {draft.channel === 'email' && draft.subject && ` · ${draft.subject}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
              copied
                ? 'border-[#C1EBE1] bg-[#C1EBE1] text-[#0D4034]'
                : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#0B3C37]/30'
            }`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => onOpenProspect(draft.prospect_id)}
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] hover:border-[#0B3C37]/30"
          >
            Open prospect →
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-[#374151] hover:border-[#0B3C37]/30"
          >
            {expanded ? 'Collapse' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Preview (collapsed) */}
      {!expanded && (
        <div className="border-t border-[#E5E7EB] bg-[#F4F8F8] px-5 py-3">
          <p className="line-clamp-2 text-xs leading-5 text-[#6B7280]">{draft.body}</p>
        </div>
      )}

      {/* Edit form (expanded) */}
      {expanded && (
        <div className="border-t border-[#E5E7EB] px-5 py-4 grid gap-3">
          {draft.channel === 'email' && (
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">Subject</label>
              <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={180} />
            </div>
          )}
          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[#9CA3AF]">Message</label>
            <textarea className={`${inputCls} min-h-36 leading-6`} value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} />
          </div>
          <div className="flex gap-2">
            <button type="button" className={btnPrimary} onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Saving…' : 'Save draft'}
            </button>
            <button type="button" onClick={handleCopy} className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${copied ? 'border-[#C1EBE1] bg-[#C1EBE1] text-[#0D4034]' : 'border-[#E5E7EB] bg-white text-[#374151] hover:border-[#0B3C37]/30'}`}>
              {copied ? '✓ Copied' : 'Copy to clipboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function OutreachView({ drafts, prospects, onSaveDraft, onOpenProspect }: Props) {
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'dm'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const prospectMap = new Map(prospects.map((p) => [p.id, p]))

  const filtered = drafts.filter((d) => {
    if (channelFilter !== 'all' && d.channel !== channelFilter) return false
    if (statusFilter !== 'all' && d.status !== statusFilter) return false
    if (search.trim()) {
      const prospect = prospectMap.get(d.prospect_id)
      const hay = `${prospect?.business_name ?? ''} ${d.subject ?? ''} ${d.body}`.toLowerCase()
      if (!hay.includes(search.trim().toLowerCase())) return false
    }
    return true
  })

  // Group by prospect
  const grouped = new Map<string, Draft[]>()
  for (const d of filtered) {
    const list = grouped.get(d.prospect_id) ?? []
    list.push(d)
    grouped.set(d.prospect_id, list)
  }

  if (drafts.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-16 text-center">
        <span className="text-4xl">✉</span>
        <h2 className="mt-4 text-xl font-bold text-[#111827]">No outreach drafts yet</h2>
        <p className="mt-2 max-w-sm text-sm text-[#6B7280]">
          Inspect a prospect website to automatically generate a personalised email and DM draft.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="glass-card mb-5 flex flex-wrap items-center gap-3 rounded-2xl p-4">
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] text-sm">🔍</span>
          <input
            className={`${inputCls} pl-9`}
            placeholder="Search drafts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className={`${inputCls} w-auto`} value={channelFilter} onChange={(e) => setChannelFilter(e.target.value as 'all' | 'email' | 'dm')}>
          <option value="all">All channels</option>
          <option value="email">Email</option>
          <option value="dm">Direct message</option>
        </select>
        <select className={`${inputCls} w-auto`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="copied">Copied</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-xs text-[#9CA3AF] shrink-0">{filtered.length} draft{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grouped results */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E7EB] p-10 text-center">
          <p className="text-sm text-[#9CA3AF]">No drafts match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {Array.from(grouped.entries()).map(([prospectId, draftList]) => {
            const prospect = prospectMap.get(prospectId)
            return (
              <div key={prospectId}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">
                    {prospect?.business_name ?? 'Unknown prospect'}
                  </span>
                  {prospect?.website_url && (
                    <a href={prospect.website_url} target="_blank" rel="noreferrer" className="text-[10px] text-[#9CA3AF] hover:text-[#0B3C37] underline">
                      {prospect.website_url} ↗
                    </a>
                  )}
                </div>
                <div className="grid gap-3">
                  {draftList.map((d) => (
                    <DraftCard
                      key={d.id}
                      draft={d}
                      prospect={prospect}
                      onSave={onSaveDraft}
                      onOpenProspect={onOpenProspect}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
