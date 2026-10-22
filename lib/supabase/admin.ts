import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/**
 * Service-role Supabase client for server-side operations that bypass RLS,
 * such as activating a paid plan after a Paystack webhook or callback.
 * Never expose this client or its key to the browser.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

