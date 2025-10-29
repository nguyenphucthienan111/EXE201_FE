import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// Plugin để tạo file spa-fallback cho Vercel
const spaFallback = () => ({
  name: "spa-fallback",
  closeBundle() {
    // Tạo file vercel.json trong dist với cấu hình SPA fallback
    const vercelConfig = {
      routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index.html" }],
    };
    fs.writeFileSync(
      "./dist/vercel.json",
      JSON.stringify(vercelConfig, null, 2)
    );
  },
});

export default defineConfig({
  plugins: [react(), spaFallback()],
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
    include: ["react-quill", "quill-blot-formatter", "quill-image-drop-and-paste"],
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
