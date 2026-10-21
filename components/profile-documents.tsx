'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { FileText, LoaderCircle, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

/* ── File upload (storage) ── */
const bucket = 'career-documents'
const maxFileSize = 10 * 1024 * 1024
const contentTypes: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
}

const documentTypes = [
  {
    id: 'master-cv' as const,
    title: 'Master CV',
    description: 'Your complete work history and core skills.',
  },
  {
    id: 'content-writer' as const,
    title: 'Social media & content writer',
    description: 'Writing, content strategy, social media, and UGC work.',
  },
  {
    id: 'wordpress' as const,
    title: 'WordPress CV',
    description: 'WordPress, Shopify, and website projects.',
  },
]

type DocumentType = (typeof documentTypes)[number]['id']

type StoredDocument = {
  name: string
  id: string | null
  updated_at: string | null
  metadata: { size?: number } | null
}
type DocumentsByType = Record<DocumentType, StoredDocument[]>

const emptyDocuments: DocumentsByType = {
  'master-cv': [],
  'content-writer': [],
  wordpress: [],
}

/* Saved text per CV type from career_profiles table */
type TextProfiles = Record<DocumentType, string>
const emptyTextProfiles: TextProfiles = {
  'master-cv': '',
  'content-writer': '',
  wordpress: '',
}

function formatFileSize(size?: number) {
  if (size === undefined) return 'Size unavailable'
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function ProfileDocuments({ userId }: { userId: string }) {
  /* file upload state */
  const [documents, setDocuments] = useState<DocumentsByType>(emptyDocuments)
  const [loadingFiles, setLoadingFiles] = useState(true)
  const [busyType, setBusyType] = useState<DocumentType | null>(null)

  /* text CV state */
  const [textProfiles, setTextProfiles] = useState<TextProfiles>(emptyTextProfiles)
  const [draftText, setDraftText] = useState<TextProfiles>(emptyTextProfiles)
  const [loadingText, setLoadingText] = useState(true)
  const [savingType, setSavingType] = useState<DocumentType | null>(null)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  /* ── Load file uploads ── */
  useEffect(() => {
    let cancelled = false
    async function loadFiles() {
      setLoadingFiles(true)
      setError('')
      const supabase = createClient()
      try {
        const results = await Promise.all(documentTypes.map(async (type) => {
          const { data, error: listError } = await supabase.storage
            .from(bucket)
            .list(`${userId}/${type.id}`, { limit: 50, sortBy: { column: 'updated_at', order: 'desc' } })
          if (listError) throw new Error(listError.message)
          const files: StoredDocument[] = (data ?? [])
            .filter((item) => item.id !== null)
            .map((item) => ({
              name: item.name,
              id: item.id,
              updated_at: item.updated_at,
              metadata: typeof item.metadata?.size === 'number' ? { size: item.metadata.size } : null,
            }))
          return [type.id, files] as const
        }))
        if (cancelled) return
        const next = { ...emptyDocuments }
        results.forEach(([type, files]) => { next[type] = files })
        setDocuments(next)
      } catch (caughtError) {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : 'Could not load your files.')
      } finally {
        if (!cancelled) setLoadingFiles(false)
      }
    }
    void loadFiles()
    return () => { cancelled = true }
  }, [userId])

  /* ── Load saved text CVs ── */
  useEffect(() => {
    let cancelled = false
    async function loadTextProfiles() {
      setLoadingText(true)
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('career_profiles')
        .select('doc_type, content')
        .eq('user_id', userId)
      if (cancelled) return
      if (fetchError) {
        setError(fetchError.message)
        setLoadingText(false)
        return
      }
      const next = { ...emptyTextProfiles }
      ;(data ?? []).forEach((row) => {
        const key = row.doc_type as DocumentType
        if (key in next) next[key] = row.content ?? ''
      })
      setTextProfiles(next)
      setDraftText(next)
      setLoadingText(false)
    }
    void loadTextProfiles()
    return () => { cancelled = true }
  }, [userId])

  /* ── Save text CV ── */
  async function saveTextProfile(type: DocumentType) {
    setError('')
    setNotice('')
    setSavingType(type)
    const supabase = createClient()
    const content = draftText[type].trim()
    const { error: upsertError } = await supabase
      .from('career_profiles')
      .upsert({ user_id: userId, doc_type: type, content }, { onConflict: 'user_id,doc_type' })
    setSavingType(null)
    if (upsertError) {
      setError(upsertError.message)
      return
    }
    setTextProfiles((prev) => ({ ...prev, [type]: content }))
    setNotice('CV text saved.')
  }

  /* ── File upload ── */
  async function uploadDocument(type: DocumentType, file: File) {
    setError('')
    setNotice('')
    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const contentType = contentTypes[extension]
    if (!contentType) { setError('Choose a PDF, DOC, DOCX, or TXT file.'); return }
    if (file.size > maxFileSize) { setError('Each document must be 10 MB or smaller.'); return }
    setBusyType(type)
    try {
      const supabase = createClient()
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100)
      const path = `${userId}/${type}/${crypto.randomUUID()}-${safeName}`
      const { data: uploaded, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { contentType, cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError
      setDocuments((current) => ({
        ...current,
        [type]: [{
          name: uploaded.path.split('/').slice(2).join('/'),
          id: uploaded.id,
          updated_at: new Date().toISOString(),
          metadata: { size: file.size },
        }, ...current[type]],
      }))
      setNotice('File uploaded privately to your account.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not upload this document.')
    } finally {
      setBusyType(null)
    }
  }

  /* ── Remove file ── */
  async function removeDocument(type: DocumentType, document: StoredDocument) {
    setError('')
    setNotice('')
    setBusyType(type)
    try {
      const supabase = createClient()
      const path = `${userId}/${type}/${document.name}`
      const { error: deleteError } = await supabase.storage.from(bucket).remove([path])
      if (deleteError) throw deleteError
      setDocuments((current) => ({
        ...current,
        [type]: current[type].filter((item) => item.name !== document.name),
      }))
      setNotice('File removed.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Could not remove this file.')
    } finally {
      setBusyType(null)
    }
  }

  function onFileSelected(type: DocumentType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void uploadDocument(type, file)
  }

  const busy = busyType !== null || savingType !== null

  return (
    <section aria-labelledby="profile-documents-heading" className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.12em] text-violet-800">Application source material</p>
        <h2 id="profile-documents-heading" className="mt-1 text-xl font-bold text-slate-950">Your CVs and work profiles</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Paste your CV text for each category. The pitch generator reads the saved text directly, which is faster and avoids file-download timeouts. You can still upload files for your own reference.
        </p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      <div className="grid gap-6 xl:grid-cols-3">
        {documentTypes.map((type) => {
          const hasUnsaved = draftText[type.id] !== textProfiles[type.id]
          return (
            <Card key={type.id} className="border-slate-200 bg-white shadow-sm">
              <CardContent className="flex h-full flex-col p-5">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-800">
                    <FileText aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-slate-950">{type.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{type.description}</p>
                  </div>
                </div>

                {/* CV text area */}
                <div className="mt-4 flex-1 flex flex-col gap-2">
                  <label className="text-xs font-semibold text-slate-600" htmlFor={`cv-text-${type.id}`}>
                    CV text {textProfiles[type.id] ? <span className="text-emerald-600">(saved)</span> : <span className="text-slate-400">(not saved yet)</span>}
                  </label>
                  {loadingText ? (
                    <p className="text-sm text-slate-400">Loading…</p>
                  ) : (
                    <textarea
                      id={`cv-text-${type.id}`}
                      value={draftText[type.id]}
                      onChange={(e) => setDraftText((prev) => ({ ...prev, [type.id]: e.target.value }))}
                      placeholder="Paste your CV text here. Plain text works best."
                      rows={8}
                      className="w-full resize-y rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-100 disabled:opacity-50"
                      disabled={busy}
                    />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || !hasUnsaved || loadingText}
                    onClick={() => void saveTextProfile(type.id)}
                    className="self-end"
                  >
                    {savingType === type.id
                      ? <><LoaderCircle aria-hidden="true" className="mr-1.5 size-3.5 animate-spin" />Saving…</>
                      : <><Save aria-hidden="true" className="mr-1.5 size-3.5" />Save CV text</>}
                  </Button>
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-slate-100" />

                {/* File uploads (reference only) */}
                <p className="mb-2 text-xs font-semibold text-slate-500">Reference files (not used for pitch generation)</p>
                <div className="flex-1">
                  {loadingFiles ? (
                    <p className="text-sm text-slate-400">Loading files…</p>
                  ) : documents[type.id].length ? (
                    <ul className="space-y-2">
                      {documents[type.id].map((document) => (
                        <li key={document.name} className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
                          <FileText aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800">{document.name.replace(/^[0-9a-f-]+-/i, '')}</p>
                            <p className="text-xs text-slate-500">{formatFileSize(document.metadata?.size)}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Remove ${document.name}`}
                            disabled={busy}
                            onClick={() => void removeDocument(type.id, document)}
                          >
                            {busyType === type.id
                              ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                              : <Trash2 aria-hidden="true" className="size-4 text-red-700" />}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-400">
                      No files uploaded.
                    </p>
                  )}
                </div>

                <label className="mt-3">
                  <span className="sr-only">Add a file for {type.title}</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="peer sr-only"
                    disabled={busy}
                    onChange={(event) => onFileSelected(type.id, event)}
                  />
                  <span className={`flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 peer-focus-visible:ring-2 peer-focus-visible:ring-violet-400 peer-focus-visible:ring-offset-2 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
                    {busyType === type.id ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : <Upload aria-hidden="true" className="size-3.5" />}
                    {busyType === type.id ? 'Uploading…' : 'Upload file'}
                  </span>
                </label>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
