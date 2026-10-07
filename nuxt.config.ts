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
    '/admin': { ssr: false },
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
