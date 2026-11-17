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
      // 本地默认对接 wrangler dev（端口与 worker/wrangler.toml [dev].port 一致）；
      // 生产由 NUXT_PUBLIC_API_BASE 环境变量注入（Cloudflare Pages 构建配置）
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8790',
    },
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    typeCheck: false,
  },
});