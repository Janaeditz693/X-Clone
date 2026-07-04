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
        brand: {
          blue: '#1d9bf0',
          blueHover: '#1a8cd8',
          border: '#eff3f4',
          darkBorder: '#2f3336',
          bg: '#ffffff',
          darkBg: '#000000',
          darkBgLight: '#16181c',
          text: '#0f1419',
          darkText: '#e7e9ea',
          muted: '#536471',
          darkMuted: '#71767b'
        }
      }
    },
  },
  plugins: [],
}
