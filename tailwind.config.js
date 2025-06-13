/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        field: {
          green: '#4F7942',
          line: '#FFFFFF'
        }
      }
    },
  },
  plugins: [],
}