/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#4F46E5',       // Màu xanh tím đậm (Indigo)
        'primary-hover': '#4338CA',
        'secondary': '#10B981',      // Màu xanh lá cây (Emerald)
        'dark-bg': '#111827',        // Màu nền chính (Gần như đen)
        'dark-card': '#1F2937',      // Màu nền cho các thẻ
        'dark-border': '#374151',    // Màu viền
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Sử dụng font Inter hiện đại
      }
    },
  },
  plugins: [],
}