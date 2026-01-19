import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // === THÊM PHẦN NÀY ĐỂ CHỈ ĐỊNH CỔNG ===
  server: {
    port: 3001, // Chỉ định client sẽ chạy ở cổng 3001
  }
  // =====================================
})