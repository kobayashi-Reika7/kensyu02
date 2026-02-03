import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // 開発サーバーのポートを 5100 に統一。5173 / 5174 を使わないため、
    // port を 5100 に固定し strictPort: true にすることで、
    // 5100 が使用中の場合に Vite が 5173 や 5174 へフォールバックせず、
    // 5100 で起動するかエラーで終了するようになる。
    port: 5100,
    strictPort: true,
    open: true,
  },
})
