/** @type {import('tailwindcss').Config} */
const containerQueries = require('@tailwindcss/container-queries');

module.exports = {
  darkMode: ['class'],
  content: [
    './public/index.html',
    './src/**/*.{js,jsx,ts,tsx}',
      './src/components/ui/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // 🔹 shadcn/ui ve senin komponentlerin beklediği genel tema anahtarları
      colors: {
     
        background: '#ffffff',
        foreground: '#0f172a',
        ring: '#2563eb', 
        primary: {
          DEFAULT: '#030213',         
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#f1f5f9',
          foreground: '#0f172a',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#e9ebef',          // sende zaten vardı
          foreground: '#0f172a',
        },
        popover: {
          DEFAULT: "#ffffff",           // arka plan rengi (şu an saydam)
          foreground: "#0f172a",        // metin rengi
        },
        input: {
          DEFAULT: "#e2e8f0",
          background: "#ffffff",
        },
        // 🔹 Card ve muted için eksik olan anahtarlar
        card: {
          DEFAULT: '#ffffff',
          foreground: '#0f172a',
        },
        muted: {
          DEFAULT: '#f1f5f9',
          foreground: '#64748b',
        },
        brand: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          400: '#94a3b8',
          500: '#64748b',
          600: '#334155',
          700: '#1e293b',
        },

        // 🔹 senin mevcut "inventory" ad alanın (aynen korunuyor)
        inventory: {
          bg: '#f4f4f6',
          panel: '#ffffff',
          primary: '#111111',
          text: {
            main: '#13141a',
            muted: '#70737f',
            soft: '#9a9dad',
          },
          border: {
            subtle: '#e0e0e3',
            strong: '#d0d0d5',
           
          },
        },
      },

      borderRadius: {
        'inventory-lg': '16px',
        'inventory-md': '12px',
        'inventory-pill': '999px',
          'xs': '0.125rem' ,
      },

      boxShadow: {
        inventory: '0 8px 24px rgba(15, 20, 35, 0.06)',
      },

      fontFamily: {
        inventory: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [
    containerQueries, 
    [require('tailwindcss-animate')]// @container desteği (CardHeader vb. için)
  ],
};
