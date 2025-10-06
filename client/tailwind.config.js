/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
       colors: {
        'primary': '#4F46E5',
        'primary-hover': '#4338CA',
        'secondary': '#10B981',
        'dark-bg': '#111827',
        'dark-card': '#1F2937',
        'dark-border': '#374151',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}