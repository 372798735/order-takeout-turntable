import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // 或者使用 '0.0.0.0' 来监听所有网络接口
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://47.113.179.233:8090',
        changeOrigin: true,
      },
    },
  },
});
