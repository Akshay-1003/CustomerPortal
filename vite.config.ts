import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0', // Bind to all network interfaces
    port: 5174,       // Your specified port
    strictPort: true, // Fail if port is already in use
  },
  preview: {
    host: '0.0.0.0', // Bind to all network interfaces for preview
    port: 5174,       // Your specified port
    strictPort: true, // Fail if port is already in use
  },
})