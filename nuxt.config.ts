export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  typescript: {
    strict: true,
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Portfolio',
    },
  },
})
