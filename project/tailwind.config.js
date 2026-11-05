/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0e1a',
          900: '#0f1525',
          800: '#161d33',
          700: '#1f2845',
          600: '#2a3556',
          500: '#3a476e',
        },
        accent: {
          50: '#eefcfb',
          100: '#d3f7f4',
          200: '#a9eee9',
          300: '#6fddd4',
          400: '#34c5ba',
          500: '#16a99f',
          600: '#0d8a82',
          700: '#0e6f68',
          800: '#10574f',
          900: '#114741',
        },
        gold: {
          400: '#f5c451',
          500: '#e6a817',
          600: '#c4860c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
