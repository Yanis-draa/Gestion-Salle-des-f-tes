/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#6366f1',
        'accent-2': '#818cf8',
        'bg-base': '#0f1117',
        'bg-2': '#161b27',
        'bg-3': '#1e2538',
        'bg-4': '#252d42',
      },
      fontFamily: {
        sans: ['Segoe UI', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
