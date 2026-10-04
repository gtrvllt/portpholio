import { createClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.types'

// Client unique de l'app, exposé via useSupabase().
// Côté serveur (SSR), pas de session : lecture publique uniquement.
export default defineNuxtPlugin(() => {
  const { supabaseUrl, supabaseKey } = useRuntimeConfig().public

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('NUXT_PUBLIC_SUPABASE_URL et NUXT_PUBLIC_SUPABASE_KEY doivent être définies')
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: import.meta.client,
      autoRefreshToken: import.meta.client,
      detectSessionInUrl: false,
    },
  })

  return { provide: { supabase } }
})
