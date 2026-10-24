import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { brand } from '@/lib/pitchpilot/brand'

// Feature cards — solid accent colour + SVG icon, no emoji
const features = [
  {
    bg: 'bg-[#E2F4C5]',
    accent: '#2D5016',
    iconBg: '#2D5016',
    title: 'Find prospects fast',
    body: 'Search the web for businesses in any niche or location. Save the ones worth contacting with one click.',
    icon: (
      // Magnifying glass with a plus — "find"
      <svg viewBox="0 0 28 28" fill="none" className="size-5" aria-hidden="true">
        <circle cx="12" cy="12" r="7" stroke="white" strokeWidth="2.2" />
        <line x1="17.5" y1="17.5" x2="24" y2="24" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
        <line x1="12" y1="9" x2="12" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="9" y1="12" x2="15" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    // Decorative bg shape
    shape: <div aria-hidden="true" className="absolute -right-4 -bottom-4 size-24 rounded-full bg-[#2D5016]/10" />,
  },
  {
    bg: 'bg-[#C1EBE1]',
    accent: '#0D4034',
    iconBg: '#0D4034',
    title: 'Spot what their site is missing',
    body: 'SusLid fetches the public page, extracts the content, and returns specific observations backed by verbatim quotes.',
    icon: (
      // Browser window with a warning slash
      <svg viewBox="0 0 28 28" fill="none" className="size-5" aria-hidden="true">
        <rect x="3" y="5" width="22" height="18" rx="3" stroke="white" strokeWidth="2.1" />
        <line x1="3" y1="11" x2="25" y2="11" stroke="white" strokeWidth="2" />
        <circle cx="7" cy="8" r="1.2" fill="white" />
        <circle cx="11" cy="8" r="1.2" fill="white" />
        <line x1="10" y1="17" x2="18" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="12" y1="20.5" x2="16" y2="20.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    shape: (
      <>
        <div aria-hidden="true" className="absolute -right-3 -top-3 size-16 rounded-full border-2 border-[#0D4034]/15" />
        <div aria-hidden="true" className="absolute right-6 -bottom-2 size-8 rounded-full bg-[#0D4034]/10" />
      </>
    ),
  },
  {
    bg: 'bg-[#FCD2D1]',
    accent: '#7A1C1A',
    iconBg: '#7A1C1A',
    title: 'Send a pitch that lands',
    body: 'Get a draft email and DM written from the actual page findings. Edit it, then send it yourself.',
    icon: (
      // Envelope with an arrow
      <svg viewBox="0 0 28 28" fill="none" className="size-5" aria-hidden="true">
        <rect x="3" y="7" width="22" height="15" rx="2.5" stroke="white" strokeWidth="2.1" />
        <polyline points="3,7 14,16 25,7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="19" y1="18" x2="23" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <polyline points="21,15.5 23.5,18 21,20.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    shape: (
      <>
        <div aria-hidden="true" className="absolute -left-3 -bottom-3 size-20 rounded-full bg-[#7A1C1A]/10" />
        <div aria-hidden="true" className="absolute right-4 top-3 size-5 rotate-45 rounded bg-[#7A1C1A]/10" />
      </>
    ),
  },
  {
    bg: 'bg-[#D3D6FC]',
    accent: '#2A2A7A',
    iconBg: '#2A2A7A',
    title: 'Track every deal',
    body: 'Move prospects through a clear pipeline. Log follow-ups, set reminders, and see what converts.',
    icon: (
      // Simple pipeline / bar chart
      <svg viewBox="0 0 28 28" fill="none" className="size-5" aria-hidden="true">
        <rect x="3" y="16" width="5" height="8" rx="1.5" fill="white" />
        <rect x="11" y="10" width="5" height="14" rx="1.5" fill="white" />
        <rect x="19" y="4" width="5" height="20" rx="1.5" fill="white" />
      </svg>
    ),
    shape: (
      <>
        <div aria-hidden="true" className="absolute -right-4 -top-4 size-20 rounded-full border-2 border-[#2A2A7A]/15" />
        <div aria-hidden="true" className="absolute -left-2 bottom-4 size-10 rounded-full bg-[#2A2A7A]/10" />
      </>
    ),
  },
]

const steps = [
  { n: '01', title: 'Add a prospect', body: 'Enter a business website URL. Paste one you found manually or use the built-in search to discover businesses by niche and location.' },
  { n: '02', title: 'Inspect their website', body: 'SusLid fetches the public page, strips the noise, and returns observations grounded in what is actually written on the site.' },
  { n: '03', title: 'Send a personalised pitch', body: 'A draft email and DM are generated from the findings. You edit them, then send manually. No automated bulk sending.' },
  { n: '04', title: 'Track and follow up', body: 'Save the prospect, move them through pipeline stages, schedule a follow-up, and record what happens.' },
]

// Solid accent colours for the step number nodes
const stepColors = ['bg-[#0B3C37]', 'bg-[#1A5C55]', 'bg-[#7A1C1A]', 'bg-[#2A2A7A]']

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F8F8] text-[#111827]">

      {/* ── Nav ── */}
      <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2">
        <div className="flex items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white/90 px-5 py-3 shadow-lg shadow-black/5 backdrop-blur-md sm:px-6">
          <BrandLogo size="sm" />
          <nav className="flex items-center gap-2 sm:gap-4">
            <a href="#how-it-works" className="hidden text-sm font-medium text-[#6B7280] hover:text-[#111827] sm:inline">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Pricing</a>
            <Link href="/login" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Sign in</Link>
            <Link href="/login?mode=sign-up" className="rounded-full bg-[#0B3C37] px-4 py-2 text-sm font-bold text-white hover:bg-[#0d4a44]">
              Start free
            </Link>
          </nav>
        </div>
      </header>
      <div className="h-20" aria-hidden="true" />

      {/* ── Hero ── */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div className="relative z-10">
          <h1 className="mt-0 max-w-2xl text-5xl font-extrabold leading-[1.04] tracking-[-0.04em] text-[#111827] sm:text-6xl lg:text-7xl">
            Stop waiting for referrals.<br /><span className="text-[#0B3C37]">Go find the work.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#6B7280] sm:text-lg">
            You're good at what you do. The hard part is finding the next client. SusLid shows you who needs your service, what is broken on their website, and exactly what to say when you reach out.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login?mode=sign-up" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0B3C37] px-7 text-sm font-bold text-white transition hover:bg-[#0d4a44]">
              Start free ↗
            </Link>
            <a href="#how-it-works" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-7 text-sm font-semibold text-[#374151] hover:bg-[#F4F8F8]">
              See how it works
            </a>
          </div>
          <p className="mt-4 text-xs text-[#9CA3AF]">Every observation is grounded in what is publicly visible on the prospect's own website. No invented claims.</p>
        </div>

        {/* Live preview card */}
        <div className="relative mx-auto w-full max-w-md lg:mr-0">
          {/* Decorative shapes — solid colours, no generic gradients */}
          <div aria-hidden="true" className="absolute -right-8 -top-8 size-40 rounded-full bg-[#0B3C37]/8 border border-[#0B3C37]/10" />
          <div aria-hidden="true" className="absolute -bottom-6 -left-6 size-28 rounded-full bg-[#C1EBE1]" />
          <div aria-hidden="true" className="absolute top-1/2 -right-4 size-10 rounded-full bg-[#FCD2D1]" />
          <div className="relative glass-card rotate-1 rounded-3xl p-6 shadow-[0_30px_80px_-30px_rgba(11,60,55,0.20)]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B3C37]">Website inspection</p>
                <p className="mt-1 font-bold text-lg text-[#111827]">dentalclinic.ng</p>
              </div>
              <span className="rounded-full bg-[#E2F4C5] px-3 py-1 text-[11px] font-semibold text-[#2D5016]">Real finding</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#374151] font-medium">
              The booking button sends patients to an unmonitored email form instead of an instant confirmation.
            </p>
            <div className="mt-4 rounded-xl border-l-2 border-[#0B3C37] bg-[#F4F8F8] p-3 text-xs leading-5 text-[#6B7280]">
              Pulled directly from the page
              <span className="mt-1 block font-semibold text-[#111827]">"Contact us for bookings via email or call back later."</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-[#9CA3AF]">Suggested offer</span>
              <span className="rounded-full border border-[#0B3C37]/20 bg-[#C1EBE1] px-3 py-1.5 text-xs font-bold text-[#0D4034]">WhatsApp booking flow</span>
            </div>
            <p className="mt-4 text-[10px] text-[#9CA3AF]">Illustrative example. Analyses cover public pages only.</p>
          </div>
        </div>
      </section>

      {/* ── 3 questions — wavy process layout ── */}
      <section className="border-y border-[#E5E7EB] bg-white py-16 sm:py-24 overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-[#0B3C37]/30" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">A tool for agencies and the clients they serve</p>
              <span className="h-px w-8 bg-[#0B3C37]/30" />
            </div>
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl">
              Three questions SusLid answers<br className="hidden sm:block" /> for every prospect
            </h2>
          </div>

          {/* Desktop — three-row layout: text for stop 1 bottom / wave+icons / text for stops 2 and 3 bottom */}
          <div className="hidden md:block">

            {/* Row A — wave strip + icon bubbles */}
            <div className="relative" style={{ height: '120px' }}>
              <svg
                aria-hidden="true"
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 900 120"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M 60 90 C 180 90, 220 30, 370 30 C 520 30, 560 90, 680 90 C 800 90, 840 30, 900 30"
                  stroke="#0B3C37"
                  strokeWidth="3"
                  strokeOpacity="0.07"
                  strokeLinecap="round"
                />
                <path
                  d="M 60 90 C 180 90, 220 30, 370 30 C 520 30, 560 90, 680 90 C 800 90, 840 30, 900 30"
                  stroke="url(#wavyGrad)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 5"
                />
                <defs>
                  <linearGradient id="wavyGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0B3C37" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#0B3C37" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#0B3C37" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Stop 1 — trough, left */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: '7%', top: '75%' }}>
                <span aria-hidden="true" className="absolute -top-8 -left-2 select-none text-5xl font-extrabold leading-none text-[#0B3C37]/[0.07]">1</span>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#0B3C37] shadow-[0_4px_20px_rgba(11,60,55,0.25)]">
                  <svg viewBox="0 0 28 28" fill="none" className="size-6" aria-hidden="true">
                    <circle cx="14" cy="14" r="8" stroke="white" strokeWidth="2.2" />
                    <circle cx="14" cy="14" r="3" fill="white" />
                    <line x1="14" y1="3" x2="14" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="14" y1="21" x2="14" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="3" y1="14" x2="7" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                    <line x1="21" y1="14" x2="25" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Stop 2 — peak, centre */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: '42%', top: '25%' }}>
                <span aria-hidden="true" className="absolute -top-8 -left-2 select-none text-5xl font-extrabold leading-none text-[#0B3C37]/[0.07]">2</span>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#7A1C1A] shadow-[0_4px_20px_rgba(122,28,26,0.25)]">
                  <svg viewBox="0 0 28 28" fill="none" className="size-6" aria-hidden="true">
                    <rect x="4" y="6" width="20" height="16" rx="2.5" stroke="white" strokeWidth="2.1" />
                    <line x1="4" y1="12" x2="24" y2="12" stroke="white" strokeWidth="2" />
                    <circle cx="8" cy="9" r="1.3" fill="white" />
                    <circle cx="12.5" cy="9" r="1.3" fill="white" />
                    <line x1="9" y1="17" x2="19" y2="17" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* Stop 3 — peak, right */}
              <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10" style={{ left: '76%', top: '25%' }}>
                <span aria-hidden="true" className="absolute -top-8 -left-2 select-none text-5xl font-extrabold leading-none text-[#0B3C37]/[0.07]">3</span>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#2A2A7A] shadow-[0_4px_20px_rgba(42,42,122,0.25)]">
                  <svg viewBox="0 0 28 28" fill="none" className="size-6" aria-hidden="true">
                    <rect x="4" y="7" width="20" height="14" rx="2.5" stroke="white" strokeWidth="2.1" />
                    <polyline points="4,7 14,15 24,7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Row B — text for all three stops, below their icons */}
            <div className="relative mt-6" style={{ height: '100px' }}>
              {/* Stop 1 text — left, aligned under the trough icon */}
              <div className="absolute" style={{ left: '0%' }}>
                <h3 className="font-bold text-[#111827] text-sm leading-snug">Who should I contact?</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#6B7280] max-w-[190px]">Add any business website. SusLid keeps them organised by stage so you always know who to follow up with next.</p>
              </div>
              {/* Stop 2 text — centre, aligned under the peak icon */}
              <div className="absolute" style={{ left: '50%', transform: 'translateX(-60%)' }}>
                <h3 className="font-bold text-[#111827] text-sm leading-snug">What can I offer them?</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#6B7280] max-w-[190px]">SusLid reads their website and tells you what is broken and what service you can offer to fix it.</p>
              </div>
              {/* Stop 3 text — right, aligned under the second peak icon */}
              <div className="absolute text-left" style={{ right: '0%' }}>
                <h3 className="font-bold text-[#111827] text-sm leading-snug">What do I say to them?</h3>
                <p className="mt-1.5 text-xs leading-5 text-[#6B7280] max-w-[190px]">Get a draft email or DM written from the actual page findings. Edit it, then send it yourself.</p>
              </div>
            </div>

          </div>

          {/* Mobile fallback */}
          <div className="flex flex-col gap-8 md:hidden">
            {[
              { color: 'bg-[#0B3C37]', q: 'Who should I contact?', a: 'Add businesses you want to work with. Organise them by stage so you always know who to follow up with next.' },
              { color: 'bg-[#7A1C1A]', q: 'What can I offer them?', a: 'SusLid reads their website and surfaces specific, evidence-backed problems your services can solve.' },
              { color: 'bg-[#2A2A7A]', q: 'What do I say to them?', a: 'Get a draft email or DM written from the actual page findings. Edit it, then send it yourself.' },
            ].map(({ color, q, a }, i) => (
              <div key={q} className="flex gap-4">
                <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${color} shadow-sm`}>
                  <span className="text-sm font-extrabold text-white">0{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-bold text-[#111827] text-sm">{q}</h3>
                  <p className="mt-1 text-xs leading-5 text-[#6B7280]">{a}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">What SusLid does</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Use it yourself. Give it to your clients.</h2>
            <p className="mt-3 text-base text-[#6B7280]">Run your own outreach. Then offer SusLid to the agencies you work with so their teams can find and convert leads the same way.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className={`relative overflow-hidden rounded-2xl p-7 ${f.bg}`}>
                {/* Decorative background shapes */}
                {f.shape}
                {/* Solid colour icon block */}
                <div
                  className="relative z-10 flex size-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: f.iconBg }}
                >
                  {f.icon}
                </div>
                <h3 className="relative z-10 mt-4 font-bold text-lg" style={{ color: f.accent }}>{f.title}</h3>
                <p className="relative z-10 mt-2 text-sm leading-6" style={{ color: f.accent, opacity: 0.8 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-[#E5E7EB] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl mb-16">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From a website URL to a sent pitch in one session</h2>
            <p className="mt-4 text-base text-[#6B7280]">Every observation is pulled directly from the target site. Your pitch sounds informed because it is.</p>
          </div>

          <div className="relative">
            {/* Connecting line (desktop) */}
            <div aria-hidden="true" className="absolute top-9 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-[#0B3C37]/20 to-transparent lg:block" />

            <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <div key={s.n} className="relative flex flex-col">
                  <div className="flex items-center gap-4 lg:flex-col lg:items-start">
                    <div className={`relative flex size-[72px] shrink-0 items-center justify-center rounded-2xl ${stepColors[i]} lg:mb-5`}>
                      <span className="text-2xl font-extrabold text-white">{s.n}</span>
                      {/* Dot on the connecting line */}
                      <div aria-hidden="true" className="absolute -bottom-px left-1/2 hidden size-2 -translate-x-1/2 translate-y-[calc(100%+0.5rem+0.5px)] rounded-full bg-[#0B3C37] lg:block" />
                    </div>
                  </div>
                  <h3 className="mt-4 font-bold text-[#111827]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#6B7280]">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[#0B3C37] py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C1EBE1]">Pricing</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing. No surprises.</h2>
            <p className="mt-3 text-base text-white/60">Start free. Upgrade when you are ready to run more analyses or hand accounts to clients.</p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Free */}
            <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Free</h3>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/60">Get started</span>
              </div>
              <div className="mt-4 text-4xl font-extrabold">₦0</div>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70">
                <li className="flex gap-2"><span className="text-[#C1EBE1]">•</span>3 prospect analyses per month</li>
                <li className="flex gap-2"><span className="text-[#C1EBE1]">•</span>Limited personalized drafts</li>
                <li className="flex gap-2"><span className="text-[#C1EBE1]">•</span>Basic prospect tracking</li>
              </ul>
              <Link href="/login?mode=sign-up" className="mt-8 block rounded-xl bg-white/10 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/20">
                Start free
              </Link>
            </div>

            {/* Pro */}
            <div className="relative flex flex-col rounded-3xl border-2 border-[#C1EBE1]/50 bg-white/5 p-8 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Pro</h3>
                <span className="rounded-full border border-[#C1EBE1]/30 bg-[#C1EBE1]/10 px-3 py-1 text-xs font-semibold text-[#C1EBE1]">Most popular</span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">₦15,000</span>
                <span className="text-sm text-white/50">/month</span>
              </div>
              <p className="mt-1 text-xs text-[#C1EBE1]">₦10,000 to ₦20,000 test range</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70">
                <li className="flex gap-2"><span className="text-[#C1EBE1]">•</span>50 analyses per month</li>
                <li className="flex gap-2"><span className="text-[#C1EBE1]">•</span>Unlimited outreach drafts</li>
                <li className="flex gap-2"><span className="text-[#C1EBE1]">•</span>Pipeline + follow-up workflows</li>
              </ul>
              <Link href="/login?mode=sign-up" className="mt-8 block rounded-xl bg-[#C1EBE1] py-3 text-center text-sm font-bold text-[#0D4034] transition hover:bg-[#a8ddd3]">
                Get started with Pro
              </Link>
            </div>

            {/* Founding */}
            <div className="flex flex-col rounded-3xl border border-amber-400/30 bg-white/5 p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Founding customer</h3>
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">Limited</span>
              </div>
              <div className="mt-4 text-3xl font-extrabold text-amber-200">Early access</div>
              <p className="mt-1 text-xs text-white/50">₦35,000 one-time</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm text-white/70">
                <li className="flex gap-2"><span className="text-amber-300">•</span>Early product access</li>
                <li className="flex gap-2"><span className="text-amber-300">•</span>Direct roadmap input</li>
                <li className="flex gap-2"><span className="text-amber-300">•</span>Guided onboarding</li>
              </ul>
              <Link href="/login?mode=sign-up" className="mt-8 block rounded-xl border border-amber-400/40 bg-amber-400/10 py-3 text-center text-sm font-semibold text-amber-300 transition hover:bg-amber-400/20">
                Join early cohort
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-8 text-xs text-[#9CA3AF] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>© {new Date().getFullYear()} {brand.name}. Built for agencies and the clients they serve.</p>
          <p>Prospect research from public pages only. You write and send every message yourself.</p>
        </div>
      </footer>
    </main>
  )
}
