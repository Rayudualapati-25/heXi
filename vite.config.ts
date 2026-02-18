import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@ui': resolve(__dirname, './src/ui'),
      '@systems': resolve(__dirname, './src/systems'),
      '@entities': resolve(__dirname, './src/entities'),
      '@network': resolve(__dirname, './src/network'),
      '@modes': resolve(__dirname, './src/modes'),
      '@config': resolve(__dirname, './src/config'),
      '@types': resolve(__dirname, './src/types'),
      '@utils': resolve(__dirname, './src/utils'),
      '@lib': resolve(__dirname, './src/lib'),
      '@services': resolve(__dirname, './src/services'),
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['appwrite'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy Socket.io to the standalone server on port 3001
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
