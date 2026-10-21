'use client'

import { useEffect, useState } from 'react'
import {
  BriefcaseBusiness,
  Check,
  Clipboard,
  FileText,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import type { Opportunity } from '@/components/dashboard'

const documentTypes = [
  { id: 'master-cv', label: 'Master CV' },
  { id: 'content-writer', label: 'Social media & content writer' },
  { id: 'wordpress', label: 'WordPress CV' },
] as const

type DocumentType = (typeof documentTypes)[number]['id']

const pitchFormats = [
  {
    id: 'cover-letter',
    title: 'Cover letter paragraph',
    tagline: 'For job application forms & ATS fields',
    description: 'A solid 4-6 sentence paragraph connecting your CV highlights to the role requirements.',
    icon: FileText,
  },
  {
    id: 'cold-dm',
    title: 'Cold DM',
    tagline: 'For LinkedIn, Twitter/X & founder messages',
    description: 'A concise, high-converting 3-4 sentence message with a clear proof point and low-friction call to action.',
    icon: MessageSquareText,
  },
  {
    id: 'outreach-email',
    title: 'Outreach email',
    tagline: 'For direct email to the hiring manager',
    description: 'A curiosity-driven subject line paired with a crisp 2-paragraph outreach email.',
    icon: Mail,
  },
] as const

type PitchFormat = (typeof pitchFormats)[number]['id']

export function PitchGenerator({ opportunities }: { opportunities: Opportunity[] }) {
  const [opportunityId, setOpportunityId] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('master-cv')
  const [format, setFormat] = useState<PitchFormat>('cover-letter')
  const [cvText, setCvText] = useState('')
  const [loadingCv, setLoadingCv] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  /* Load saved CV text when category changes */
  useEffect(() => {
    let cancelled = false
    async function loadCv() {
      setLoadingCv(true)
      setCvText('')
      setError('')
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('career_profiles')
        .select('content')
        .eq('doc_type', documentType)
        .maybeSingle()
      if (cancelled) return
      if (fetchError) {
        setError(`Could not load saved CV: ${fetchError.message}`)
      } else {
        setCvText(data?.content ?? '')
      }
      setLoadingCv(false)
    }
    void loadCv()
    return () => { cancelled = true }
  }, [documentType])

  async function generatePitch() {
    setGenerating(true)
    setError('')
    setDraft('')
    try {
      const response = await fetch('/api/ai/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId, documentType, format }),
      })
      const result: unknown = await response.json()
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error
          : 'Could not generate a draft.'
        throw new Error(message)
      }
      if (!result || typeof result !== 'object' || !('draft' in result) || typeof result.draft !== 'string') {
        throw new Error('The server returned an invalid draft.')
      }
      setDraft(result.draft)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not generate a draft.')
    } finally {
      setGenerating(false)
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Could not copy the draft. Select and copy the text manually.')
    }
  }

  const currentFormat = pitchFormats.find((item) => item.id === format) ?? pitchFormats[0]
  const hasCv = cvText.trim().length > 0
  const canGenerate = !generating && !loadingCv && !!opportunityId && hasCv

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0
  const charCount = draft.length

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
              <Sparkles aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold text-slate-950">{currentFormat.title}</h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                {currentFormat.description}
              </p>
            </div>
          </div>

          {/* Format selection pills */}
          <div className="mt-6">
            <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Message format
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {pitchFormats.map(({ id, title, tagline, icon: Icon }) => {
                const isSelected = format === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setFormat(id)
                      setDraft('')
                    }}
                    className={`flex flex-col rounded-xl border p-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-[#7c3aed] ${
                      isSelected
                        ? 'border-[#7c3aed] bg-violet-50/60 shadow-xs ring-1 ring-[#7c3aed]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        aria-hidden="true"
                        className={`size-4 ${isSelected ? 'text-[#7c3aed]' : 'text-slate-500'}`}
                      />
                      <span className={`text-xs font-bold ${isSelected ? 'text-slate-950' : 'text-slate-700'}`}>
                        {title}
                      </span>
                    </div>
                    <span className="mt-1 text-[11px] leading-4 text-slate-500">
                      {tagline}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {opportunities.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm leading-6 text-slate-600">
              Add an opportunity first. Its title, company, and description will help ground the draft in the actual role.
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Opportunity
                <select
                  value={opportunityId}
                  onChange={(event) => setOpportunityId(event.target.value)}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:border-[#7c3aed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-100"
                >
                  <option value="">Choose an opportunity</option>
                  {opportunities.map((opportunity) => (
                    <option key={opportunity.id} value={opportunity.id}>
                      {opportunity.title} · {opportunity.company_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                CV category
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value as DocumentType)}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:border-[#7c3aed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-100"
                >
                  {documentTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </label>

              {/* CV status indicator */}
              <div className={`rounded-xl border px-4 py-3 text-sm leading-5 ${hasCv ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                {loadingCv
                  ? 'Loading your saved CV…'
                  : hasCv
                    ? 'CV text loaded. Ready to generate.'
                    : 'No CV text saved for this category yet. Go to Profile and paste your CV text there first.'}
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                Your CV text and opportunity details will be sent to Google Gemini to generate this draft. Do not include anything you do not want processed by that service.
              </div>

              {error && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}

              <Button
                type="button"
                className="w-full bg-[#7c3aed] text-white hover:bg-[#6d28d9] focus-visible:outline-[#7c3aed] sm:w-auto"
                disabled={!canGenerate}
                onClick={() => void generatePitch()}
              >
                {generating
                  ? <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" />
                  : <Sparkles aria-hidden="true" data-icon="inline-start" />}
                {generating ? 'Writing…' : `Generate ${currentFormat.title.toLowerCase()}`}
              </Button>
              <p className="text-xs text-slate-500">
                Powered by Google Gemini · Free tier. Drafts are not saved or sent.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-h-80 border-slate-200 bg-white shadow-sm">
        <CardContent className="flex h-full flex-col p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BriefcaseBusiness aria-hidden="true" className="size-4 text-violet-800" />
              <h2 className="font-semibold text-slate-950">Your {currentFormat.title.toLowerCase()}</h2>
            </div>
            {draft && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {wordCount} words · {charCount} chars
                </span>
                <Badge variant="outline">Review before sending</Badge>
              </div>
            )}
          </div>
          {draft ? (
            <>
              <label className="sr-only" htmlFor="pitch-draft">
                Generated {currentFormat.title.toLowerCase()} draft. Review and edit before use.
              </label>
              <textarea
                id="pitch-draft"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={5000}
                className="mt-4 min-h-64 flex-1 resize-y rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-100"
              />
              <Button
                type="button"
                variant="outline"
                className="mt-3 self-start hover:bg-slate-50"
                onClick={() => void copyDraft()}
              >
                {copied
                  ? <Check aria-hidden="true" data-icon="inline-start" className="text-emerald-600" />
                  : <Clipboard aria-hidden="true" data-icon="inline-start" />}
                {copied ? 'Copied' : `Copy ${format === 'cold-dm' ? 'DM' : 'draft'}`}
              </Button>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
              <div className="flex size-11 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                {generating
                  ? <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                  : <BriefcaseBusiness aria-hidden="true" className="size-5" />}
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">
                {generating ? `Writing your ${currentFormat.title.toLowerCase()}…` : `Your editable ${currentFormat.title.toLowerCase()} will appear here.`}
              </p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                {format === 'cold-dm'
                  ? 'Designed to be short, punchy, and ready for LinkedIn or Twitter/X.'
                  : format === 'outreach-email'
                    ? 'Includes a high-open subject line and a concise 2-paragraph email body.'
                    : 'Check every claim for accuracy before you paste it into an application.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
