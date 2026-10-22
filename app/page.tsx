import Link from 'next/link'
import { brand } from '@/lib/pitchpilot/brand'

const steps = [
  {
    number: '01',
    title: 'Add a prospect',
    body: 'Enter a business website URL you have found. No bloated contact databases or stale scraped leads.',
  },
  {
    number: '02',
    title: 'Find a reason to contact them',
    body: 'SusLid safely analyzes accessible page content and surfaces verifiable observations like weak calls to action, missing service pages, or outdated copy.',
  },
  {
    number: '03',
    title: 'Create personalized outreach',
    body: 'Generate a relevant opening message and a suggested service offer grounded in actual page evidence, ready for you to edit and send.',
  },
  {
    number: '04',
    title: 'Track the opportunity',
    body: 'Save the prospect, record contact dates, schedule follow-ups, and move opportunities through a clear pipeline from new to won.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f4ef] text-slate-950">
      {/* Navigation */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
          {brand.name}<span className="ml-0.5 text-teal-800">.</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-6">
          <a href="#how-it-works" className="hidden text-sm font-medium text-slate-600 hover:text-slate-950 sm:inline">How it works</a>
          <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-950">Pricing</a>
          <Link href="/login" className="text-sm font-medium text-slate-700 hover:text-slate-950">Sign in</Link>
          <Link href="/login?mode=sign-up" className="rounded-full bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
            Start free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-12 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-900/15 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-teal-900">
            Built for freelance developers, designers, WordPress specialists and agencies
          </p>
          <h1 className="mt-6 max-w-3xl font-serif text-5xl font-medium leading-[1.04] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Find the opportunity.<br /><span className="text-teal-800">Make the pitch.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Find better prospects, understand what they need, and turn website observations into personalized service offers and sales opportunities.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?mode=sign-up"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-teal-800 px-6 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
            >
              Start with 3 free analyses <span aria-hidden="true" className="ml-2">↗</span>
            </Link>
            <a
              href="#pricing"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-300 bg-white/60 px-6 text-sm font-semibold text-slate-800 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
            >
              View pricing
            </a>
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">
            No generic cold emails. Every insight is grounded in what is publicly visible on the prospect website.
          </p>
        </div>

        {/* Live Visual Card */}
        <div className="relative mx-auto w-full max-w-lg lg:mr-0">
          <div aria-hidden="true" className="absolute -right-16 -top-10 size-64 rounded-full border border-teal-900/15 sm:size-80" />
          <div aria-hidden="true" className="absolute -bottom-12 -left-9 size-40 rounded-full bg-[#d8e6de]" />
          <div className="relative rotate-1 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_30px_100px_-35px_rgba(15,45,40,0.28)] sm:p-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">Website Inspection</p>
                <p className="mt-1 font-serif text-xl">dentalclinic.ng</p>
              </div>
              <span className="rounded-full bg-[#e9f2ed] px-3 py-1 text-[11px] font-medium text-teal-900">Live Observation</span>
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-700 font-medium">
              “The site lists appointment booking, but the primary button links to an unmonitored generic email form.”
            </p>
            <div className="mt-4 rounded-xl border-l-2 border-teal-700 bg-[#f5f4ef] p-3 text-xs leading-5 text-slate-600">
              Verbatim quote from page<br />
              <span className="mt-1 block font-medium text-slate-900">“Contact us for bookings via email or call back later.”</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500">Suggested practical offer</span>
              <span className="rounded-full border border-teal-800/20 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-950">
                Direct WhatsApp or Calendly Booking Flow
              </span>
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Editable draft (email & DM)</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">Quick observation about your appointment flow</p>
              <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                Hi Dr. Samuel, I noticed patients landing on your booking button get sent to an email form instead of an instant confirmation.
              </p>
            </div>
            <p className="mt-4 text-[10px] leading-4 text-slate-400">Illustrative example. Analyses cover accessible public pages only.</p>
          </div>
        </div>
      </section>

      {/* 3 Core Questions Banner */}
      <section className="border-y border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-teal-800">
            Beyond generic AI email writers
          </p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center font-serif text-2xl font-medium tracking-tight text-slate-950 sm:text-3xl">
            SusLid answers three specific questions for every prospect
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-6 text-center">
              <span className="text-2xl">🎯</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">Who should I contact?</h3>
              <p className="mt-2 text-sm text-slate-600">Enter businesses you want to work with and organize them in one clean dashboard.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-6 text-center">
              <span className="text-2xl">💡</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">What useful service can I offer?</h3>
              <p className="mt-2 text-sm text-slate-600">Turn real website flaws like weak CTAs and slow pages into grounded service proposals.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-6 text-center">
              <span className="text-2xl">🚀</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900">What should I do next?</h3>
              <p className="mt-2 text-sm text-slate-600">Schedule reminders, record replies, and move deals through a focused pipeline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-800">The 4-step workflow</p>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Go from website URL to a tailored pitch in minutes
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Every insight is anchored in verbatim quotes from the target site so your pitch sounds like a knowledgeable peer, not an automated spam bot.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <article key={step.number} className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <span className="font-serif text-3xl font-medium text-teal-800">{step.number}</span>
                  <h3 className="mt-4 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section matching user specification */}
      <section id="pricing" className="border-t border-slate-200 bg-slate-950 py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-teal-400">Pricing and capacity</span>
            <h2 className="mt-3 font-serif text-3xl font-medium tracking-tight sm:text-4xl text-white">
              Predictable pricing for independent operators
            </h2>
            <p className="mt-3 text-base text-slate-400">
              Start with free analyses to test the result. Upgrade to Pro when you are ready to scale your outreach.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {/* Free Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-slate-800 bg-slate-900/90 p-7">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Free</h3>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">Acquisition</span>
                </div>
                <div className="mt-4 text-4xl font-extrabold text-white">₦0</div>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    <span>A small number of prospect analyses (3 per month).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    <span>A limited number of personalized drafts.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    <span>Basic prospect tracking.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-400">Purpose: help users experience the core result before paying.</p>
                <Link
                  href="/login?mode=sign-up"
                  className="mt-4 block w-full rounded-xl bg-slate-800 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Start free
                </Link>
              </div>
            </div>

            {/* Pro Card */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-emerald-500/60 bg-slate-900/90 p-7 shadow-xl">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Pro</h3>
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-950 px-3 py-1 text-xs font-semibold text-emerald-400">Test first</span>
                </div>
                <div className="mt-4 flex items-baseline gap-1 text-4xl font-extrabold text-white">
                  ₦15,000
                  <span className="text-sm font-normal text-slate-400">/month</span>
                </div>
                <p className="mt-1 text-xs text-emerald-400 font-medium">₦10,000 to ₦20,000 monthly test range</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>More prospect analyses and outreach drafts (50 per month).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Follow-up workflows and pipeline tracking.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>Saved templates and campaign insights.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-400">Suggested initial pricing range to test with Nigerian freelancers and small agencies.</p>
                <Link
                  href="/login?mode=sign-up"
                  className="mt-4 block w-full rounded-xl bg-teal-600 py-3 text-center text-sm font-semibold text-white transition hover:bg-teal-500"
                >
                  Get started with Pro
                </Link>
              </div>
            </div>

            {/* Founding Customer Plan Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-amber-500/40 bg-slate-900/90 p-7">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Founding customer plan</h3>
                  <span className="rounded-full border border-amber-500/40 bg-amber-950 px-3 py-1 text-xs font-semibold text-amber-300">Limited early cohort</span>
                </div>
                <div className="mt-4 text-3xl font-extrabold text-amber-200">
                  Early Cohort Access
                </div>
                <p className="mt-1 text-xs text-slate-400">₦35,000 one-time initial access</p>
                <ul className="mt-6 space-y-3 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Early access to the product.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Direct input into the roadmap.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>Guided onboarding and personal feedback.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-8 border-t border-slate-800 pt-5">
                <p className="text-xs text-slate-400">Offer a genuine early-adopter price in exchange for feedback. Avoid promising features you have not built.</p>
                <Link
                  href="/login?mode=sign-up"
                  className="mt-4 block w-full rounded-xl border border-amber-500/50 bg-amber-500/10 py-3 text-center text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
                >
                  Join early cohort
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>© {new Date().getFullYear()} {brand.name}. Research from public pages, reviewed by you.</p>
        <p>Built for freelance developers, designers, and creative agencies in Nigeria and across Africa.</p>
      </footer>
    </main>
  )
}
