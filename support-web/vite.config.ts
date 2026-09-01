import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Dev server on 5174 so it does not collide with prisma-web (5173). */
const base = process.env.VITE_BASE || "/";

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port: 5174,
    strictPort: false,
  },
});
