/// <reference types="vite/client" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // localhost и 127.0.0.1; иначе в браузере «белый экран» при обращении к «другому» хосту
    host: true,
    port: 5173,
    /** Если 5173 занят старым процессом — не молча переключаться на 5174 (браузер всё ещё на 5173). */
    strictPort: true,
    proxy: {
      // В dev запросы на тот же origin (5173) → прокси на FastAPI без CORS и без жёсткой привязки к 127.0.0.1 в браузере.
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/health': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
});
