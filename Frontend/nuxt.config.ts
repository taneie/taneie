export default defineNuxtConfig({
  compatibilityDate: "2026-06-07",
  typescript: {
    strict: true,
    typeCheck: false,
  },
  experimental: {
    appManifest: false,
  },
  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  css: ["~/src/styles.css"],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || "/",
    head: {
      htmlAttrs: { lang: "ja" },
      title: "Freelink",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#1d5fd3" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "apple-touch-icon", href: "/brand/freelink-mark.svg" },
      ],
    },
  },
  ssr: true,

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:8787/api",
      resumeUploadMaxBytes: Number(
        process.env.NUXT_PUBLIC_RESUME_UPLOAD_MAX_BYTES || "10485760",
      ),
      showDemoLogin: process.env.NUXT_PUBLIC_SHOW_DEMO_LOGIN === "true",
    }
  },
});
