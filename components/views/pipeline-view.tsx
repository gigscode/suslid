'use client'

import { useState } from 'react'
import type { Database } from '@/lib/supabase/database.types'

type Prospect = Database['public']['Tables']['prospects']['Row']

interface Props {
  prospects: Prospect[]
  onStageChange: (prospectId: string, newStatus: string) => Promise<void>
  onOpenProspect: (prospectId: string) => void
}

const STAGES = [
  { id: 'new',         label: 'New',         bg: 'bg-[#D3D6FC]',  text: 'text-[#2A2A7A]',  border: 'border-[#B8BCFA]' },
  { id: 'researched',  label: 'Researched',  bg: 'bg-[#C1EBE1]',  text: 'text-[#0D4034]',  border: 'border-[#8DD5C5]' },
  { id: 'contacted',   label: 'Contacted',   bg: 'bg-[#E2F4C5]',  text: 'text-[#2D5016]',  border: 'border-[#B8DFA0]' },
  { id: 'replied',     label: 'Replied',     bg: 'bg-amber-50',   text: 'text-amber-800',  border: 'border-amber-200' },
  { id: 'meeting',     label: 'Meeting',     bg: 'bg-orange-50',  text: 'text-orange-800', border: 'border-orange-200' },
  { id: 'won',         label: 'Won',         bg: 'bg-[#C1EBE1]',  text: 'text-[#0D4034]',  border: 'border-[#8DD5C5]' },
  { id: 'lost',        label: 'Lost',        bg: 'bg-[#FCD2D1]',  text: 'text-[#7A1C1A]',  border: 'border-[#F5ABAA]' },
]

function ProspectCard({ prospect, onStageChange, onOpenProspect }: {
  prospect: Prospect
  onStageChange: (id: string, status: string) => Promise<void>
  onOpenProspect: (id: string) => void
}) {
  const [moving, setMoving] = useState(false)
  const currentIdx = STAGES.findIndex((s) => s.id === prospect.status)

  async function move(direction: -1 | 1) {
    const next = STAGES[currentIdx + direction]
    if (!next) return
    setMoving(true)
    try { await onStageChange(prospect.id, next.id) }
    finally { setMoving(false) }
  }

  return (
    <div className="group glass-card rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onOpenProspect(prospect.id)}
    >
      {/* Favicon / initial */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#0B3C37]/10 text-xs font-bold text-[#0B3C37]">
          {prospect.business_name.charAt(0).toUpperCase()}
        </div>
        {prospect.next_follow_up_at && new Date(prospect.next_follow_up_at) <= new Date() && (
          <span title="Follow-up overdue" className="text-xs">🔔</span>
        )}
      </div>

      <p className="font-semibold text-sm text-[#111827] leading-snug line-clamp-2">{prospect.business_name}</p>

      {prospect.industry && (
        <p className="mt-1 text-[10px] text-[#9CA3AF] truncate">{prospect.industry}</p>
      )}
      {prospect.website_url && (
        <p className="mt-0.5 text-[10px] text-[#9CA3AF] truncate">{prospect.website_url.replace(/^https?:\/\//, '')}</p>
      )}

      {/* Move buttons */}
      <div
        className="mt-3 flex items-center justify-between border-t border-[#E5E7EB] pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          disabled={currentIdx <= 0 || moving}
          onClick={() => void move(-1)}
          className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#9CA3AF] hover:bg-[#F4F8F8] hover:text-[#374151] disabled:opacity-30"
          title="Move to previous stage"
        >
          ← back
        </button>
        <button
          type="button"
          onClick={() => onOpenProspect(prospect.id)}
          className="text-[10px] font-semibold text-[#0B3C37] hover:underline"
        >
          open
        </button>
        <button
          type="button"
          disabled={currentIdx >= STAGES.length - 1 || moving}
          onClick={() => void move(1)}
          className="rounded-lg px-2 py-1 text-[10px] font-semibold text-[#9CA3AF] hover:bg-[#F4F8F8] hover:text-[#374151] disabled:opacity-30"
          title="Move to next stage"
        >
          next →
        </button>
      </div>
    </div>
  )
}

export function PipelineView({ prospects, onStageChange, onOpenProspect }: Props) {
  if (prospects.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center rounded-2xl p-16 text-center">
        <span className="text-4xl">⬡</span>
        <h2 className="mt-4 text-xl font-bold text-[#111827]">No prospects in the pipeline yet</h2>
        <p className="mt-2 max-w-sm text-sm text-[#6B7280]">Add your first prospect to start tracking deals through stages.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-[#111827]">Pipeline</h2>
          <p className="text-sm text-[#6B7280]">{prospects.length} prospect{prospects.length !== 1 ? 's' : ''} across all stages</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
          <span>Use ← → buttons on cards to move stages</span>
        </div>
      </div>

      {/* Kanban board, horizontal scroll on mobile */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {STAGES.map((stage) => {
            const stageProspects = prospects.filter((p) => p.status === stage.id)
            return (
              <div key={stage.id} className="w-56 shrink-0">
                {/* Column header */}
                <div className={`mb-3 flex items-center justify-between rounded-xl border px-3 py-2 ${stage.bg} ${stage.border}`}>
                  <span className={`text-xs font-bold uppercase tracking-wide ${stage.text}`}>{stage.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold bg-white/50 ${stage.text}`}>
                    {stageProspects.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="grid gap-2 min-h-24">
                  {stageProspects.map((p) => (
                    <ProspectCard
                      key={p.id}
                      prospect={p}
                      onStageChange={onStageChange}
                      onOpenProspect={onOpenProspect}
                    />
                  ))}
                  {stageProspects.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#E5E7EB] p-4 text-center">
                      <p className="text-[10px] text-[#D1D5DB]">Empty</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Win rate summary */}
      <div className="mt-5 glass-card rounded-2xl p-5">
        <h3 className="font-bold text-sm text-[#111827] mb-3">Stage summary</h3>
        <div className="flex flex-wrap gap-3">
          {STAGES.map((stage) => {
            const count = prospects.filter((p) => p.status === stage.id).length
            const pct = Math.round((count / prospects.length) * 100)
            return (
              <div key={stage.id} className={`rounded-xl border px-3 py-2 ${stage.bg} ${stage.border}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wide ${stage.text}`}>{stage.label}</p>
                <p className={`text-xl font-extrabold ${stage.text}`}>{count}</p>
                <p className={`text-[10px] ${stage.text} opacity-70`}>{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
