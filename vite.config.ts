import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    watch: {
      ignored: [
        '**/server*.ts',
        '**/server-main.ts',
        '**/package.json',
        '**/agents/**',
        '**/dist/**',
        '**/.git/**',
        '**/.env*'
      ]
    }
  },
  build: {
    chunkSizeWarningLimit: 1600
  }
});
