import Link from 'next/link'
import { brand } from '@/lib/pitchpilot/brand'

export function NavBar() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" aria-label={`${brand.name} home`} className="font-serif text-2xl font-semibold tracking-tight">
        {brand.name}<span className="ml-1 text-teal-800">.</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-4">
        <Link href="/" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">Home</Link>
        <Link href="/login?mode=sign-up" className="rounded-full bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">Create account</Link>
      </nav>
    </header>
  )
}
