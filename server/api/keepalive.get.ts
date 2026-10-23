import { createClient } from '@supabase/supabase-js'
import type { Database } from '#shared/types/database.types'

// Appelé chaque jour par le cron Vercel (vercel.json). Une requête légère suffit
// à garder le projet Supabase actif : le plan gratuit le met en pause après 7 jours sans activité.
export default defineEventHandler(async (event) => {
  // Vercel envoie « Authorization: Bearer <CRON_SECRET> » quand la variable CRON_SECRET existe.
  // Si elle est définie, on refuse tout appel qui ne la présente pas.
  const secret = process.env.CRON_SECRET
  if (secret && getHeader(event, 'authorization') !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { supabaseUrl, supabaseKey } = useRuntimeConfig(event).public
  const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Lecture seule, soumise aux mêmes règles RLS que n'importe quel visiteur.
  const { error } = await supabase.from('photos').select('id', { count: 'exact', head: true })
  if (error) {
    throw createError({ statusCode: 502, statusMessage: 'Supabase unreachable' })
  }

  return { ok: true }
})
