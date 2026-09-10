import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    allowedHosts: [".monkeycode-ai.live"],
  },
  plugins: [
    tanstackStart({
      // Keep the custom server entry for SSR error handling.
      server: { entry: "server" },
    }),
    nitro(),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
