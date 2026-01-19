/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      spacing: {
        //  DÒNG NÀY ĐỂ TEST ***
        '18': '4.5rem', // 18 * 0.25rem = 4.5rem
        // *** KẾT THÚC DÒNG TEST ***
      }
      
    },
  },
  plugins: [],
};