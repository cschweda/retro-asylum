// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  ssr: true,

  nitro: {
    prerender: {
      crawlLinks: false,
      routes: ["/", "/sitemap.xml", "/robots.txt"],
      ignore: ["/admin"],
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
