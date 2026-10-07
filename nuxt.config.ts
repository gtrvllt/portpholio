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
        { name: 'theme-color', content: '#fafafa', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0a0a0a', media: '(prefers-color-scheme: dark)' },
      ],
    },
  },
})
