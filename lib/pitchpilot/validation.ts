import { z } from 'zod'

export const agencyProfileSchema = z.object({
  agency_name: z.string().trim().min(1).max(120),
  agency_type: z.enum(['branding', 'design', 'web', 'marketing', 'other']),
  services: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  target_markets: z.array(z.string().trim().min(1).max(80)).min(1).max(12),
  ideal_client_description: z.string().trim().max(1000).default(''),
  preferred_outreach_channel: z.enum(['email', 'dm']),
  offer_description: z.string().trim().min(1).max(1000),
})

export const prospectSchema = z.object({
  business_name: z.string().trim().min(1).max(160),
  website_url: z.string().trim().max(2048).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  industry: z.string().trim().max(100).optional().or(z.literal('')),
  contact_name: z.string().trim().max(160).optional().or(z.literal('')),
  contact_email: z.string().trim().email().max(320).optional().or(z.literal('')),
  source: z.string().trim().max(100).optional(),
  status: z.enum(['new', 'researched', 'contacted', 'replied', 'meeting', 'won', 'lost']).optional(),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  next_follow_up_at: z.string().datetime().nullable().optional(),
})

export const analysisRequestSchema = z.object({
  prospect_id: z.uuid(),
  website_url: z.string().trim().min(1).max(2048),
})

export const findingsSchema = z.object({
  business_summary: z.string().trim().min(1).max(1200),
  observations: z.array(z.object({
    claim: z.string().trim().min(1).max(500),
    category: z.enum(['brand', 'website', 'content', 'product', 'marketing', 'opportunity']),
    evidence: z.string().trim().min(1).max(500),
    confidence: z.enum(['low', 'medium', 'high']),
    next_step: z.string().trim().min(1).max(500),
  })).min(1).max(8),
  suggested_services: z.array(z.string().trim().min(1).max(120)).max(8),
  outreach_email: z.object({
    subject: z.string().trim().min(1).max(180),
    body: z.string().trim().min(1).max(3000),
  }),
  outreach_dm: z.object({
    body: z.string().trim().min(1).max(1500),
  }),
  limitations: z.array(z.string().trim().min(1).max(300)).max(8),
})

export const draftUpdateSchema = z.object({
  subject: z.string().trim().max(180).nullable(),
  body: z.string().trim().min(1).max(3000),
  status: z.enum(['draft', 'copied', 'sent', 'replied', 'archived']).optional(),
})

export const activitySchema = z.object({
  prospect_id: z.uuid(),
  notes: z.string().trim().min(1).max(1000),
  due_at: z.string().datetime().nullable().optional(),
})

export type Findings = z.infer<typeof findingsSchema>
