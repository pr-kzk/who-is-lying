import type { ClientRequest } from "node:http";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
  },
  staged: {
    "*": "vp check --fix",
  },
  lint: { options: { typeAware: true, typeCheck: true } },
  server: {
    proxy: {
      "/api/chat": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: () => "/v1/messages",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq: ClientRequest) => {
            proxyReq.setHeader("x-api-key", process.env["VITE_ANTHROPIC_API_KEY"] ?? "");
            proxyReq.setHeader("anthropic-version", "2023-06-01");
          });
        },
      },
    },
  },
});
