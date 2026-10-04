export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
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
    },
  },
})
