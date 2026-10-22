'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { createClient } from '@/lib/supabase/client'

const COPY = {
  'sign-in': {
    heading: 'Welcome back',
    subtitle: 'Your prospects, research, drafts and follow-ups are right where you left them.',
    cta: 'Sign in',
  },
  'sign-up': {
    heading: 'Start for free',
    subtitle: 'Save the businesses you want to help and make your outreach more considered.',
    cta: 'Create account',
  },
  'reset-request': {
    heading: 'Reset your password',
    subtitle: 'Enter your email and we will send a reset link if an account exists.',
    cta: 'Send reset link',
  },
  'reset-password': {
    heading: 'Choose a new password',
    subtitle: 'Pick something with at least 8 characters.',
    cta: 'Update password',
  },
} as const

function passwordStrength(pw: string): { label: string; color: string; pct: number } {
  if (pw.length === 0) return { label: '', color: '', pct: 0 }
  if (pw.length < 8) return { label: 'Too short', color: 'bg-[#FCD2D1]', pct: 20 }
  if (pw.length < 12 && !/[^a-zA-Z0-9]/.test(pw)) return { label: 'Fair', color: 'bg-amber-400', pct: 50 }
  if (pw.length >= 12 && /[^a-zA-Z0-9]/.test(pw)) return { label: 'Strong', color: 'bg-[#C1EBE1]', pct: 100 }
  return { label: 'Good', color: 'bg-[#E2F4C5]', pct: 75 }
}

const inputCls = 'w-full rounded-xl border border-[#E5E7EB] bg-[#F4F8F8] px-4 py-3 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#0B3C37] focus:bg-white focus:ring-2 focus:ring-[#0B3C37]/10'

export function LoginForm({
  confirmationError = false,
  initialMode = 'sign-in',
}: {
  confirmationError?: boolean
  initialMode?: 'sign-in' | 'sign-up' | 'reset-password'
}) {
  const router = useRouter()
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'reset-request' | 'reset-password'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(
    confirmationError
      ? 'That confirmation link could not be verified. Try signing in or request a new link.'
      : '',
  )
  const [pending, setPending] = useState(false)

  function switchMode(next: typeof mode) { setMode(next); setError(''); setMessage('') }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(''); setMessage(''); setPending(true)
    try {
      const supabase = createClient()

      if (mode === 'reset-request') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/login?mode=reset-password')}`,
        })
        if (err) throw err
        setMessage('If an account exists for this email, a reset link is on its way. Check your spam folder too.')
        return
      }

      if (mode === 'reset-password') {
        const { error: err } = await supabase.auth.updateUser({ password })
        if (err) throw err
        await supabase.auth.signOut()
        setMode('sign-in'); setPassword('')
        setMessage('Password updated. Sign in with your new password.')
        return
      }

      if (mode === 'sign-up') {
        const { data, error: err } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fapp` },
        })
        if (err) throw err
        if (!data.session) {
          setMessage('Almost there. Check your inbox to confirm your email, then sign in.')
          return
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (err?.message === 'Invalid login credentials') {
          setError('Email or password is wrong. Double-check and try again, or reset your password.')
          return
        }
        if (err) throw err
      }

      router.replace('/app'); router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally { setPending(false) }
  }

  const copy = COPY[mode] ?? COPY['sign-in']
  const strength = mode === 'sign-up' ? passwordStrength(password) : null

  return (
    <div className="min-h-screen bg-[#F4F8F8]">

      {/* ── Sticky top nav ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandLogo size="md" />
          <nav className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Home</Link>
            <Link
              href={mode === 'sign-in' ? '/login?mode=sign-up' : '/login'}
              className="rounded-full bg-[#0B3C37] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d4a44]"
            >
              {mode === 'sign-in' ? 'Create account' : 'Sign in'}
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Card */}
          <div className="overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white shadow-sm">

            {/* Green top accent bar */}
            <div className="h-1.5 w-full bg-[#0B3C37]" />

            <div className="px-7 pb-8 pt-8 sm:px-10">

              {/* Logo + heading */}
              <div className="mb-7 text-center">
                <div className="mb-5 flex justify-center">
                  <BrandLogo size="lg" href="" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-[#111827]">{copy.heading}</h1>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{copy.subtitle}</p>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="grid gap-4">

                {/* Email */}
                {mode !== 'reset-password' && (
                  <div className="grid gap-1.5">
                    <label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                      Email address
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={320}
                      disabled={pending}
                      className={inputCls}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                )}

                {/* Password */}
                {mode !== 'reset-request' && (
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="login-password" className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                        {mode === 'reset-password' ? 'New password' : 'Password'}
                      </label>
                      {mode === 'sign-in' && (
                        <button
                          type="button"
                          className="text-xs font-semibold text-[#0B3C37] hover:underline"
                          onClick={() => switchMode('reset-request')}
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPw ? 'text' : 'password'}
                        autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                        required
                        minLength={mode === 'sign-in' ? undefined : 8}
                        maxLength={128}
                        disabled={pending}
                        className={`${inputCls} pr-12`}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'sign-in' ? 'Your password' : 'At least 8 characters'}
                      />
                      <button
                        type="button"
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#9CA3AF] hover:text-[#0B3C37]"
                      >
                        {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>

                    {/* Strength bar */}
                    {strength && password.length > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.pct}%` }} />
                        </div>
                        <span className="text-xs text-[#6B7280]">{strength.label}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div role="alert" className="rounded-xl border border-[#F5ABAA] bg-[#FCD2D1]/40 px-4 py-3 text-sm text-[#7A1C1A]">
                    {error}
                  </div>
                )}

                {/* Success */}
                {message && (
                  <div role="status" className="rounded-xl border border-[#C1EBE1] bg-[#E9F5F1] px-4 py-3 text-sm text-[#0D4034]">
                    {message}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B3C37] py-3.5 text-sm font-bold text-white transition hover:bg-[#0d4a44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C37] disabled:opacity-60"
                >
                  {pending ? (
                    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <span>→</span>
                  )}
                  {pending ? 'One moment…' : copy.cta}
                </button>
              </form>

              {/* Mode toggle */}
              <div className="mt-6 text-center text-sm text-[#6B7280]">
                {mode === 'sign-in' || mode === 'sign-up' ? (
                  <>
                    {mode === 'sign-in' ? 'No account yet?' : 'Already signed up?'}{' '}
                    <button
                      type="button"
                      className="font-bold text-[#0B3C37] hover:underline"
                      onClick={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
                    >
                      {mode === 'sign-in' ? 'Create a free account' : 'Sign in instead'}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="font-semibold text-[#6B7280] hover:text-[#0B3C37] hover:underline"
                    onClick={() => switchMode('sign-in')}
                  >
                    ← Back to sign in
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trust line */}
          <p className="mt-6 text-center text-xs text-[#9CA3AF]">
            Research from public pages only. Your data stays yours.
          </p>
        </div>
      </main>
    </div>
  )
}
