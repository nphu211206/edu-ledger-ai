/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // Đảm bảo dòng này đã được bỏ comment!
  ],
  theme: {
    extend: {
      spacing: {
        // *** THÊM DÒNG NÀY ĐỂ TEST ***
        '18': '4.5rem', // 18 * 0.25rem = 4.5rem
        // *** KẾT THÚC DÒNG TEST ***
      }
      // Bạn có thể có các extend khác ở đây
    },
  },
  plugins: [],
};