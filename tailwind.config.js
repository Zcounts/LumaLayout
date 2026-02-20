/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: '#1e1e2e',
          hover: '#2a2a3e',
          border: '#313145',
          text: '#cdd6f4',
          muted: '#6c7086',
        },
        toolbar: {
          bg: '#181825',
          border: '#313145',
          text: '#cdd6f4',
        },
        canvas: {
          bg: '#f8f9fa',
        },
        accent: {
          blueprint: '#3b82f6',
          lighting: '#f59e0b',
        },
      },
    },
  },
  plugins: [],
}
