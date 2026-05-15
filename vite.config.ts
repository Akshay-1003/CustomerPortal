import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { VitePWA } from "vite-plugin-pwa"

const DEFAULT_API_BASE_URL = "http://35.172.1.180:5000/api/v1"

function resolveApiTarget(apiBaseUrl: string) {
  try {
    const url = new URL(apiBaseUrl)
    return {
      origin: url.origin,
      pathname: url.pathname.replace(/\/+$/, ""),
    }
  } catch {
    return {
      origin: "",
      pathname: "/api",
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiBaseUrl = env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
  const { origin: apiOrigin, pathname: apiPathname } = resolveApiTarget(apiBaseUrl)

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: false,
        includeAssets: [
          "icons/icon-192.png",
          "icons/icon-512.png",
          "icons/apple-touch-icon.png",
          "icons/maskable-icon-512.png",
        ],
        manifest: {
          name: "Vikramaditya Metrology Center",
          short_name: "VMC Portal",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "portrait",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          description: "Customer portal for calibration records and gauge status tracking",
          icons: [
            {
              src: "/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
            {
              src: "/icons/maskable-icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/icons/apple-touch-icon.png",
              sizes: "180x180",
              type: "image/png",
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}"],
          navigateFallback: "index.html",
          navigateFallbackDenylist: [
            /^\/api\//,
            /\/[^/?]+\.[^/]+$/,
          ],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => {
                if (apiOrigin && url.origin === apiOrigin && url.pathname.startsWith(apiPathname)) {
                  return true
                }

                return url.pathname.startsWith("/api/")
              },
              handler: "NetworkOnly",
              method: "GET",
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0", // Bind to all network interfaces
      port: 5174, // Your specified port
      strictPort: true, // Fail if port is already in use
    },
    preview: {
      host: "0.0.0.0", // Bind to all network interfaces for preview
      port: 5174, // Your specified port
      strictPort: true, // Fail if port is already in use
    },
  }
})
