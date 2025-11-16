import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // IMPORTANT: Fix Rapier WASM loading & duplicate module issues
  resolve: {
    alias: {
      // Ensure only ONE copy of three is bundled
      three: path.resolve(__dirname, "node_modules/three"),
      // Force single copy of rapier wasm loader
      "@dimforge/rapier3d-compat": path.resolve(
        __dirname,
        "node_modules/@dimforge/rapier3d-compat"
      ),
    },
    dedupe: ["three", "@dimforge/rapier3d-compat", "@react-three/rapier"],
  },

  optimizeDeps: {
    // Don’t prebundle WASM → breaks Rapier
    exclude: ["@dimforge/rapier3d-compat"],
  },

  assetsInclude: ["**/*.wasm"], // allow WASM loading
});
