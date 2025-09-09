import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    codeInspectorPlugin({
      bundler: 'vite',
      editor: 'cursor',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true, // 或者使用 '0.0.0.0' 来监听所有网络接口
    port: 5173, // 改回 5173 端口
    open: false,
    // 只在开发环境使用代理
    proxy: {
      '/api': {
        target: 'http://192.168.1.2:3001', // 生产
        // target: 'http://192.168.1.2:8080', // 开发
        changeOrigin: true,
        secure: false, // 如果是 HTTPS 且证书有问题，设置为 false
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
}));
