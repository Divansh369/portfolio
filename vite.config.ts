import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadManifestMetadata() {
  try {
    const raw = readFileSync(resolve(__dirname, 'public/data/portfolio.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const profile = parsed?.profile || {};
    const hero = parsed?.hero || {};
    const fullName = String(profile.name || 'Developer').trim();
    const roleTitle = String(profile.title || 'Software Engineer').trim();
    const shortCandidate = String(parsed?.seo?.shortName || fullName.split(/\s+/)[0] || 'Portfolio').trim();

    return {
      name: `${fullName} — ${roleTitle}`,
      shortName: shortCandidate.slice(0, 12),
      description: String(
        profile.resumeSummary ||
          hero.lead ||
          'Interactive software engineering portfolio, architecture visualizations, and ATS Resume/CV studio.'
      ).slice(0, 220),
    };
  } catch {
    return {
      name: 'Developer Portfolio & ATS Resume Studio',
      shortName: 'Portfolio',
      description: 'Interactive software engineering portfolio, 3D systems viewport, and ATS Resume/CV studio.',
    };
  }
}

export default defineConfig(() => {
  const meta = loadManifestMetadata();

  return {
    base: process.env.VITE_BASE_URL || './',
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.svg',
          'icon.svg',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'og-card.png',
          'robots.txt',
          'sitemap.xml',
          'llms.txt',
          'llms-full.txt',
          'ai.txt',
        ],
        manifest: {
          id: '/',
          name: meta.name,
          short_name: meta.shortName,
          description: meta.description,
          theme_color: '#040b07',
          background_color: '#040b07',
          display: 'standalone',
          orientation: 'any',
          start_url: '/',
          scope: '/',
          categories: ['portfolio', 'developer', 'productivity'],
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
              name: '3D Architecture',
              short_name: '3D Lotus',
              url: '/#systems-3d',
            },
            {
              name: 'Projects',
              short_name: 'Projects',
              url: '/#projects',
            },
            {
              name: 'ATS Resume PDF',
              short_name: 'Resume',
              url: '/api/resume.pdf',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//, /^\/llms/, /^\/ai\.txt/, /^\/sitemap\.xml/, /^\/robots\.txt/],
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
            {
              urlPattern: /\/data\/.*\.(?:json|csv)$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'portfolio-data-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
