<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Secrets and environment handling

- Never commit real API keys, tokens, or credentials.
- Keep secrets only in local environment files such as `.env.local` and never paste them into chats, PRs, or code comments.
- This project ignores `.env`, `.env.*`, and `.env.local` in Git so secrets stay out of source control.
- Use `.env.example` as the safe template and replace placeholder values locally only.
- If a key is entered into the shell, terminal history, logs, or tool output, rotate it immediately.

## Core intelligence and truthfulness

1. **Zero Hallucination Policy**: State "I don't know" or request missing context immediately when information is absent. Never guess, invent facts, fabricate data, or make assumptions.
2. **Mandatory Web Grounding**: Before making any claim about a third-party platform, API, pricing, availability, or technical capability — search the web first. This is not optional. The current year is 2026 and the landscape changes fast. Claims made from training data alone are often wrong.
3. **Uncertainty Calibration**: Explicitly flag when data is scarce, conflicting, or changing rapidly.
4. **Platform facts verified as of October 2026** (re-verify before acting on these):
   - **Reddit**: Shut down unauthenticated `.json` scraping on May 28, 2026. New public API registrations close October 31, 2026. Full public API shutdown is March 2027. Any Reddit scraping now requires OAuth authentication and approved API access.
   - **Twitter/X**: No free read tier exists. The official API is pay-per-use at $0.005 per post read. The free tier is write-only. Scraping without the API is technically possible but X actively rotates its internals to break scrapers.
   - **LinkedIn**: Proxycurl, the dominant LinkedIn scraping API, shut down permanently on July 4, 2026 after LinkedIn sued them. Datacenter IPs are completely blocked. Residential proxies with approved tools are the only viable path.
   - **Webshare free tier**: 10 datacenter proxy IPs, 1GB bandwidth/month, no credit card. Datacenter proxies do NOT bypass Reddit or LinkedIn blocks — only residential proxies do.
   - **LangSearch**: Free web search API, $0 per 1,000 requests, daily token allowance resets at midnight UTC. No credit card required. Works from Vercel/Render server IPs.
   - **DuckDuckGo HTML scraping**: Blocked from Vercel, Render, Railway and other datacenter IPs. Works from localhost only.

## Product identity, audience, and copy voice

- The product and public-facing brand are **SusLid**. Do not use legacy names (PitchPilot, Remosus, gigshq) in user-facing copy, page metadata, or product descriptions.
- **Target audience**: freelance web developers, designers, WordPress specialists, and small web agencies who need more clients. The product owner is part of this audience.
- The core promise: help users find better prospects, understand what those prospects need, and turn website observations into personalized service offers and sales opportunities.
- SusLid is not a generic cold-email writer. It answers three specific questions for the user: Who should I contact? What useful service can I offer them? What should I do next?
- Write as a knowledgeable peer. Tone: warm, grounded, and candid. The user is a working professional, not a buyer browsing a SaaS landing page.
- Keep sentences short. Avoid corporate buzzwords: "synergy", "leverage", "ecosystem", "empower", "robust", "seamless", "supercharge", "delve", "tapestry", "testament", "game-changer", "fostering".
- Eliminate performative openings or conclusions such as "Great question", "In conclusion", or "It is important to remember". Start directly with the core point.
- Never invent statistics, testimonials, customer logos, certifications, or product capabilities that are not verified in the codebase.
- Flag missing content with a `<!-- CONTENT NEEDED: ... -->` comment instead of fabricating it.
- **No em dashes anywhere in source copy.** Use a comma, period, or rewrite the sentence instead. Em dashes in `AGENTS.md` lines added by `next dev` are exempt.
- Never promise guaranteed replies, outcomes, or revenue. Never automate sending.

## The core workflow (what every feature should serve)

The user should be able to go from a website URL to a useful prospect brief and a personalized message in a few minutes, then save the prospect and track what happens next. That is the entire job. Do not add features that do not serve this loop.

1. **Add a prospect**: Enter a business website URL (user-supplied leads, not a scraped database).
2. **Find a reason to contact them**: Analyze the public website and surface specific, verifiable observations, for example a weak call-to-action, a missing service page, or outdated content.
3. **Create personalized outreach**: Generate a relevant opening message and a suggested service offer grounded in the actual website findings. The output is a draft to edit, not a message to send.
4. **Track the opportunity**: Save the prospect, record contact dates, schedule follow-ups, and move prospects through a simple pipeline (new, researched, contacted, replied, meeting, won, lost).
5. **Learn what converts**: Track messages sent, replies received, calls booked, and deals won so users can improve their approach over time.

## SusLid feature scope

### In scope for the current milestone
1. **User onboarding**: Profile setup capturing the user's name, focus area (web, design, WordPress, branding, marketing, other), services offered, target market, offer description, and preferred outreach channel.
2. **Prospect CRUD**: Adding, editing, listing, searching, filtering, and deleting prospects with business name, website URL, contact info, notes, and lifecycle stage.
3. **Safe public website analysis**: SSRF-safe fetching of public website pages, DNS resolution, private IP rejection, redirect limits, 1 MB content cap, and clean text extraction with Cheerio.
4. **Structured Gemini findings**: Grounded AI analysis returning verbatim evidence quotes, observation categories, confidence ratings, suggested services, and explicit limitations. Analysis covers one fetched page only; it is not a full site audit.
5. **Personalized pitch and email drafts**: Editable email and DM drafts generated from the actual website findings. Users edit before sending manually. No automated delivery.
6. **Pipeline management**: Prospect lifecycle stages updated by the user. Follow-up reminders with optional due dates.
7. **Activity tracking**: Logging of research milestones, status changes, and user-created follow-up notes.

### Explicitly out of scope
- No contact database or Apollo-style prospecting data. Users bring their own leads.
- No automated bulk sending or ESP integrations.
- No LinkedIn scraping or automation.
- No multi-tenant team features, organization invites, or shared workspaces.
- No payment processing or billing for the current milestone.

## Differentiation guardrails

These are the product's actual advantages. Do not add features that undermine them.

- **Website-first**: every insight is grounded in what is publicly visible on the prospect's actual website, with a verbatim quote as evidence. Never invent observations.
- **Practical offers**: turn a real observed problem into a sensible service pitch. Generic AI-generated messages are the thing this product replaces.
- **Simple pipeline**: prioritize next-action clarity over a large contact database or vanity metrics.
- **Affordable and fast**: the user should be able to evaluate a prospect and draft an outreach message in a few minutes, not hours.

## Implementation guardrails and service budget

- Keep secrets server-side (`GEMINI_API_KEY`, Supabase service role keys). Validate and sanitize all user-provided URLs and inputs before processing or storing.
- Keep service costs at \$0 by using free tiers only. Supabase free tier, Google Gemini free tier.
- Verify credentials, schema migrations, and RLS policies before claiming database persistence is active.
- Preserve accessible semantic controls, keyboard navigation, and responsive layouts.
- `export const dynamic = 'force-dynamic'` is required on any server page that reads Supabase session or environment variables, to prevent static-render failures during the Vercel build.

## Validation

- Run `npx tsc --noEmit` after every code change. It must exit 0 before declaring a task done.
- Run `npx vitest run` to ensure unit and validation tests pass.
- Do not declare a task done if TypeScript or test errors exist.
