import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
    base: '/KraftyAR/',

    plugins: [
        tailwindcss()
    ],

    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                home: resolve(__dirname, 'home.html'),
                dashboard: resolve(__dirname, 'dashboard.html'),
            }
        }
    }
});