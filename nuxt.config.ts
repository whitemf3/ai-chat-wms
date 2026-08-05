import { defineNuxtConfig } from 'nuxt/config';

const platform = process.env.NUXT_PLATFORM
const isEdgeOne = platform === 'edgeone'
const isCloudflare = platform === 'cloudflare'

export default defineNuxtConfig({
  compatibilityDate: '2024-01-01',
  devtools: { enabled: true },

  modules: ['@pinia/nuxt'],

  nitro: {
    ...(isCloudflare
      ? {
          preset: 'cloudflare-pages'
        }
      : {
          preset: 'static'
        })
  },


  ...(isEdgeOne
    ? {
        routeRules: {
          '/**': {
            prerender: true
          }
        }
      }
    : {}),

  app: {
    head: {
      title: 'AI Chat 后台管理',
      meta: [
        { name: 'description', content: 'AI Chat 后台管理系统' },
      ],
      link: [
        { rel: 'icon', href: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚙️</text></svg>' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8787',
    },
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    typeCheck: false,
  },
});