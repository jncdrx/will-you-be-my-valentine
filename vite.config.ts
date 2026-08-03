import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Use root '/' for Vercel / custom domain deployment, or VITE_BASE_PATH env if specified
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [
    react({
      // Use SWC-style fast refresh for faster HMR
      fastRefresh: true,
    }),
  ],
  build: {
    // Faster builds with esbuild minification
    minify: "esbuild",
    // Split chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          animations: ["framer-motion"],
        },
      },
    },
    // Enable source maps only in dev
    sourcemap: false,
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "framer-motion", "canvas-confetti", "lucide-react"],
  },
  server: {
    // Faster dev server startup
    warmup: {
      clientFiles: ["./src/App.tsx", "./src/components/*.tsx"],
    },
  },
});
