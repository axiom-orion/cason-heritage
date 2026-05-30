import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://cognigate.dev',
  trailingSlash: 'never',
  build: { format: 'file' }
});
