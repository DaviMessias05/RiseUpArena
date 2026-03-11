import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Promise that resolves once INITIAL_SESSION fires (session restored + token refreshed).
let _resolveSessionReady
export const sessionReady = new Promise(resolve => { _resolveSessionReady = resolve })

supabase.auth.onAuthStateChange((event) => {
  if (event === 'INITIAL_SESSION') {
    _resolveSessionReady()
  }
})

// Safety: resolve after 5s even if INITIAL_SESSION never fires
setTimeout(_resolveSessionReady, 5000)
