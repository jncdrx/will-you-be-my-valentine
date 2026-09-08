import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base path ensures asset links work across all hostings & Vercel
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src/angelflix"),
    },
  },
  plugins: [
    react({
      fastRefresh: true,
    }),
  ],
  build: {
    minify: "esbuild",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        folioSync: path.resolve(__dirname, 'folio-sync.html'),
      },
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          animations: ["framer-motion"],
        },
      },
    },
    sourcemap: false,
  },
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion", "canvas-confetti", "lucide-react"],
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
        // Keep SSE connections alive without timeout
        configure: (proxy) => {
          proxy.on("proxyReq", (_proxyReq, req) => {
            if (req.url?.includes("/api/music/convert")) {
              // Remove timeout for SSE streaming requests
              req.setTimeout(0);
            }
          });
        },
      },
    },
    warmup: {
      clientFiles: ["./src/App.tsx", "./src/components/*.tsx"],
    },
  },
});
