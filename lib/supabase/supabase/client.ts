import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/supabase/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const USER_ID = process.env.NEXT_PUBLIC_USER_ID!