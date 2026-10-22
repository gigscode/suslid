import { describe, expect, it } from 'vitest'
import {
  agencyProfileSchema,
  prospectSchema,
  findingsSchema,
  analysisRequestSchema,
  draftUpdateSchema,
  activitySchema,
} from '../lib/pitchpilot/validation'
import { brand } from '../lib/pitchpilot/brand'
import { PLANS, getPlanLimits } from '../lib/pitchpilot/pricing'

describe('SusLid workflow end to end validation', () => {
  it('has brand name SusLid', () => {
    expect(brand.name).toBe('SusLid')
  })

  it('validates agency onboarding profile correctly', () => {
    const validProfile = {
      agency_name: 'Studio North',
      agency_type: 'branding',
      services: ['Brand identity', 'Packaging'],
      target_markets: ['Nigeria', 'Kenya'],
      ideal_client_description: 'Fast-growing consumer goods brands',
      preferred_outreach_channel: 'email',
      offer_description: 'We help brands refine their visual identity.',
    }
    const result = agencyProfileSchema.safeParse(validProfile)
    expect(result.success).toBe(true)

    const invalidProfile = {
      agency_name: '',
      agency_type: 'invalid_type',
      services: [],
      target_markets: [],
      offer_description: '',
    }
    expect(agencyProfileSchema.safeParse(invalidProfile).success).toBe(false)
  })

  it('validates prospect CRUD payload correctly', () => {
    const validProspect = {
      business_name: 'Acme Retail',
      website_url: 'acme.com',
      country: 'Nigeria',
      industry: 'Retail',
      contact_name: 'Jane Doe',
      contact_email: 'jane@acme.com',
      notes: 'Initial outreach note',
    }
    const parsed = prospectSchema.safeParse(validProspect)
    expect(parsed.success).toBe(true)

    const invalidProspect = {
      business_name: '',
      contact_email: 'not-an-email',
    }
    expect(prospectSchema.safeParse(invalidProspect).success).toBe(false)
  })

  it('validates analysis request input', () => {
    const validRequest = {
      prospect_id: '123e4567-e89b-12d3-a456-426614174000',
      website_url: 'https://example.com',
    }
    expect(analysisRequestSchema.safeParse(validRequest).success).toBe(true)

    const invalidRequest = {
      prospect_id: 'not-a-uuid',
      website_url: 'not a url',
    }
    expect(analysisRequestSchema.safeParse(invalidRequest).success).toBe(false)
  })

  it('enforces verbatim evidence check logic in findings', () => {
    const mockPageText = 'Welcome to Studio Beta. We build custom websites for ecommerce brands.'

    const validFindings = {
      business_summary: 'Studio Beta builds custom websites.',
      observations: [{
        claim: 'Specializes in ecommerce',
        category: 'website' as const,
        evidence: 'We build custom websites for ecommerce brands.',
        confidence: 'high' as const,
        next_step: 'Suggest an audit of their case studies.',
      }],
      suggested_services: ['Web development'],
      outreach_email: {
        subject: 'Custom website question for Studio Beta',
        body: 'Saw your focus on custom websites for ecommerce brands.',
      },
      outreach_dm: {
        body: 'Quick note regarding your ecommerce website work.',
      },
      limitations: ['Single page reviewed.'],
    }

    const validated = findingsSchema.safeParse(validFindings)
    expect(validated.success).toBe(true)

    const compact = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim()
    const textHasEvidence = validFindings.observations.every((obs) =>
      compact(mockPageText).includes(compact(obs.evidence)),
    )
    expect(textHasEvidence).toBe(true)

    // Unverifiable hallucinated quote
    const hallucinatedEvidence = 'We generated $50M in client revenue last year.'
    expect(compact(mockPageText).includes(compact(hallucinatedEvidence))).toBe(false)
  })

  it('validates editable outreach draft updates', () => {
    const validDraft = {
      subject: 'Updated subject',
      body: 'Updated body with thoughtful note.',
    }
    expect(draftUpdateSchema.safeParse(validDraft).success).toBe(true)

    const emptyBody = {
      subject: 'Subject',
      body: '   ',
    }
    expect(draftUpdateSchema.safeParse(emptyBody).success).toBe(false)
  })

  it('validates activity follow-up logging', () => {
    const validActivity = {
      prospect_id: '123e4567-e89b-12d3-a456-426614174000',
      notes: 'Follow up on the sent email',
      due_at: '2026-11-01T10:00:00.000Z',
    }
    expect(activitySchema.safeParse(validActivity).success).toBe(true)

    const invalidActivity = {
      prospect_id: 'bad-id',
      notes: '',
    }
    expect(activitySchema.safeParse(invalidActivity).success).toBe(false)
  })

  it('correctly calculates plan limits and pricing in kobo', () => {
    expect(PLANS.free.maxAnalysesPerMonth).toBe(3)
    expect(PLANS.free.amountKobo).toBe(0)
    expect(PLANS.pro.maxAnalysesPerMonth).toBe(50)
    expect(PLANS.pro.amountKobo).toBe(1500000)
    expect(PLANS.founding.maxAnalysesPerMonth).toBe(150)
    expect(PLANS.founding.amountKobo).toBe(3500000)

    expect(getPlanLimits('free').id).toBe('free')
    expect(getPlanLimits('pro').id).toBe('pro')
    expect(getPlanLimits('founding').id).toBe('founding')
    expect(getPlanLimits(null).id).toBe('free')
  })
})

