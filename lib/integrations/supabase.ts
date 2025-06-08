import { createClient } from "@supabase/supabase-js"

// Database types (we'll expand these as we build the schema)
export interface Database {
  public: {
    Tables: {
      user_usage: {
        Row: {
          id: string
          clerk_user_id: string
          billing_period_start: string
          billing_period_end: string
          pages_consumed: number
          plan_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          billing_period_start: string
          billing_period_end: string
          pages_consumed?: number
          plan_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          billing_period_start?: string
          billing_period_end?: string
          pages_consumed?: number
          plan_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          clerk_user_id: string
          pages_processed: number
          file_name: string | null
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          pages_processed: number
          file_name?: string | null
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          pages_processed?: number
          file_name?: string | null
          file_size?: number | null
          created_at?: string
        }
      }
    }
  }
}

// Environment variable validation
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable")
  }

  return { supabaseUrl, supabaseAnonKey }
}

// Client-side Supabase client (uses anon key)
const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig()
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (uses service role key for admin operations)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable")
  }

  if (!supabaseServiceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable")
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
