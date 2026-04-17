/// <reference types="vite/client" />

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
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
    /**
     * Только в `vite dev`. В `vite preview` (Railway) прокси на 127.0.0.1:8000 даёт ECONNREFUSED и 500 на /api, /health.
     */
    proxy:
      mode === 'development'
        ? {
            '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
            '/health': { target: 'http://127.0.0.1:8000', changeOrigin: true },
          }
        : undefined,
  },
  /** `vite preview` на Railway / других PaaS — иначе «Blocked request: host is not allowed». */
  preview: {
    host: true,
    allowedHosts: true,
  },
}));
