import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact(), tailwindcss()],
  clearScreen: false,
  build: {
    outDir: '../api/assets/ui',
    emptyOutDir: true,
    cssCodeSplit: false,
    manifest: false,
    sourcemap: false,
    lib: {
      entry: ['src/main.tsx'],
      name: 'index',
      formats: ['umd'],
      fileName: () => `index.js`,
    },
    rollupOptions: {
      output: {
        assetFileNames: 'styles.css',
      }
    }
  }

})
