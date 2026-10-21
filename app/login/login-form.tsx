'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, LoaderCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NavBar } from '@/components/nav-bar'
import { createClient } from '@/lib/supabase/client'

/* ─────────────────────────────────────────────────────────────
   Heading and subtitle copy per mode
   Written to speak to the person, not at them.
───────────────────────────────────────────────────────────── */
const COPY = {
  'sign-in': {
    heading: 'Welcome back',
    subtitle: 'Your prospects, research, drafts and follow-ups are right where you left them.',
  },
  'sign-up': {
    heading: 'Start your workspace',
    subtitle: 'Save the businesses you want to help and make your outreach more considered.',
  },
  'reset-request': {
    heading: 'Forgot your password?',
    subtitle: 'Enter your email and we will send a password reset link if an account exists.',
  },
  'reset-password': {
    heading: 'Choose a new password',
    subtitle: 'Choose a new password with at least 8 characters.',
  },
} as const

/* ─────────────────────────────────────────────────────────────
   Password strength indicator (sign-up only)
───────────────────────────────────────────────────────────── */
function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: '0%' }
  if (password.length < 8) return { label: 'Too short', color: 'bg-red-400', width: '25%' }
  if (password.length < 12 && !/[^a-zA-Z0-9]/.test(password))
    return { label: 'Fair', color: 'bg-amber-400', width: '50%' }
  if (password.length >= 12 && /[^a-zA-Z0-9]/.test(password))
    return { label: 'Strong', color: 'bg-emerald-500', width: '100%' }
  return { label: 'Good', color: 'bg-[#7c3aed]', width: '75%' }
}

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
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(
    confirmationError
      ? 'That confirmation link could not be verified. Try signing in again or request a new link.'
      : '',
  )
  const [pending, setPending] = useState(false)

  function switchMode(next: typeof mode) {
    setMode(next)
    setError('')
    setMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setPending(true)

    try {
      const supabase = createClient()

      if (mode === 'reset-request') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/login?mode=reset-password')}`,
        })

        if (resetError) throw resetError
        setMessage('If an account exists for this email, a reset link is on its way. Check your spam folder too.')
        return
      }

      if (mode === 'reset-password') {
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) throw updateError

        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) {
          setMode('sign-in')
          setPassword('')
          setError('Password updated, but we could not end the recovery session. Sign out and sign back in.')
          return
        }

        setMode('sign-in')
        setPassword('')
        setMessage('Password updated. Sign in with your new password.')
        return
      }

      if (mode === 'sign-up') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fapp`,
          },
        })

        if (signUpError) throw signUpError
        if (!data.session) {
          setMessage('Almost there. Check your inbox to confirm your email, then sign in.')
          return
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

        if (signInError?.message === 'Invalid login credentials') {
          setError("Email or password is wrong. Double-check and try again, or reset your password below.")
          return
        }

        if (signInError) throw signInError
      }

      router.replace('/app')
      router.refresh()
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Something went wrong. Please try again.')
    } finally {
      setPending(false)
    }
  }

  const { heading, subtitle } = COPY[mode] ?? COPY['sign-in']
  const passwordStrength = mode === 'sign-up' ? getPasswordStrength(password) : null

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <NavBar />
      <main className="flex min-h-[calc(100vh-100px)] items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <Card className="border-slate-200/90 bg-white shadow-sm">
            <CardHeader className="items-center pb-2 pt-8 text-center">
              {/* Mode-aware heading */}
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {heading}
              </h1>

              {/* Mode-aware subtitle */}
              <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                {subtitle}
              </p>
            </CardHeader>

        <CardContent className="px-6 pb-8 pt-6 sm:px-8">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

            {/* Email field (hidden in reset-password mode) */}
            {mode !== 'reset-password' && (
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                Email address
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={320}
                  disabled={pending}
                  className="h-11 border-slate-200 bg-white px-3 text-base font-medium placeholder:text-slate-400 focus:ring-[#7c3aed]/20"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>
            )}

            {/* Password field (hidden in reset-request mode) */}
            {mode !== 'reset-request' && (
              <div className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
                {/* Label row: password label + forgot password inline (sign-in only) */}
                <div className="flex items-center justify-between">
                  <label htmlFor="auth-password">
                    {mode === 'reset-password' ? 'New password' : 'Password'}
                  </label>
                  {mode === 'sign-in' && (
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#7c3aed] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
                      onClick={() => switchMode('reset-request')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

                {/* Password input + show/hide toggle */}
                <span className="relative block">
                  <Input
                    id="auth-password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                    required
                    minLength={mode === 'sign-in' ? undefined : 8}
                    maxLength={128}
                    disabled={pending}
                    className="h-11 border-slate-200 bg-white px-3 pr-12 text-base font-medium placeholder:text-slate-400 focus:ring-[#7c3aed]/20"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={mode === 'sign-in' ? 'Your password' : 'At least 8 characters'}
                  />
                  <button
                    type="button"
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-lg text-slate-400 transition-colors hover:text-[#7c3aed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
                  >
                    {passwordVisible
                      ? <EyeOff aria-hidden="true" className="size-4" />
                      : <Eye aria-hidden="true" className="size-4" />}
                  </button>
                </span>

                {/* Password strength bar (sign-up only) */}
                {passwordStrength && password.length > 0 && (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500">{passwordStrength.label}</span>
                  </div>
                )}
              </div>
            )}

            {/* Error message */}
            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-800">
                {error}
              </p>
            )}

            {/* Success / info message */}
            {message && (
              <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-800">
                {message}
              </p>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              disabled={pending}
              className="mt-1 h-11 w-full rounded-full bg-[#7c3aed] text-sm font-bold text-white hover:bg-[#6d28d9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed] disabled:opacity-60"
            >
              {pending
                ? <LoaderCircle aria-hidden="true" className="mr-2 size-4 animate-spin" />
                : <ArrowRight aria-hidden="true" className="mr-2 size-4" />}
              {pending
                ? 'One moment...'
                : mode === 'sign-in'
                  ? 'Sign in'
                  : mode === 'sign-up'
                    ? 'Create account'
                    : mode === 'reset-request'
                      ? 'Send reset link'
                      : 'Update password'}
            </Button>
          </form>

          {/* ── Mode toggle footer ── */}
          {mode === 'sign-in' || mode === 'sign-up' ? (
            <p className="mt-6 text-center text-sm text-slate-500">
              {mode === 'sign-in' ? 'No account yet?' : 'Already signed up?'}{' '}
              <button
                type="button"
                className="font-semibold text-[#7c3aed] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
                onClick={() => switchMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')}
              >
                {mode === 'sign-in' ? 'Create a free account' : 'Sign in instead'}
              </button>
            </p>
          ) : (
            <button
              type="button"
              className="mt-5 flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-slate-500 underline-offset-4 hover:text-[#7c3aed] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7c3aed]"
              onClick={() => switchMode('sign-in')}
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              Back to sign in
            </button>
          )}
        </CardContent>
      </Card>
        </div>
      </main>
    </div>
  )
}
