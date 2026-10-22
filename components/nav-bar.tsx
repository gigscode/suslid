import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'

export function NavBar() {
  return (
    <>
      <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2">
        <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white/90 px-5 py-3 shadow-lg shadow-black/5 backdrop-blur-md sm:px-6">
          <BrandLogo size="sm" />
          <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-4">
            <a href="#how-it-works" className="hidden text-sm font-medium text-[#6B7280] hover:text-[#111827] sm:inline">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Pricing</a>
            <Link href="/login" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Sign in</Link>
            <Link href="/login?mode=sign-up" className="rounded-full bg-[#0B3C37] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d4a44]">
              Start free
            </Link>
          </nav>
        </div>
      </div>
      <div className="h-20" aria-hidden="true" />
    </>
  )
}
