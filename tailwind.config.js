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
        sidebar: '#1e1e2e',
        toolbar: '#16213e',
        accent: '#0f3460',
        highlight: '#e94560',
      },
    },
  },
  plugins: [],
}
