'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, BriefcaseBusiness, Check, Clock3, DollarSign, LoaderCircle, MapPin, Plus, RefreshCw, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { OpportunityFormValues } from '@/components/dashboard'
import { jobCategories, targetJobCategories, type JobCategory, type TargetJobCategory } from '@/lib/jobs/profile'

type RemoteJob = {
  id: string
  url: string
  title: string
  company: string
  location: string
  industries: string[]
  types: string[]
  excerpt: string
  salary: string | null
  publishedAt: string | null
  sourceName: 'Jobicy' | 'Remote OK' | 'Freehire'
  targetCategories: TargetJobCategory[]
}

type FeedResponse = {
  jobs: RemoteJob[]
  updatedAt: string
  nextCursor: string | null
  sourceErrors: string[]
  notice: string
}

type Region = 'nigeria' | 'africa' | 'remote' | 'all'

const africanCountries = [
  'algeria', 'angola', 'benin', 'botswana', 'burkina faso', 'burundi', 'cameroon',
  'cape verde', 'central african republic', 'chad', 'comoros', 'congo', 'djibouti',
  'dr congo', 'democratic republic of the congo', 'egypt', 'equatorial guinea',
  'eritrea', 'eswatini', 'ethiopia', 'gabon', 'gambia', 'ghana', 'guinea',
  'guinea-bissau', 'ivory coast', 'cote d’ivoire', 'kenya', 'lesotho', 'liberia',
  'libya', 'madagascar', 'malawi', 'mali', 'mauritania', 'mauritius', 'morocco',
  'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda', 'senegal', 'seychelles',
  'sierra leone', 'somalia', 'south africa', 'south sudan', 'sudan', 'tanzania',
  'togo', 'tunisia', 'uganda', 'zambia', 'zimbabwe',
]

function matchesRegion(job: RemoteJob, region: Region) {
  if (region === 'all' || region === 'remote') return true
  const location = job.location.toLowerCase()
  const worldwide = /\b(worldwide|anywhere|global|all countries)\b/.test(location)
  if (worldwide) return true
  const unspecifiedRemoteEligibility = /remote\s*[·-]\s*eligibility not specified/.test(location)

  if (region === 'nigeria') {
    return unspecifiedRemoteEligibility
      || /\bnigeria\b|\bafrica\b|\blagos\b|\babuja\b|\bport harcourt\b|\bibadan\b|\bkano\b|\benugu\b|\bkaduna\b|\bbenin city\b/.test(location)
  }

  return unspecifiedRemoteEligibility
    || /\bafrica\b/.test(location)
    || africanCountries.some((country) => location.includes(country))
}

const companyColorPalettes = [
  'bg-[#4353ff]',
  'bg-gradient-to-tr from-amber-500 to-orange-500',
  'bg-slate-900',
  'bg-[#4a154b]',
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-rose-500',
  'bg-teal-600',
  'bg-blue-600',
]

function getCompanyColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  return companyColorPalettes[Math.abs(hash) % companyColorPalettes.length]
}

function formatDate(value: string) {
  if (!value) return 'Date not provided'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date not provided'
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatPostedDate(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? null
    : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)
}

function displayCopy(value: string) {
  return value.replace(/\u2014/g, ' - ')
}

function plainText(value: string) {
  return displayCopy(
    value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000),
  )
}

export function JobDiscovery({
  savedSourceUrls,
  onSave,
}: {
  savedSourceUrls: string[]
  onSave: (values: OpportunityFormValues) => Promise<boolean>
}) {
  const [jobs, setJobs] = useState<RemoteJob[]>([])
  const [updatedAt, setUpdatedAt] = useState('')
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [sourceErrors, setSourceErrors] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [savingUrl, setSavingUrl] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<JobCategory>('all')
  const [region, setRegion] = useState<Region>('nigeria')
  const savedUrls = useMemo(() => new Set(savedSourceUrls), [savedSourceUrls])

  async function loadJobs(cursor?: string, append = false) {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError('')
    try {
      const response = await fetch(cursor ? `/api/jobs?cursor=${encodeURIComponent(cursor)}` : '/api/jobs')
      const payload: unknown = await response.json()
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : 'Could not load remote jobs.'
        throw new Error(message)
      }
      if (!payload || typeof payload !== 'object' || !('jobs' in payload) || !Array.isArray(payload.jobs)
        || !('updatedAt' in payload) || typeof payload.updatedAt !== 'string') {
        throw new Error('The job feed returned an unexpected response.')
      }
      const result = payload as FeedResponse
      setJobs((current) => {
        const combined = append ? [...current, ...result.jobs] : result.jobs
        return Array.from(new Map(combined.map((job) => [job.url, job])).values())
      })
      setUpdatedAt(result.updatedAt)
      setNextCursor(result.nextCursor)
      setSourceErrors((current) => append ? [...new Set([...current, ...result.sourceErrors])] : result.sourceErrors)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not load remote jobs.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    void loadJobs()
  }, [])

  const filteredJobs = useMemo(() => jobs
    .map((job) => ({
      job,
      categories: job.targetCategories,
    }))
    .filter(({ categories }) => category === 'all' || categories.includes(category))
    .filter(({ job }) => matchesRegion(job, region)
      && `${job.title} ${job.company} ${job.location} ${job.industries.join(' ')} ${job.types.join(' ')} ${job.excerpt}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((left, right) => (Date.parse(right.job.publishedAt ?? '') || 0) - (Date.parse(left.job.publishedAt ?? '') || 0)
      || left.job.title.localeCompare(right.job.title)),
  [jobs, category, query, region])

  async function saveJob(job: RemoteJob) {
    setSavingUrl(job.url)
    setError('')
    try {
      const saved = await onSave({
        company_name: job.company,
        title: job.title,
        description: plainText(job.excerpt) || null,
        source_name: job.sourceName,
        source_url: job.url,
        contact_name: null,
        contact_email: null,
        compensation: job.salary,
      })
      if (!saved) setError(`Could not save ${job.title}. Check the error shown above and try again.`)
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'An unexpected error occurred.'
      setError(`Could not save ${job.title}: ${message}`)
    } finally {
      setSavingUrl('')
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Remote feeds matched to your target work</p>
          </div>
          <h2 className="mt-2 text-lg font-semibold text-slate-950">Find roles that match your skills</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
            We only show roles that name a target job and a matching skill. Generic software jobs are filtered out unless they clearly mention web work.
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-slate-500">
            Searches cover web development, email and Klaviyo, websites and WordPress, design and video, plus writing and content support.
          </p>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">
            These are search terms, not proof that every listing fits your experience. Shopify roles are not included yet.
          </p>
        </div>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => void loadJobs()} disabled={loading}>
          {loading ? <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" /> : <RefreshCw aria-hidden="true" data-icon="inline-start" />}
          {loading ? 'Loading listings…' : 'Refresh listings'}
        </Button>
      </section>

      {(error || sourceErrors.length > 0) && (
        <div role="alert" className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {error && <p>{error}</p>}
          {sourceErrors.map((message) => <p key={message}>{message}</p>)}
        </div>
      )}

      <section aria-label="Filter job listings" className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,auto)_minmax(0,auto)]">
          <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-3 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
            <Search aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
            <span className="sr-only">Search jobs</span>
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" placeholder="Search title, company, location, or description" />
          </label>
          <label className="flex min-h-11 min-w-0 items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
            <span className="sr-only">Filter by listing location text</span>
            <select aria-label="Filter by listing location text" value={region} onChange={(event) => setRegion(event.target.value as Region)} className="h-full min-w-0 max-w-full bg-transparent outline-none">
              <option value="nigeria">Nigeria, Africa-wide, or worldwide</option>
              <option value="africa">Africa or worldwide</option>
              <option value="remote">Remote, verify eligibility</option>
              <option value="all">Any country or location</option>
            </select>
          </label>
          <label className="flex min-h-11 min-w-0 items-center rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
            <span className="sr-only">Filter by skill category</span>
            <select aria-label="Filter by target work category" value={category} onChange={(event) => setCategory(event.target.value as JobCategory)} className="h-full min-w-0 max-w-full bg-transparent outline-none">
              {jobCategories.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{filteredJobs.length} {filteredJobs.length === 1 ? 'listing' : 'listings'}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Showing roles that match a target job and a related skill.
            {' '}{region === 'nigeria' ? 'Location text may mention Nigeria, Africa-wide, or worldwide; remote listings with unspecified eligibility are also included. Confirm actual eligibility on the listing.' : region === 'africa' ? 'Location text may mention an African country, Africa-wide, or worldwide; remote listings with unspecified eligibility are also included. Confirm actual eligibility on the listing.' : region === 'remote' ? 'Remote listings may have country restrictions. Confirm on the source.' : 'Location eligibility varies by listing.'}
          </p>
        </div>
        {updatedAt && (
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock3 aria-hidden="true" className="size-3.5" />Source data updated {formatDate(updatedAt)}
          </p>
        )}
      </div>

      {loading ? (
        <div role="status" className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-600">
          <LoaderCircle aria-hidden="true" className="mx-auto mb-3 size-5 animate-spin text-violet-700" />Loading job listings…
        </div>
      ) : filteredJobs.length ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredJobs.map(({ job, categories }) => {
            const saved = savedUrls.has(job.url)
            const postedDate = formatPostedDate(job.publishedAt)
            return (
              <Card key={job.id} className="group border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-md">
                <CardContent className="flex h-full flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`grid size-11 shrink-0 place-items-center rounded-full text-base font-extrabold text-white shadow-xs ${getCompanyColor(job.company)}`}>
                        {job.company.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-bold text-slate-950 group-hover:text-[#573da5] transition-colors">{displayCopy(job.title)}</h3>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          by <span className="font-semibold text-slate-700">{displayCopy(job.company)}</span>
                          {categories.length > 0 && (
                            <>
                              {' '}in{' '}
                              <span className="font-semibold text-[#0d9488]">
                                {targetJobCategories.find((item) => item.id === categories[0])?.label || 'General'}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex flex-wrap items-center gap-2">
                    {/* Employment type pill (Lilac) */}
                    {job.types.length > 0 && (
                      <span className="inline-flex items-center rounded-full bg-[#f3e8ff] px-3 py-1 text-xs font-semibold text-[#7e22ce] ring-1 ring-[#e9d5ff]/80">
                        {displayCopy(job.types[0])}
                      </span>
                    )}

                    {/* Location pill (Mint/Teal) */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#0f766e] ring-1 ring-[#a7f3d0]/80">
                      <MapPin aria-hidden="true" className="size-3 text-[#0d9488]" />
                      {displayCopy(job.location)}
                    </span>

                    {/* Compensation pill (Emerald) */}
                    {job.salary && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#15803d] ring-1 ring-[#bbf7d0]/80">
                        <DollarSign aria-hidden="true" className="size-3 text-[#16a34a]" />
                        {displayCopy(job.salary)}
                      </span>
                    )}

                    {job.sourceName === 'Freehire' && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                        Freehire
                      </span>
                    )}
                  </div>

                  {job.excerpt && <p className="mt-3.5 line-clamp-3 text-xs leading-5 text-slate-600">{plainText(job.excerpt)}</p>}

                  <p className="mt-3 flex items-center gap-1.5 text-xs text-[#059669] font-medium">
                    <Clock3 aria-hidden="true" className="size-3.5 shrink-0" />
                    {postedDate
                      ? <><span>Posted </span><time dateTime={job.publishedAt ?? undefined}>{postedDate}</time></>
                      : 'Posting date unavailable'}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5">
                    <a href={job.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#573da5] px-3 text-xs font-semibold text-white shadow-xs hover:bg-[#463087]">
                      {job.sourceName === 'Freehire' ? 'View original' : `View on ${job.sourceName}`} <ArrowUpRight aria-hidden="true" className="size-3.5" />
                    </a>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      disabled={saved || savingUrl !== ''}
                      onClick={() => void saveJob(job)}
                    >
                      {savingUrl === job.url ? <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" /> : saved ? <Check aria-hidden="true" data-icon="inline-start" className="text-emerald-600" /> : <Plus aria-hidden="true" data-icon="inline-start" />}
                      {savingUrl === job.url ? 'Saving…' : saved ? 'Saved' : 'Save lead'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <BriefcaseBusiness aria-hidden="true" className="mx-auto size-6 text-slate-400" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">{jobs.length ? 'No matching listings' : 'No remote jobs found'}</h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
            {jobs.length ? 'Try another keyword, location, or target-role category.' : 'No target-role listings came back from the feeds. Try refreshing later.'}
          </p>
        </div>
      )}

      {nextCursor && !loading && (
        <div className="flex justify-center">
          <Button type="button" variant="outline" disabled={loadingMore} onClick={() => void loadJobs(nextCursor, true)}>
            {loadingMore ? <LoaderCircle aria-hidden="true" data-icon="inline-start" className="animate-spin" /> : <Plus aria-hidden="true" data-icon="inline-start" />}
            {loadingMore ? 'Loading more Jobicy listings…' : 'Load more Jobicy listings'}
          </Button>
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500">
        Listings and application links: <a href="https://jobicy.com" target="_blank" rel="noreferrer" className="font-medium text-violet-800 underline underline-offset-2">Jobicy</a>, <a href="https://remoteok.com" target="_blank" rel="noreferrer" className="font-medium text-violet-800 underline underline-offset-2">Remote OK</a>, and <a href="https://freehire.me" target="_blank" rel="noreferrer" className="font-medium text-violet-800 underline underline-offset-2">Freehire</a>. Feed responses are cached for up to 6 hours. Check the source listing for current status and application details.
      </p>
    </div>
  )
}
