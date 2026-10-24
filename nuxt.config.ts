export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  // Désactivé : dépend de simple-git 3.x (failles critiques, correctif seulement en 4.x).
  // À réactiver quand @nuxt/devtools passera à simple-git 4.
  devtools: { enabled: false },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
  },
  routeRules: {
    // Admin rendue côté client uniquement : la session vit dans le navigateur.
    // L'en-tête serveur demande aux moteurs de recherche de ne pas l'indexer
    // (plus fiable qu'une balise <meta> ajoutée côté client).
    '/admin': { ssr: false, headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/api/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow', 'Cache-Control': 'no-store' } },
  },
  nitro: {
    vercel: {
      // Les fonctions tournent à Dublin, à côté de la base Supabase (eu-west-1, Irlande),
      // au lieu de Washington (iad1) par défaut : chaque lecture évite l'aller-retour Atlantique.
      functions: { regions: ['dub1'] },
    },
  },
  runtimeConfig: {
    public: {
      // Surchargées par NUXT_PUBLIC_SUPABASE_URL / NUXT_PUBLIC_SUPABASE_KEY
      supabaseUrl: '',
      supabaseKey: '',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Portfolio',
      meta: [
        // Thème clair uniquement, même si le système est en mode sombre.
        { name: 'color-scheme', content: 'light only' },
        { name: 'theme-color', content: '#fafafa' },
      ],
    },
  },
})
