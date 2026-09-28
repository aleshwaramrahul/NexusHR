/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5', // Primary Stitch color
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          primary: '#4f46e5',
          secondary: '#505f76',
          tertiary: '#005338',
          accent: '#10b981',
          background: '#f7f9fb',
          surface: '#ffffff',
          surfaceDim: '#d8dadc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(100, 116, 139, 0.08)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      }
    },
  },
  plugins: [],
}
