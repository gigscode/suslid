import Link from 'next/link'
import { brand } from '@/lib/pitchpilot/brand'

const steps = [
  {
    number: '01',
    title: 'Add a business',
    body: 'Save a prospect you would genuinely like to work with. A name and its public website are enough to begin.',
  },
  {
    number: '02',
    title: 'Review what is there',
    body: 'Inspect one public page and see concise observations with page evidence, confidence, and clear limitations.',
  },
  {
    number: '03',
    title: 'Make it your pitch',
    body: 'Start with an editable email or direct message, save a follow-up, and keep the next step in view.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f4ef] text-slate-950">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">{brand.name}<span className="ml-1 text-teal-800">.</span></Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-6">
          <a href="#how-it-works" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">How it works</a>
          <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-950">Sign in</Link>
          <Link href="/login?mode=sign-up" className="rounded-full bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">Try it free</Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-900/15 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-900">
            A quieter way to find good-fit work
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl font-medium leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Find the opportunity.<br /><span className="text-teal-800">Make the pitch.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Research business websites, uncover specific creative opportunities, and prepare thoughtful outreach from one simple workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login?mode=sign-up" className="inline-flex min-h-12 items-center justify-center rounded-full bg-teal-800 px-6 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
              Create your free workspace <span aria-hidden="true" className="ml-2">↗</span>
            </Link>
            <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white/60 px-6 text-sm font-semibold text-slate-800 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">See how it works</a>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">For independent branding, design, web and creative marketing agencies.</p>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:mr-0">
          <div aria-hidden="true" className="absolute -right-16 -top-10 size-64 rounded-full border border-teal-900/15 sm:size-80" />
          <div aria-hidden="true" className="absolute -bottom-12 -left-9 size-40 rounded-full bg-[#d8e6de]" />
          <div className="relative rotate-1 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_100px_-35px_rgba(15,45,40,0.28)] sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">Page review</p><p className="mt-1 font-serif text-xl">A closer look</p></div>
              <span className="rounded-full bg-[#e9f2ed] px-3 py-1 text-[11px] font-medium text-teal-900">Public page</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-600">“The page introduces the service range, but each offer is grouped under one broad heading.”</p>
            <div className="mt-4 rounded-xl border-l-2 border-teal-700 bg-[#f5f4ef] p-3 text-xs leading-5 text-slate-600">
              Page evidence<br /><span className="mt-1 block font-medium text-slate-800">“We create solutions for every business.”</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Possible next step</span>
              <span className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold">Explore clearer service pages</span>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Draft, not send</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">A specific thought about your services</p>
              <div className="mt-3 h-2 w-full rounded bg-slate-100" /><div className="mt-2 h-2 w-4/5 rounded bg-slate-100" /><div className="mt-2 h-2 w-3/5 rounded bg-slate-100" />
            </div>
            <p className="mt-4 text-[10px] leading-4 text-slate-500">Illustrative example, not a customer analysis. Reviews cover one fetched page only.</p>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">A useful first step</p><h2 className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">Less guesswork. More considered outreach.</h2><p className="mt-4 text-base leading-7 text-slate-600">PitchPilot turns one public page into a starting point for a human conversation. You stay in control of what gets sent.</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step) => <article key={step.number} className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-5 sm:p-7"><span className="font-serif text-3xl text-teal-800">{step.number}</span><h3 className="mt-5 text-lg font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p></article>)}
          </div>
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-[#e9f2ed] p-5 sm:flex-row sm:items-center sm:p-7">
            <div><p className="font-semibold">Start with one prospect, on your terms.</p><p className="mt-1 text-sm text-slate-600">No automated sending. No promise of guaranteed results.</p></div>
            <Link href="/login?mode=sign-up" className="inline-flex min-h-11 items-center rounded-full bg-teal-800 px-5 text-sm font-semibold text-white hover:bg-teal-900">Create an account <span aria-hidden="true" className="ml-2">↗</span></Link>
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} {brand.name}. Research from public pages, reviewed by you.</p>
        <p>Built for creative agencies in Nigeria and across Africa.</p>
      </footer>
    </main>
  )
}
