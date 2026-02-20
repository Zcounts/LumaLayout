/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'blueprint': '#1e3a5f',
        'blueprint-accent': '#3b82f6',
      }
    },
  },
  plugins: [],
}
