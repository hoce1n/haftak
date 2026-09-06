import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tanstackStart({
      // Keep the custom server entry for SSR error handling.
      server: { entry: "server" },
    }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
});
