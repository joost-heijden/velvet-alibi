import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'manifest.json',
      includeAssets: ['assets/app-icon.png', 'assets/share-card.webp'],
      manifest: {
        name: 'Velvet Alibi',
        short_name: 'Velvet Alibi',
        description: 'Sudoku meets cozy crime. Los tactiele dossiers op met logica, hints en sharebare resultaten.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f4ead8',
        theme_color: '#7b2637',
        categories: ['games', 'entertainment', 'puzzle'],
        icons: [
          {
            src: '/assets/app-icon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        screenshots: [
          {
            src: '/assets/share-card.webp',
            sizes: '1280x731',
            type: 'image/webp',
            form_factor: 'wide',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,webp,svg,ico}'],
        globIgnores: ['**/mascot-concepts/**'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
