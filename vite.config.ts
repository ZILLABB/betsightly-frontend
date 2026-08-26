import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'BetSightly - Smart Betting Predictions',
        short_name: 'BetSightly',
        description: 'Smart betting predictions and analysis platform with AI-powered insights',
        theme_color: '#07100e',
        background_color: '#07100e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['sports', 'entertainment', 'productivity'],
        shortcuts: [
          {
            name: 'Predictions',
            short_name: 'Predictions',
            description: 'View latest predictions',
            url: '/predictions',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          },
          {
            name: 'Results',
            short_name: 'Results',
            description: 'Check results',
            url: '/results',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }]
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  css: {
    devSourcemap: false,
  },
  server: {
    port: 5180,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
    },
  },
  // Build options
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 1000,
  },
})
