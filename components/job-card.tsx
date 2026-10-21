'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Heart,
  MapPin,
  DollarSign,
  Clock,
  ArrowUpRight,
  X,
  Check,
  Sparkles,
  Briefcase,
  ChevronRight,
} from 'lucide-react'

export type JobCardData = {
  id: string
  title: string
  company: string
  category: string
  logoBg: string
  logoTextColor?: string
  logoText?: string
  logoSvg?: React.ReactNode
  type: string
  location: string
  salary: string
  deadlineOrDate: string
  sourceUrl?: string
  description?: string
  skills?: string[]
  responsibilities?: string[]
  requirements?: string[]
}

export function JobCard({
  job,
  initiallySaved = false,
  onSaveToggle,
  onClick,
}: {
  job: JobCardData
  initiallySaved?: boolean
  onSaveToggle?: (id: string, saved: boolean) => void
  onClick?: (job: JobCardData) => void
}) {
  const [saved, setSaved] = useState(initiallySaved)
  const [pop, setPop] = useState(false)

  // Keep internal state synced if parent updates
  useEffect(() => {
    setSaved(initiallySaved)
  }, [initiallySaved])

  const handleHeartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newState = !saved
    setSaved(newState)
    setPop(true)
    setTimeout(() => setPop(false), 300)
    onSaveToggle?.(job.id, newState)
  }

  const handleCardClick = () => {
    onClick?.(job)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick?.(job)
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${job.title} at ${job.company}`}
      className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_2px_12px_-4px_rgba(20,20,20,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-[#573da5]/40 hover:shadow-[0_16px_36px_-12px_rgba(87,61,165,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#573da5] active:scale-[0.99]"
    >
      {/* Top row: Logo, Titles, Heart */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Circular Company Logo */}
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-full font-bold shadow-xs transition-transform duration-200 group-hover:scale-105 ${job.logoBg} ${
              job.logoTextColor || 'text-white'
            }`}
          >
            {job.logoSvg ? (
              job.logoSvg
            ) : (
              <span className="text-base font-extrabold tracking-tight">
                {job.logoText || job.company.charAt(0)}
              </span>
            )}
          </div>

          {/* Job title & company */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-bold text-slate-900 transition-colors group-hover:text-[#573da5]">
              {job.title}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              by <span className="font-semibold text-slate-700">{job.company}</span>{' '}
              in{' '}
              <span className="font-semibold text-[#0d9488]">
                {job.category}
              </span>
            </p>
          </div>
        </div>

        {/* Favorite / Save Heart Button */}
        <button
          type="button"
          onClick={handleHeartClick}
          aria-label={saved ? `Remove ${job.title} from saved leads` : `Save ${job.title} lead`}
          className={`grid size-9 shrink-0 place-items-center rounded-full transition-all duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#573da5] ${
            saved
              ? 'text-rose-500 hover:bg-rose-50'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          } ${pop ? 'scale-125' : 'scale-100'}`}
        >
          <Heart
            aria-hidden="true"
            className={`size-4.5 transition-colors ${
              saved ? 'fill-rose-500 text-rose-500' : 'stroke-[1.75]'
            }`}
          />
        </button>
      </div>

      {/* Middle row: Colorful Pill Badges */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {/* Employment Type Pill (Lilac / Purple) */}
        <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-3 py-0.5 text-xs font-semibold text-[#7e22ce] ring-1 ring-[#e9d5ff]/80">
          {job.type}
        </span>

        {/* Location Pill (Mint / Teal) */}
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-3 py-0.5 text-xs font-semibold text-[#0f766e] ring-1 ring-[#a7f3d0]/80">
          <MapPin aria-hidden="true" className="size-3 text-[#0d9488]" />
          {job.location}
        </span>

        {/* Salary / Compensation Pill (Emerald / Green) */}
        <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-3 py-0.5 text-xs font-semibold text-[#15803d] ring-1 ring-[#bbf7d0]/80">
          <DollarSign aria-hidden="true" className="size-3 text-[#16a34a]" />
          {job.salary}
        </span>
      </div>

      {/* Bottom row: Application status & Quick view hint */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100/90 pt-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#059669]">
          <Clock aria-hidden="true" className="size-3.5" />
          {job.deadlineOrDate}
        </span>

        <span className="inline-flex items-center gap-1 font-semibold text-slate-500 transition-colors group-hover:text-[#573da5]">
          Preview role <ChevronRight aria-hidden="true" className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Interactive Job Details Modal / Drawer
───────────────────────────────────────── */
export function JobDetailModal({
  job,
  isOpen,
  onClose,
  isSaved = false,
  onToggleSave,
}: {
  job: JobCardData | null
  isOpen: boolean
  onClose: () => void
  isSaved?: boolean
  onToggleSave?: (id: string, saved: boolean) => void
}) {
  const [saved, setSaved] = useState(isSaved)
  const [pop, setPop] = useState(false)

  useEffect(() => {
    setSaved(isSaved)
  }, [isSaved])

  // Close on Escape key & manage scroll lock
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen || !job) return null

  const handleToggleSave = () => {
    const newState = !saved
    setSaved(newState)
    setPop(true)
    setTimeout(() => setPop(false), 300)
    onToggleSave?.(job.id, newState)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Modal Card */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-5">
          <div className="flex items-start gap-4">
            <div
              className={`grid size-14 shrink-0 place-items-center rounded-2xl text-xl font-extrabold text-white shadow-md ${job.logoBg}`}
            >
              {job.logoText || job.company.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                  {job.company}
                </span>
                <span className="rounded-full bg-[#f0edf8] px-2.5 py-0.5 text-xs font-bold text-[#573da5]">
                  {job.category}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                  Sample role
                </span>
              </div>
              <h2 id="job-modal-title" className="mt-2 text-xl font-extrabold text-slate-900 sm:text-2xl">
                {job.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="grid size-9 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-[#573da5]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata Chips */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Type</span>
              <p className="mt-1 text-xs font-bold text-slate-800">{job.type}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Location</span>
              <p className="mt-1 text-xs font-bold text-slate-800">{job.location}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Compensation</span>
              <p className="mt-1 text-xs font-bold text-emerald-700">{job.salary}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400">Deadline</span>
              <p className="mt-1 text-xs font-bold text-slate-800">{job.deadlineOrDate}</p>
            </div>
          </div>

          {/* Role Overview */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Role Overview</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {job.description ||
                'No details were provided for this listing. Open the original posting for the full description.'}
            </p>
          </div>

          {/* Key Skills */}
          {job.skills && job.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Highlighted Skills</h3>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-lg border border-slate-200/80 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What You'll Do */}
          {job.responsibilities && job.responsibilities.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Key Responsibilities</h3>
              <ul className="mt-2.5 space-y-2 text-sm text-slate-600">
                {job.responsibilities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Honest Eligibility Notice */}
          <div className="rounded-xl border border-amber-200/70 bg-amber-50/60 p-4 text-xs text-amber-900">
            <p className="font-bold">⚠️ Location & Eligibility Check</p>
            <p className="mt-1 leading-5 text-amber-800/90">
              Location text indicates &ldquo;{job.location}&rdquo;. Be sure to verify specific country eligibility, tax residency, and work authorization requirements directly on the employer&rsquo;s application form.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2.5 border-t border-slate-100 bg-slate-50/80 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 rounded-xl border px-5 text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed] ${
              saved
                ? 'border-rose-200 bg-rose-50 text-rose-600'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            } ${pop ? 'scale-[1.02]' : 'scale-100'}`}
          >
            <Heart className={`size-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
            {saved ? 'Saved to workspace' : 'Save lead'}
          </button>

          <Link
            href="/login?mode=sign-up"
            className="inline-flex w-full sm:w-auto min-h-11 items-center justify-center gap-2 rounded-xl bg-[#7c3aed] px-6 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#6d28d9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
          >
            Track in Remosus <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
