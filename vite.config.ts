import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base path ensures asset links work across all hostings & Vercel
  base: "./",
  plugins: [
    react({
      fastRefresh: true,
    }),
  ],
  build: {
    minify: "esbuild",
    rollupOptions: {
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
