/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canvas — warm porcelain ivory & toasted linen sections
        cream: 'rgb(var(--cream) / <alpha-value>)',
        linen: 'rgb(var(--linen) / <alpha-value>)',
        // Card / input surface
        surface: 'rgb(var(--surface) / <alpha-value>)',
        // Primary — rich terracotta for CTAs / headings
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
        },
        // Secondary — warm sand (soft fills, tags)
        sage: 'rgb(var(--sage) / <alpha-value>)',
        // Accent — champagne bronze for premium badges, ratings, featured labels
        accent: 'rgb(var(--accent) / <alpha-value>)',
        // Deeper bronze for text on light surfaces (readable ratings, labels)
        accentDark: 'rgb(var(--accent-dark) / <alpha-value>)',
        // Semantic
        success: 'rgb(var(--success) / <alpha-value>)',
        successDark: 'rgb(var(--success-dark) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        // Text
        ink: 'rgb(var(--ink) / <alpha-value>)',   // headings
        body: 'rgb(var(--body) / <alpha-value>)', // body copy
        // Border / divider
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      fontFamily: {
        heading: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '24px',
        input: '16px',
        image: '20px',
      },
      boxShadow: {
        soft: '0 2px 12px rgba(35, 35, 35, 0.05)',
        card: '0 12px 32px rgba(35, 35, 35, 0.06)',
        'card-hover': '0 24px 48px rgba(35, 35, 35, 0.12)',
        glow: '0 10px 36px rgba(201, 164, 106, 0.38)',
        'glow-brand': '0 10px 36px rgba(184, 92, 56, 0.30)',
        glass: '0 8px 32px rgba(35, 35, 35, 0.10)',
        dark: '0 18px 48px rgba(0, 0, 0, 0.45)',
      },
      maxWidth: {
        container: '1280px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.21, 1.02, 0.73, 1) both',
        float: 'float 5s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 1s infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
        'spin-slow': 'spin-slow 22s linear infinite',
      },
    },
  },
  plugins: [],
}
