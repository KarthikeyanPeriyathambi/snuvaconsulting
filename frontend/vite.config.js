import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  server: {
    port: 5173,
  },
  define: {
    'process.env': {
      VITE_BACKEND_URL: JSON.stringify(process.env.VITE_BACKEND_URL || 'http://localhost:5000'),
    },
  },
});