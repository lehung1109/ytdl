import { defineConfig, loadEnv } from "vite";

const index = process.argv.indexOf('--mode');

const mode = index && process.argv[index] || 'production';
const env = loadEnv(mode, __dirname);

const entryFileNames = (chunkInfo: { name: string; }) => {
  return 'assets/scripts/[name].js';
};

export default defineConfig({
  base: `${env.VITE_BASE_URL}`,
  build: {
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: [
        'index.html',
      ],
      output: {
        entryFileNames
      }
    }
  },
});
