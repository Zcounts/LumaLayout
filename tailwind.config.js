/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1a1b1e',
          hover: '#2c2d31',
          active: '#3a3b40',
          border: '#3a3b40',
          text: '#e4e5e7',
          muted: '#888a8e',
        },
        toolbar: {
          bg: '#1e1f23',
          border: '#3a3b40',
        },
        blueprint: {
          accent: '#4f96ff',
          light: '#a8c4ff',
        },
        lighting: {
          accent: '#f59e0b',
          light: '#fcd34d',
        },
      },
    },
  },
  plugins: [],
}
