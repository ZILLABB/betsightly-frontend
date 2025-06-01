import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      // Optimize React production builds
      babel: {
        plugins: process.env.NODE_ENV === 'production' ? [
          ['babel-plugin-react-remove-properties', { properties: ['data-testid'] }]
        ] : [],
      },
    }),
  ],
  css: {
    devSourcemap: false,
  },
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        followRedirects: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);

            // Handle redirects by rewriting the location header
            if (proxyRes.statusCode === 307 || proxyRes.statusCode === 301 || proxyRes.statusCode === 302) {
              const location = proxyRes.headers.location;
              if (location && location.startsWith('http://localhost:8000/api/')) {
                // Rewrite the redirect to go through the proxy
                proxyRes.headers.location = location.replace('http://localhost:8000/api/', '/api/');
                console.log('Rewriting redirect location:', location, '->', proxyRes.headers.location);
              }
            }
          });
        },
      }
    }
  },
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // Build optimizations
  build: {
    sourcemap: process.env.NODE_ENV !== 'production',
    chunkSizeWarningLimit: 1000,
    // Optimize bundle splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', 'lucide-react'],
          // Utility chunks
          'utils': [
            './src/utils/validation',
            './src/utils/cacheUtils',
            './src/utils/errorTracking',
          ],
        },
      },
    },
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb
    cssCodeSplit: true,
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'lucide-react',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
  },
})
