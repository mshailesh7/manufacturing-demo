/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Custom Violet-Indigo Accent
          600: '#7c3aed', // Royal Violet-Indigo Brand Color
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        slate: {
          950: '#070a13', // Deep Obsidian Space Black
        }
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 24px -2px rgba(0, 0, 0, 0.03), 0 2px 10px -1px rgba(0, 0, 0, 0.02)',
        'premium-hover': '0 16px 40px -4px rgba(99, 102, 241, 0.08), 0 4px 16px -2px rgba(99, 102, 241, 0.04)',
        'dark-premium': '0 8px 30px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
        'glow-primary': '0 0 20px 2px rgba(124, 58, 237, 0.08)',
        'glow-primary-hover': '0 0 30px 4px rgba(124, 58, 237, 0.15)',
      }
    },
  },
  plugins: [],
}
