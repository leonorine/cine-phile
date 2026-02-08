export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System palette
        prussian: {
          DEFAULT: '#071429',
          dark: 'rgba(7, 20, 41, 0.8)',
          light: 'rgba(7, 20, 41, 0.6)',
        },
        teal: {
          DEFAULT: '#03b5aa',
          hover: 'rgba(3, 181, 170, 0.9)',
          active: 'rgba(3, 181, 170, 0.7)',
        },
        plum: {
          DEFAULT: '#7a306c',
        },
        gold: {
          DEFAULT: '#f8d071',
        },
        alabaster: {
          DEFAULT: '#ecebe8',
          secondary: 'rgba(236, 235, 232, 0.8)',
          tertiary: 'rgba(236, 235, 232, 0.6)',
          muted: 'rgba(236, 235, 232, 0.4)',
        },
        // Legacy colors for backwards compatibility
        brown: {
          700: '#8B6F47',
          600: '#A0825A',
          500: '#C9A961',
        },
        beige: {
          400: '#D4A574',
          300: '#E8C9A8',
        },
        dark: {
          900: '#071429',
          800: '#0D1D3A',
          700: '#162544',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        serif: ['Source Serif 4', 'serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(3, 181, 170, 0.2)',
        'glow-lg': '0 0 40px rgba(3, 181, 170, 0.25)',
      },
    },
  },
  plugins: [],
}
