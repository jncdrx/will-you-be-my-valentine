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
    warmup: {
      clientFiles: ["./src/App.tsx", "./src/components/*.tsx"],
    },
  },
});
