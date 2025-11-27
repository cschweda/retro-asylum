// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  // SSR enabled for prerendering, but generates static site
  ssr: true,

  nitro: {
    prerender: {
      crawlLinks: true, // Crawl all links for static generation
      routes: ["/"],
    },
    output: {
      publicDir: ".output/public",
    },
  },

  modules: [
    "@nuxt/eslint",
    "@nuxt/hints",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxt/ui",
  ],
});
