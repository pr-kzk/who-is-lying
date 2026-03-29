import type { ClientRequest } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// .env を process.env に読み込む（Vite が proxy configure 時に参照できるよう）
try {
  const lines = readFileSync(resolve(process.cwd(), ".env"), "utf8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = val;
    }
  }
} catch {
  // .env が存在しない場合は無視
}

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
      "/api/claude": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        rewrite: () => "/v1/messages",
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq: ClientRequest) => {
            proxyReq.setHeader("x-api-key", process.env["VITE_ANTHROPIC_API_KEY"] ?? "");
            proxyReq.setHeader("anthropic-version", "2023-06-01");
            proxyReq.setHeader("anthropic-dangerous-direct-browser-access", "true");
            proxyReq.setHeader("accept-encoding", "identity");
          });
        },
      },
      "/api/local": {
        target: process.env["VITE_LLM_BASE_URL"] || "http://192.168.3.20:1234",
        changeOrigin: true,
        rewrite: () => "/v1/chat/completions",
      },
    },
  },
});
