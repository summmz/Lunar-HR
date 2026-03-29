import { build } from "esbuild";

await build({
  entryPoints: ["server/_core/index.ts"],
  platform: "node",
  packages: "external",
  bundle: true,
  format: "esm",
  outdir: "dist",
  banner: {
    js: `
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
`,
  },
  define: {
    "import.meta.dirname": "__dirname",
    "import.meta.filename": "__filename",
  },
});

console.log("Server build complete → dist/index.js");
