'use client'

import { useState, type FormEvent } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type Activity = Database['public']['Tables']['activities']['Row']
type Prospect = Database['public']['Tables']['prospects']['Row']

interface Props {
  activities: Activity[]
  prospects: Prospect[]
  onAddFollowUp: (prospectId: string, notes: string, dueAt: string | null) => Promise<void>
  onOpenProspect: (prospectId: string) => void
}

const activityIcons: Record<string, string> = {
  prospect_created:   '➕',
  analysis_completed: '🔍',
  follow_up:          '📅',
  note:               '📝',
  contacted:          '✉',
  replied:            '↩',
  meeting_scheduled:  '📆',
}

const activityColors: Record<string, string> = {
  prospect_created:   'bg-[#D3D6FC] text-[#2A2A7A]',
  analysis_completed: 'bg-[#C1EBE1] text-[#0D4034]',
  follow_up:          'bg-amber-100 text-amber-800',
  note:               'bg-[#E2F4C5] text-[#2D5016]',
  contacted:          'bg-[#C1EBE1] text-[#0D4034]',
  replied:            'bg-[#E2F4C5] text-[#2D5016]',
  meeting_scheduled:  'bg-orange-100 text-orange-800',
}

const inputCls = 'w-full rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0B3C37] focus:ring-2 focus:ring-[#0B3C37]/10'
const labelCls = 'grid gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#6B7280]'
const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B3C37] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d4a44] disabled:opacity-50'

function formatRelative(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: diffDays > 365 ? 'numeric' : undefined })
}

function isOverdue(dueAt: string | null): boolean {
  if (!dueAt) return false
  return new Date(dueAt) <= new Date()
}

export function ActivityView({ activities, prospects, onAddFollowUp, onOpenProspect }: Props) {
  const [filterType, setFilterType] = useState<string>('all')
  const [filterProspect, setFilterProspect] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addProspectId, setAddProspectId] = useState(prospects[0]?.id ?? '')
  const [addNote, setAddNote] = useState('')
  const [addDate, setAddDate] = useState('')
  const [adding, setAdding] = useState(false)

  const prospectMap = new Map(prospects.map((p) => [p.id, p]))

  // Split: overdue follow-ups at top, rest chronological
  const overdueActivities = activities.filter(
    (a) => a.activity_type === 'follow_up' && isOverdue(a.due_at) && !a.completed_at
  )
  const filtered = activities.filter((a) => {
    if (filterType !== 'all' && a.activity_type !== filterType) return false
    if (filterProspect !== 'all' && a.prospect_id !== filterProspect) return false
    return true
  })

  async function submitFollowUp(e: FormEvent) {
    e.preventDefault()
    if (!addProspectId) return
    setAdding(true)
    try {
      await onAddFollowUp(addProspectId, addNote, addDate ? new Date(addDate).toISOString() : null)
      setAddNote(''); setAddDate(''); setShowAddForm(false)
    } finally { setAdding(false) }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Left: activity feed */}
      <div>
        {/* Overdue banner */}
        {overdueActivities.length > 0 && (
          <div className="mb-5 rounded-2xl border border-[#F5ABAA] bg-[#FCD2D1]/40 p-4">
            <p className="font-bold text-sm text-[#7A1C1A] mb-2">🔔 {overdueActivities.length} overdue follow-up{overdueActivities.length > 1 ? 's' : ''}</p>
            <div className="grid gap-2">
              {overdueActivities.map((a) => {
                const p = prospectMap.get(a.prospect_id)
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 px-4 py-3">
                    <div>
                      <p className="font-semibold text-sm text-[#111827]">{p?.business_name ?? 'Unknown'}</p>
                      <p className="text-xs text-[#9CA3AF]">{a.notes ?? 'Follow-up due'} · Due {a.due_at ? new Date(a.due_at).toLocaleDateString() : ''}</p>
                    </div>
                    <button type="button" onClick={() => onOpenProspect(a.prospect_id)} className="shrink-0 text-xs font-semibold text-[#0B3C37] hover:underline">
                      Open →
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="glass-card mb-4 flex flex-wrap items-center gap-3 rounded-2xl p-4">
          <select className={`${inputCls} w-auto`} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All activity types</option>
            <option value="prospect_created">Prospect added</option>
            <option value="analysis_completed">Website inspected</option>
            <option value="follow_up">Follow-ups</option>
            <option value="note">Notes</option>
          </select>
          <select className={`${inputCls} w-auto`} value={filterProspect} onChange={(e) => setFilterProspect(e.target.value)}>
            <option value="all">All prospects</option>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>{p.business_name}</option>
            ))}
          </select>
          <span className="text-xs text-[#9CA3AF] shrink-0">{filtered.length} event{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Timeline */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E7EB] p-10 text-center">
            <p className="text-sm text-[#9CA3AF]">No activity yet. Inspect a website or log a follow-up to get started.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[22px] top-0 bottom-0 w-px bg-[#E5E7EB]" aria-hidden="true" />

            <div className="grid gap-4">
              {filtered.map((a) => {
                const p = prospectMap.get(a.prospect_id)
                const overdue = isOverdue(a.due_at) && !a.completed_at && a.activity_type === 'follow_up'
                const icon = activityIcons[a.activity_type] ?? '•'
                const colorCls = activityColors[a.activity_type] ?? 'bg-gray-100 text-gray-500'

                return (
                  <div key={a.id} className="flex gap-4">
                    {/* Icon bubble */}
                    <div className={`relative z-10 flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-white text-sm ${colorCls}`}>
                      {icon}
                    </div>

                    {/* Card */}
                    <div className={`flex-1 glass-card rounded-2xl p-4 ${overdue ? 'border border-[#F5ABAA]' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-[#111827]">
                              {p?.business_name ?? 'Unknown prospect'}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${colorCls}`}>
                              {a.activity_type.replaceAll('_', ' ')}
                            </span>
                            {overdue && (
                              <span className="rounded-full bg-[#FCD2D1] px-2 py-0.5 text-[10px] font-semibold text-[#7A1C1A]">
                                Overdue
                              </span>
                            )}
                          </div>
                          {a.notes && (
                            <p className="mt-1 text-sm text-[#374151]">{a.notes}</p>
                          )}
                          {a.due_at && (
                            <p className="mt-1 text-xs text-[#9CA3AF]">
                              Due: {new Date(a.due_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[10px] text-[#9CA3AF]">{formatRelative(a.created_at)}</p>
                          <button
                            type="button"
                            onClick={() => onOpenProspect(a.prospect_id)}
                            className="mt-1 text-[10px] font-semibold text-[#0B3C37] hover:underline"
                          >
                            Open →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: log a follow-up */}
      <div className="glass-card rounded-2xl p-6 h-fit">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#111827]">Log a follow-up</h3>
          <button type="button" onClick={() => setShowAddForm((v) => !v)} className="text-xs font-semibold text-[#0B3C37] hover:underline">
            {showAddForm ? 'Cancel' : '+ New'}
          </button>
        </div>

        {showAddForm ? (
          <form onSubmit={(e) => void submitFollowUp(e)} className="grid gap-4">
            <label className={labelCls}>Prospect
              <select className={inputCls} value={addProspectId} onChange={(e) => setAddProspectId(e.target.value)} required>
                {prospects.map((p) => (
                  <option key={p.id} value={p.id}>{p.business_name}</option>
                ))}
              </select>
            </label>
            <label className={labelCls}>Note
              <textarea className={`${inputCls} min-h-24`} value={addNote} onChange={(e) => setAddNote(e.target.value)} required maxLength={1000} placeholder="What to remember?" />
            </label>
            <label className={labelCls}>Due date <span className="normal-case font-normal text-[#9CA3AF]">optional</span>
              <input className={inputCls} type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} />
            </label>
            <button type="submit" className={btnPrimary} disabled={adding}>
              {adding ? 'Saving…' : 'Save follow-up'}
            </button>
          </form>
        ) : (
          <div>
            <p className="text-sm text-[#9CA3AF] mb-4">Track calls, reminders, and important notes about any prospect.</p>
            <div className="grid gap-2">
              {/* Upcoming follow-ups */}
              {activities
                .filter((a) => a.due_at && !a.completed_at && new Date(a.due_at) > new Date())
                .sort((a, b) => new Date(a.due_at!).getTime() - new Date(b.due_at!).getTime())
                .slice(0, 5)
                .map((a) => {
                  const p = prospectMap.get(a.prospect_id)
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border border-[#E5E7EB] px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-[#111827]">{p?.business_name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">
                          {a.due_at ? new Date(a.due_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                        </p>
                      </div>
                      <button type="button" onClick={() => onOpenProspect(a.prospect_id)} className="shrink-0 text-[10px] font-semibold text-[#0B3C37] hover:underline ml-2">
                        Open
                      </button>
                    </div>
                  )
                })}
              {activities.filter((a) => a.due_at && !a.completed_at && new Date(a.due_at) > new Date()).length === 0 && (
                <p className="text-xs text-[#9CA3AF]">No upcoming follow-ups.</p>
              )}
            </div>
            <button type="button" onClick={() => setShowAddForm(true)} className={`${btnPrimary} w-full mt-4`}>
              + Log a follow-up
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
