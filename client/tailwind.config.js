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
        tabletop: {
          canvas: '#07100B',
          felt: '#0E291C',
          'felt-light': '#183626',
          wood: '#170E08',
          'wood-light': '#2E1C12',
          burgundy: '#3B0E14',
          navy: '#0C1829',
          ivory: '#F9F5EC',
          parchment: '#EDE6D6',
          gold: '#D4AF37',
          'gold-light': '#FCE794',
          'gold-dark': '#8A6818',
          brass: '#B58A30',
          leather: '#3A2016'
        }
      },
      fontFamily: {
        display: ['Cinzel Decorative', 'Cinzel', 'serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'tabletop-inlay': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(212, 175, 55, 0.15)',
        'gold-seal': '0 0 20px rgba(212, 175, 55, 0.35)',
        'wood-frame': '0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(212, 175, 55, 0.3)'
      }
    },
  },
  plugins: [],
}
