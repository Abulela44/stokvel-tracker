// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// The generated Cloud client uses literal bracket access for Vite variables.
// Vite only guarantees production replacement for direct property access, so
// normalize these two expressions without modifying the generated client.
const normalizeCloudClientEnv = {
  name: "normalize-cloud-client-env",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    if (!id.replaceAll("\\", "/").endsWith("/src/integrations/supabase/client.ts")) {
      return null;
    }

    return code
      .replaceAll("import.meta.env['VITE_SUPABASE_URL']", "import.meta.env.VITE_SUPABASE_URL")
      .replaceAll(
        "import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']",
        "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY",
      );
  },
};

export default defineConfig({
  vite: {
    plugins: [normalizeCloudClientEnv],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
