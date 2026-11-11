import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'screenshot-mobile.png',
          'screenshot-desktop.png',
          'sw.js',
          'widget.json',
          'widget-data.json',
        ],
        manifest: {
          id: '/',
          name: 'Progressão de Acordes',
          short_name: 'Acordes',
          description: 'Gerador inteligente de progressões harmônicas, escalas e posições para violão e teclado.',
          lang: 'pt-BR',
          dir: 'ltr',
          theme_color: '#15171e',
          background_color: '#15171e',
          display: 'standalone',
          display_override: [
            'window-controls-overlay',
            'standalone',
            'minimal-ui',
            'browser',
          ],
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          categories: ['music', 'education', 'utilities'],
          iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
          prefer_related_applications: false,
          related_applications: [],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Nova Progressão',
              short_name: 'Nova',
              description: 'Criar uma nova progressão de acordes',
              url: '/?action=new',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Biblioteca de Favoritos',
              short_name: 'Favoritos',
              description: 'Abrir progressões salvas',
              url: '/?action=favorites',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Modo Teclado / Piano',
              short_name: 'Teclado',
              description: 'Visualizar posições e escalas no teclado',
              url: '/?instrument=piano',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
            {
              name: 'Modo Violão / Guitarra',
              short_name: 'Violão',
              description: 'Visualizar acordes e escalas no violão',
              url: '/?instrument=guitar',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
          ],
          screenshots: [
            {
              src: '/screenshot-mobile.png',
              sizes: '1080x1920',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Linha do tempo e sugestões inteligentes de acordes no celular',
            },
            {
              src: '/screenshot-desktop.png',
              sizes: '1920x1080',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Visualizador de escalas no braço da guitarra, teclado e melodia no computador',
            },
          ],
          share_target: {
            action: '/',
            method: 'GET',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
            },
          },
          file_handlers: [
            {
              action: '/',
              name: 'Progressão de Acordes Harmoniq',
              accept: {
                'application/json': ['.json'],
                'text/plain': ['.txt', '.chordpro'],
                'audio/midi': ['.mid', '.midi'],
              },
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
              launch_type: 'single-client',
            },
          ],
          launch_handler: {
            client_mode: ['navigate-existing', 'auto'],
          },
          protocol_handlers: [
            {
              protocol: 'web+harmoniq',
              url: '/?chord=%s',
            },
          ],
          edge_side_panel: {
            preferred_width: 400,
          },
          note_taking: {
            new_note_url: '/?action=new',
          },
          widgets: [
            {
              name: 'Harmoniq Mini',
              short_name: 'Harmoniq',
              description: 'Mini tocador e gerador de acordes',
              tag: 'harmoniq-widget',
              template: 'widget',
              ms_ac_template: 'widget.json',
              data: '/widget-data.json',
              type: 'application/json',
              screenshots: [
                {
                  src: '/screenshot-mobile.png',
                  sizes: '1080x1920',
                  label: 'Harmoniq Widget',
                },
              ],
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
              ],
            },
          ],
          scope_extensions: [
            {
              origin: 'https://ais-pre-bzkaakwrkykfw4fbruhv2k-432270563364.us-east5.run.app',
            },
            {
              origin: 'https://ais-dev-bzkaakwrkykfw4fbruhv2k-432270563364.us-east5.run.app',
            },
          ],
        } as any,
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
