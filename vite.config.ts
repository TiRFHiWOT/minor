import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // split admin pages
          admin: [
            "./src/pages/admin/AdminPage.tsx",
            "./src/pages/admin/AdminUsers.tsx",
            "./src/pages/admin/AdminContent.tsx",
            "./src/pages/admin/AdminModeration.tsx",
            "./src/pages/admin/AdminSpam.tsx",
            "./src/pages/admin/AdminSEO.tsx",
            "./src/pages/admin/AdminSettings.tsx",
            "./src/pages/admin/AdminBlog.tsx",
          ],
        },
      },
    },
  },
}));
