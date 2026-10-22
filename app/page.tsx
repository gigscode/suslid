import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { brand } from '@/lib/pitchpilot/brand'

const features = [
  {
    bg: 'bg-[#E2F4C5]', text: 'text-[#2D5016]', icon: '🎯',
    title: 'Who should I contact?',
    body: 'Add businesses you want to work with and keep them in one clean, searchable dashboard.',
  },
  {
    bg: 'bg-[#C1EBE1]', text: 'text-[#0D4034]', icon: '🔍',
    title: 'What useful service can I offer?',
    body: 'SusLid fetches the public website page, extracts readable content, and surfaces verifiable observations like weak CTAs, missing service pages, or outdated copy.',
  },
  {
    bg: 'bg-[#FCD2D1]', text: 'text-[#7A1C1A]', icon: '✉',
    title: 'What should I send them?',
    body: 'Generate a grounded email and DM draft anchored in actual page evidence. Edit before you send — always.',
  },
  {
    bg: 'bg-[#D3D6FC]', text: 'text-[#2A2A7A]', icon: '🚀',
    title: 'What should I do next?',
    body: 'Schedule follow-ups, record replies, and move deals through a focused pipeline from new to won.',
  },
]

const steps = [
  { n: '01', title: 'Add a prospect', body: 'Enter a business website URL you have found. No bloated contact databases.' },
  { n: '02', title: 'Inspect their website', body: 'SusLid safely fetches the public page, extracts readable content, and surfaces grounded observations.' },
  { n: '03', title: 'Create personalised outreach', body: 'Generate a relevant opening message grounded in page evidence, then edit and send it yourself.' },
  { n: '04', title: 'Track the opportunity', body: 'Save the prospect, schedule follow-ups, and move deals through a clear pipeline.' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F8F8] text-[#111827]">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-[#F4F8F8]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <BrandLogo size="md" />
          <nav className="flex items-center gap-3 sm:gap-5">
            <a href="#how-it-works" className="hidden text-sm font-medium text-[#6B7280] hover:text-[#111827] sm:inline">How it works</a>
            <a href="#pricing" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Pricing</a>
            <Link href="/login" className="text-sm font-medium text-[#6B7280] hover:text-[#111827]">Sign in</Link>
            <Link href="/login?mode=sign-up" className="rounded-full bg-[#0B3C37] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0d4a44]">
              Start free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#0B3C37]/15 bg-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-[#0B3C37]">
            Built for freelance developers, designers &amp; agencies
          </span>
          <h1 className="mt-6 max-w-2xl text-5xl font-extrabold leading-[1.04] tracking-[-0.04em] text-[#111827] sm:text-6xl lg:text-7xl">
            Find the opening.<br /><span className="text-[#0B3C37]">Make the pitch.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#6B7280] sm:text-lg">
            Turn a website URL into a grounded service offer and a personalised outreach draft — in minutes, not hours.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/login?mode=sign-up" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0B3C37] px-7 text-sm font-bold text-white transition hover:bg-[#0d4a44]">
              Start with 3 free analyses <span>↗</span>
            </Link>
            <a href="#pricing" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#E5E7EB] bg-white px-7 text-sm font-semibold text-[#374151] hover:bg-[#F4F8F8]">
              View pricing
            </a>
          </div>
          <p className="mt-4 text-xs text-[#9CA3AF]">No generic cold emails. Every insight is grounded in what is publicly visible on the prospect's website.</p>
        </div>

        {/* Live preview card */}
        <div className="relative mx-auto w-full max-w-md lg:mr-0">
          <div aria-hidden="true" className="absolute -right-10 -top-8 size-56 rounded-full border border-[#0B3C37]/10 opacity-60" />
          <div aria-hidden="true" className="absolute -bottom-10 -left-8 size-36 rounded-full bg-[#C1EBE1]/60" />
          <div className="relative glass-card rotate-1 rounded-3xl p-6 shadow-[0_30px_80px_-30px_rgba(11,60,55,0.20)]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B3C37]">Website Inspection</p>
                <p className="mt-1 font-bold text-lg text-[#111827]">dentalclinic.ng</p>
              </div>
              <span className="rounded-full bg-[#E2F4C5] px-3 py-1 text-[11px] font-semibold text-[#2D5016]">Live observation</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#374151] font-medium">
              "The site lists appointment booking, but the primary button links to an unmonitored generic email form."
            </p>
            <div className="mt-4 rounded-xl border-l-2 border-[#0B3C37] bg-[#F4F8F8] p-3 text-xs leading-5 text-[#6B7280]">
              Verbatim from page
              <span className="mt-1 block font-semibold text-[#111827]">"Contact us for bookings via email or call back later."</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-[#9CA3AF]">Suggested offer</span>
              <span className="rounded-full border border-[#0B3C37]/20 bg-[#C1EBE1] px-3 py-1.5 text-xs font-bold text-[#0D4034]">WhatsApp / Calendly booking flow</span>
            </div>
            <p className="mt-4 text-[10px] text-[#9CA3AF]">Illustrative example. Analyses cover public pages only.</p>
          </div>
        </div>
      </section>

      {/* ── 3 questions ── */}
      <section className="border-y border-[#E5E7EB] bg-white py-12">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">Beyond generic AI email writers</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {brand.name} answers three specific questions for every prospect
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: '🎯', q: 'Who should I contact?', a: 'Enter businesses you want to work with and organise them in one clean dashboard.' },
              { icon: '💡', q: 'What useful service can I offer?', a: 'Turn real website flaws like weak CTAs and slow pages into grounded service proposals.' },
              { icon: '🚀', q: 'What should I do next?', a: 'Schedule reminders, record replies, and move deals through a focused pipeline.' },
            ].map(({ icon, q, a }) => (
              <div key={q} className="rounded-2xl border border-[#E5E7EB] bg-[#F4F8F8] p-7 text-center">
                <span className="text-3xl">{icon}</span>
                <h3 className="mt-4 font-bold text-[#111827]">{q}</h3>
                <p className="mt-2 text-sm text-[#6B7280]">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">Core features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Everything in one focused workspace</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className={`relative overflow-hidden rounded-2xl p-7 ${f.bg}`}>
                <span className="text-3xl">{f.icon}</span>
                <h3 className={`mt-4 font-bold text-lg ${f.text}`}>{f.title}</h3>
                <p className={`mt-2 text-sm leading-6 ${f.text} opacity-80`}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-[#E5E7EB] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#0B3C37]">The 4-step workflow</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From website URL to tailored pitch in minutes</h2>
            <p className="mt-4 text-base text-[#6B7280]">Every insight is anchored in verbatim quotes from the target site so your pitch sounds like a knowledgeable peer.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.n} className="glass-card flex flex-col rounded-2xl p-6 shadow-sm">
                <span className="font-serif text-3xl font-bold text-[#0B3C37]">{s.n}</span>
                <h3 className="mt-4 font-bold text-[#111827]">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#6B7280]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="bg-[#0B3C37] py-16 text-white sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C1EBE1]">Pricing and capacity</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Predictable pricing for independent operators</h2>
            <p className="mt-3 text-base text-white/60">Start free. Upgrade when you are ready to scale.</p>
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
              <p className="mt-1 text-xs text-[#C1EBE1]">₦10,000–₦20,000 test range</p>
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
          <p>© {new Date().getFullYear()} {brand.name}. Research from public pages, reviewed by you.</p>
          <p>Built for freelance developers, designers, and agencies in Nigeria and across Africa.</p>
        </div>
      </footer>
    </main>
  )
}
