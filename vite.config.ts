import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { allowedHosts: ["vcn-tokyo-main.tail4c0963.ts.net"] },
  preview: { allowedHosts: ["vcn-tokyo-main.tail4c0963.ts.net"] },
  plugins: [tailwindcss()],
  lint: {
    options: { typeAware: false },
    rules: { "max-lines": ["error", { max: 350, skipBlankLines: true, skipComments: true }] },
  },
  test: { include: ["src/**/*.test.ts"] },
});
