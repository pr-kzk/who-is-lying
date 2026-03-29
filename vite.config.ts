import type { ClientRequest } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

// .env を process.env に読み込む（Vite が proxy configure 時に参照できるよう）
try {
  const envPath = resolve(process.cwd(), ".env");
  const content = readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1 || line.trimStart().startsWith("#")) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    process.env[key] = val;
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
