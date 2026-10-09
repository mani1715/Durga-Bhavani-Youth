/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans Telugu"', 'Gautami', '"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
        telugu: ['"Noto Sans Telugu"', 'Gautami', '"Segoe UI"', 'system-ui', '-apple-system', 'Roboto', 'sans-serif'],
      },
      lineHeight: {
        normal: '1.7',
        relaxed: '1.75',
        loose: '1.85',
      },
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Festival Orange Primary
          600: '#ea580c', // Hover
          700: '#c2410c', // Active
          800: '#9a3412',
          900: '#7c2d12',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981', // Emerald Success
          600: '#059669',
        }
      }
    },
  },
  plugins: [],
}
