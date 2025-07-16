import { createClient } from "@supabase/supabase-js"

// Database types (we'll expand these as we build the schema)
export interface Database {
  public: {
    Tables: {
      user_usage: {
        Row: {
          id: string
          user_id: string
          billing_period_start: string
          billing_period_end: string
          pages_consumed: number
          plan_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          billing_period_start: string
          billing_period_end: string
          pages_consumed?: number
          plan_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
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
          user_id: string
          pages_processed: number
          file_name: string | null
          file_size: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          pages_processed: number
          file_name?: string | null
          file_size?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          pages_processed?: number
          file_name?: string | null
          file_size?: number | null
          created_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          // Legacy billing provider columns (will be removed in future migration)
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          paddle_transaction_id: string | null
          // Polar billing provider columns
          polar_customer_id: string | null
          polar_subscription_id: string | null
          polar_product_id: string | null
          plan_type: "free" | "paid1" | "paid2"
          status:
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "trialing"
            | "unpaid"
            | "inactive"
          current_period_start: string | null
          current_period_end: string | null
          canceled_at: string | null
          migration_status: "pending" | "migrating" | "completed" | "failed"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          // Legacy billing provider columns (optional for new records)
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          // Polar billing provider columns
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          polar_product_id?: string | null
          plan_type: "free" | "paid1" | "paid2"
          status:
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "trialing"
            | "unpaid"
            | "inactive"
          current_period_start?: string | null
          current_period_end?: string | null
          canceled_at?: string | null
          migration_status?: "pending" | "migrating" | "completed" | "failed"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          // Legacy billing provider columns
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          paddle_transaction_id?: string | null
          // Polar billing provider columns
          polar_customer_id?: string | null
          polar_subscription_id?: string | null
          polar_product_id?: string | null
          plan_type?: "free" | "paid1" | "paid2"
          status?:
            | "active"
            | "canceled"
            | "incomplete"
            | "incomplete_expired"
            | "past_due"
            | "trialing"
            | "unpaid"
            | "inactive"
          current_period_start?: string | null
          current_period_end?: string | null
          canceled_at?: string | null
          migration_status?: "pending" | "migrating" | "completed" | "failed"
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Server-side Supabase client (server-only environment variables)
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL environment variable")
  }

  if (!supabaseAnonKey) {
    throw new Error("Missing SUPABASE_ANON_KEY environment variable")
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
