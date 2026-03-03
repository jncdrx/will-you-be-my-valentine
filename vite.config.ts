import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/will-you-be-my-valentine",
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
