/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        cream: { 50: '#FFFCF6', 100: '#FBF5EA', 200: '#F4EAD8', 300: '#E9DBC1' },
        ink: { DEFAULT: '#3B3350', soft: '#5E5673', muted: '#6F6784' },
        lavender: { 100: '#F1EBFC', 200: '#E3D8F8', 300: '#CDBBF1', 400: '#B39CE6', 600: '#7458BA' },
        peach: { 100: '#FFEEE3', 200: '#FFDCC7', 300: '#FFC6A3', 400: '#F9A682', 600: '#B4532D' },
      },
      keyframes: {
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
      },
      animation: {
        bob: 'bob 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
