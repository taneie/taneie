export default defineNuxtConfig({
  compatibilityDate: "2026-06-07",
  typescript: {
    strict: true,
    typeCheck: false
  },
  experimental: {
    appManifest: false
  },
  components: [
    {
      path: "~/components",
      pathPrefix: false
    }
  ],
  css: ["~/src/styles.css"],
  app: {
    baseURL: '/taneie/',
    head: {
      htmlAttrs: { lang: "ja" },
      title: "TRYANGLE FREELANCE",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" }
      ]
    }
  },
  ssr: false,

});
