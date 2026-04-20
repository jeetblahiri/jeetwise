import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const basePath = command === 'serve' ? '/' : env.VITE_BASE_PATH || '/jeetwise/';

  return {
    base: basePath,
    plugins: [react(), viteSingleFile()],
    build: {
      rollupOptions: {
        output: {},
      },
    },
  };
});
