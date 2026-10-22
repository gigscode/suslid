import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <BrandLogo size="md" />

        <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/#how-it-works"
            className="hidden text-sm font-medium text-[#6B7280] transition hover:text-[#111827] sm:inline"
          >
            How it works
          </Link>
          <Link
            href="/#pricing"
            className="hidden text-sm font-medium text-[#6B7280] transition hover:text-[#111827] sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#6B7280] transition hover:text-[#111827]"
          >
            Sign in
          </Link>
          <Link
            href="/login?mode=sign-up"
            className="rounded-full bg-[#0B3C37] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0d4a44] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3C37]"
          >
            Start free
          </Link>
        </nav>
      </div>
    </header>
  )
}
