export type PlanType = 'free' | 'pro' | 'founding'

export interface PlanDetails {
  id: PlanType
  name: string
  priceDisplay: string
  billingInterval: string
  badge?: string
  description: string
  purpose: string
  features: string[]
  maxAnalysesPerMonth: number
  amountKobo: number
}

export const PLANS: Record<PlanType, PlanDetails> = {
  free: {
    id: 'free',
    name: 'Free',
    priceDisplay: '₦0',
    billingInterval: 'Free forever',
    badge: 'Acquisition',
    description: 'Help users experience the core result before paying.',
    purpose: 'Help users experience the core result before paying.',
    features: [
      'A small number of prospect analyses (3 per month).',
      'A limited number of personalized drafts.',
      'Basic prospect tracking.',
    ],
    maxAnalysesPerMonth: 3,
    amountKobo: 0,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceDisplay: '₦15,000',
    billingInterval: '/month',
    badge: 'Test first',
    description: 'Suggested initial pricing range to test with Nigerian freelancers and small agencies.',
    purpose: 'Suggested initial pricing range to test with Nigerian freelancers and small agencies.',
    features: [
      'More prospect analyses and outreach drafts (50 per month).',
      'Follow-up workflows and pipeline tracking.',
      'Saved templates and campaign insights.',
    ],
    maxAnalysesPerMonth: 50,
    amountKobo: 1500000,
  },
  founding: {
    id: 'founding',
    name: 'Founding customer plan',
    priceDisplay: '₦35,000',
    billingInterval: 'one-time cohort access',
    badge: 'Limited early cohort',
    description: 'Offer a genuine early-adopter price in exchange for feedback. Avoid promising features you have not built.',
    purpose: 'Offer a genuine early-adopter price in exchange for feedback. Avoid promising features you have not built.',
    features: [
      'Early access to the product.',
      'Direct input into the roadmap.',
      'Guided onboarding and personal feedback.',
      'Higher analysis capacity (150 per month).',
    ],
    maxAnalysesPerMonth: 150,
    amountKobo: 3500000,
  },
}

export function getPlanLimits(plan: PlanType | null | undefined): PlanDetails {
  if (plan === 'pro') return PLANS.pro
  if (plan === 'founding') return PLANS.founding
  return PLANS.free
}

