import type { ClientRequest, IncomingMessage } from "node:http";
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
            const apiKey = process.env["VITE_ANTHROPIC_API_KEY"] ?? "";
            console.log(
              "[proxy] proxyReq fired, key length:",
              apiKey.length,
              "first 10:",
              apiKey.substring(0, 10),
            );
            proxyReq.setHeader("x-api-key", apiKey);
            proxyReq.setHeader("anthropic-version", "2023-06-01");
            proxyReq.setHeader("anthropic-dangerous-direct-browser-access", "true");
            proxyReq.setHeader("accept-encoding", "identity");
          });
          proxy.on("proxyRes", (proxyRes: IncomingMessage) => {
            console.log("[proxy] proxyRes status:", proxyRes.statusCode);
            if (proxyRes.statusCode === 401) {
              let body = "";
              proxyRes.on("data", (chunk: Buffer) => {
                body += chunk.toString();
              });
              proxyRes.on("end", () => {
                console.log("[proxy] 401 body:", body);
              });
            }
          });
        },
      },
    },
  },
});
