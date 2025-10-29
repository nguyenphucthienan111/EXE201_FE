import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          quill: ["react-quill"],
          router: ["react-router-dom"],
          charts: ["recharts"],
          utils: ["axios", "html2pdf.js"],
        },
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
    target: "es2020",
    minify: "esbuild",
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ["react-quill"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000", // <-- PORT BE = 3000
        changeOrigin: true,
        secure: false,
        // nếu BE KHÔNG có prefix /api thì mở dòng dưới:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
