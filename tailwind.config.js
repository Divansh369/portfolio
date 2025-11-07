/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        card: 'var(--color-card)',
        border: 'var(--color-border)',
        text: {
          base: 'var(--color-text-base)',
          muted: 'var(--color-text-muted)',
          dark: 'var(--color-text-dark)',
        },
        accent: {
          400: 'var(--color-accent-400)',
          500: 'var(--color-accent-500)',
          600: 'var(--color-accent-600)',
          700: 'var(--color-accent-700)',
        },
        glow: 'var(--color-glow)',
      },
      animation: {
        'aurora-1': 'aurora 20s infinite linear',
        'aurora-2': 'aurora 25s infinite linear reverse',
        'aurora-3': 'aurora 30s infinite linear',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'pulse-live': 'pulseLive 2s infinite',
        'pulse-glow-hero': 'pulseGlowHero 3s infinite ease-in-out',
      },
      keyframes: {
        aurora: {
          '0%': { transform: 'rotate(0deg) scale(1.5) translateX(0%)' },
          '50%': { transform: 'rotate(180deg) scale(1.6) translateX(40%)' },
          '100%': { transform: 'rotate(360deg) scale(1.5) translateX(0%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseLive: {
          '0%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.7)' },
          '70%': { boxShadow: '0 0 0 10px rgba(34, 197, 94, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(34, 197, 94, 0)' },
        },
        pulseGlowHero: {
          '0%': { boxShadow: '0 0 0 0px var(--color-glow)' },
          '50%': { boxShadow: '0 0 20px 8px var(--color-glow)' },
          '100%': { boxShadow: '0 0 0 0px var(--color-glow)' },
        },
      },
    },
  },
  plugins: [],
}