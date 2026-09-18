const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const PRODUCTION_SECURITY_HEADERS = {
  'content-security-policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self'",
    "font-src 'self' https://fonts.gstatic.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: https:",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  ].join('; '),
  'referrer-policy': 'strict-origin-when-cross-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
};

export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', 'nuxt-auth-utils'],

  // Nitro only proxies the API; rendering stays in the browser to keep hydration out of the demo.
  ssr: false,

  devtools: { enabled: isDevelopment },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  colorMode: {
    preference: 'system',
    fallback: 'dark',
  },

  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7,
      cookie: {
        sameSite: 'lax',
        httpOnly: true,
        secure: isProduction,
      },
    },
  },

  routeRules: {
    ...(isProduction ? { '/**': { headers: PRODUCTION_SECURITY_HEADERS } } : {}),
    '/api/**': { headers: { 'cache-control': 'no-store' } },
  },

  experimental: {
    viewTransition: true,
  },
  compatibilityDate: '2026-08-27',

  typescript: {
    strict: true,
    typeCheck: false,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
  icon: {
    provider: 'server',
    fallbackToApi: false,
    serverBundle: {
      collections: ['lucide'],
    },
    clientBundle: {
      scan: true,
    },
  },
});
