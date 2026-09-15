// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const cloudUrl =
  process.env["VITE_SUPABASE_URL"] ??
  process.env["SUPABASE_URL"] ??
  "https://fjjfcnevxaihiwmnhafp.supabase.co";
const cloudPublishableKey =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
  process.env["SUPABASE_PUBLISHABLE_KEY"] ??
  "sb_publishable_j7TVQFsAr6XdQebSSBG8Ig_gVcZje_g";

// The generated Cloud client uses bracket access for Vite variables, which is
// not reliably substituted in production. Inline these public browser values
// without modifying the generated integration file.
const normalizeCloudClientEnv = {
  name: "normalize-cloud-client-env",
  enforce: "pre" as const,
  transform(code: string, id: string) {
    const cleanId = id.split("?", 1)[0]?.replaceAll("\\", "/");
    if (!cleanId?.endsWith("/src/integrations/supabase/client.ts")) {
      return null;
    }

    return code
      .replaceAll("import.meta.env['VITE_SUPABASE_URL']", JSON.stringify(cloudUrl))
      .replaceAll(
        "import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY']",
        JSON.stringify(cloudPublishableKey),
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
