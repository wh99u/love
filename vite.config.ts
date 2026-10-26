import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  test: { environment: 'jsdom' },
});
