import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const supabase = useSupabase()
  const user = useState<User | null>('auth-user', () => null)
  const ready = useState('auth-ready', () => false)

  async function init() {
    if (ready.value) return
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
    ready.value = true
  }

  // Renvoie un message d'erreur lisible, ou null si la connexion a réussi.
  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return null
    if (error.code === 'invalid_credentials') return 'Email ou mot de passe incorrect.'
    return error.message
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, ready, init, signIn, signOut }
}
