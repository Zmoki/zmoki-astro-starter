import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { site } from "../src/site.config.ts";

// Compiles the CSV files in src/redirects/ into the redirect artifact for the
// configured hosting platform (site.deploy.platform). The CSVs are the
// platform-neutral source of truth; each emitter below renders their format.
//
// Each CSV has the columns: source,destination,code — one redirect per row.
// Blank lines and lines starting with "#" are ignored. `code` is optional
// (defaults to 301). Run via `npm run build:redirects`; also runs automatically
// before `npm run build`.

const REDIRECTS_DIR = "src/redirects";
const VALID_CODES = new Set(["200", "301", "302", "303", "307", "308"]);
const DEFAULT_CODE = "301";

type Platform = "cloudflare" | "netlify" | "vercel" | "amplify";

interface Redirect {
  source: string;
  destination: string;
  code: string;
}

interface FileSection {
  file: string;
  rows: Redirect[];
}

// Per-platform ceiling on the number of redirects the artifact may hold.
// null = no meaningful hard cap (bound by file size / soft guidance instead).
const PLATFORM_LIMITS: Record<Platform, { max: number; note: string } | null> = {
  cloudflare: {
    max: 2100,
    note: "2,000 static + 100 dynamic; Cloudflare silently drops rules past the cap. Beyond this, use Bulk Redirects.",
  },
  netlify: null, // bound by serialized file size, not a rule count
  vercel: {
    max: 1024,
    note: "shared across redirects + rewrites + headers in vercel.json. Beyond this, use Edge Middleware + Edge Config.",
  },
  amplify: null, // no documented hard quota
};

// Warn as the count nears the cap; the build fails once it exceeds it.
const LIMIT_WARN_RATIO = 0.9;

interface EmitResult {
  output: string;
  count: number; // redirects actually written to the artifact
}

// Split a single CSV line into fields, honoring double-quoted values.
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

// Parse one CSV file into redirect rows, collecting any validation errors.
function parseRedirectsCsv(fileName: string, content: string, errors: string[]): Redirect[] {
  const rows: Redirect[] = [];
  const lines = content.split(/\r?\n/);

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;

    const [source, destination, codeRaw] = parseCsvLine(raw);

    // Skip the header row.
    if (source === "source" && destination === "destination") return;

    const where = `${fileName}:${index + 1}`;

    if (!source || !destination) {
      errors.push(
        `${where}: each row needs both a "source" and a "destination" (got: ${raw.trim()})`,
      );
      return;
    }

    const code = codeRaw || DEFAULT_CODE;
    if (!VALID_CODES.has(code)) {
      errors.push(`${where}: invalid code "${code}" (allowed: ${[...VALID_CODES].join(", ")})`);
      return;
    }

    rows.push({ source, destination, code });
  });

  return rows;
}

// ── Emitters ────────────────────────────────────────────────────────────────
// Each returns the path it wrote so the caller can report and warn about stale
// artifacts from other platforms.

// Cloudflare Pages and Netlify share the exact `_redirects` format.
function emitRedirectsFile(sections: FileSection[], platform: Platform): EmitResult {
  const output = "public/_redirects";
  const header = [
    "# GENERATED FILE — do not edit by hand.",
    `# Source: src/redirects/*.csv  ·  Build: npm run build:redirects  ·  Platform: ${platform}`,
    "# Format: <from> <to> <status>",
  ].join("\n");

  const blocks = sections.map(
    (s) => `# ${s.file}\n${s.rows.map((r) => `${r.source} ${r.destination} ${r.code}`).join("\n")}`,
  );
  const body = blocks.length > 0 ? blocks.join("\n\n") : "# (no redirects defined yet)";
  writeFileSync(output, `${header}\n\n${body}\n`, "utf-8");
  return { output, count: sections.reduce((n, s) => n + s.rows.length, 0) };
}

// Vercel: merge a `redirects` array into vercel.json, preserving other config.
// Vercel redirects are 3xx only; a 200 (proxy/rewrite) belongs in `rewrites`.
function emitVercelJson(rows: Redirect[], warnings: string[]): EmitResult {
  const output = "vercel.json";
  const VERCEL_CODES = new Set(["301", "302", "307", "308"]);

  const redirects = rows
    .filter((r) => {
      if (!VERCEL_CODES.has(r.code)) {
        warnings.push(
          `Vercel supports redirect codes 301/302/307/308 — skipped "${r.source}" (code ${r.code}); use a Vercel rewrite instead.`,
        );
        return false;
      }
      return true;
    })
    .map((r) => ({ source: r.source, destination: r.destination, statusCode: Number(r.code) }));

  let config: Record<string, unknown> = {};
  if (existsSync(output)) {
    try {
      config = JSON.parse(readFileSync(output, "utf-8"));
    } catch (error) {
      throw new Error(`Could not parse existing ${output}: ${(error as Error).message}`);
    }
  }
  config.redirects = redirects;
  writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
  return { output, count: redirects.length };
}

// AWS Amplify: emit redirects.json ([{ source, target, status }]) to paste into
// the Amplify console or manage via IaC. Amplify has no committed-file convention.
function emitAmplifyJson(rows: Redirect[]): EmitResult {
  const output = "redirects.json";
  const entries = rows.map((r) => ({ source: r.source, target: r.destination, status: r.code }));
  writeFileSync(output, `${JSON.stringify(entries, null, 2)}\n`, "utf-8");
  return { output, count: entries.length };
}

// Warn as the redirect count nears the platform's cap; return a fatal message if
// it exceeds it (the caller fails the build). Platforms with no hard cap pass.
function checkPlatformLimit(platform: Platform, count: number, warnings: string[]): string | null {
  const limit = PLATFORM_LIMITS[platform];
  if (!limit) return null;
  if (count > limit.max) {
    return `${count} redirects exceeds ${platform}'s limit of ${limit.max} (${limit.note})`;
  }
  if (count >= Math.floor(limit.max * LIMIT_WARN_RATIO)) {
    warnings.push(
      `Approaching ${platform}'s ${limit.max}-redirect limit: ${count}/${limit.max} (${limit.note})`,
    );
  }
  return null;
}

// Warn if artifacts from other platforms are still lying around after a switch.
// Only flags files that exist *solely* to hold redirects (not vercel.json, which
// legitimately holds other config).
function warnStaleArtifacts(platform: Platform, warnings: string[]): void {
  const redirectsOnlyForCf = platform === "cloudflare" || platform === "netlify";
  if (!redirectsOnlyForCf && existsSync("public/_redirects")) {
    warnings.push(
      `Stale public/_redirects exists but platform is "${platform}" — delete it so it isn't deployed.`,
    );
  }
  if (platform !== "amplify" && existsSync("redirects.json")) {
    warnings.push(`Stale redirects.json exists but platform is "${platform}" — delete it.`);
  }
}

function main(): void {
  const platform = site.deploy.platform as Platform;
  const emitters: Record<Platform, true> = {
    cloudflare: true,
    netlify: true,
    vercel: true,
    amplify: true,
  };
  if (!emitters[platform]) {
    console.error(
      `❌ Unknown deploy platform "${platform}" in site.config.ts. ` +
        `Expected one of: ${Object.keys(emitters).join(", ")}.`,
    );
    process.exit(1);
  }

  console.log(`🔀 Building redirects for platform "${platform}" from src/redirects/*.csv ...`);

  const csvFiles = existsSync(REDIRECTS_DIR)
    ? readdirSync(REDIRECTS_DIR)
        .filter((file) => file.endsWith(".csv"))
        .sort()
    : [];

  const errors: string[] = [];
  const sections: FileSection[] = [];

  for (const file of csvFiles) {
    const content = readFileSync(join(REDIRECTS_DIR, file), "utf-8");
    const rows = parseRedirectsCsv(file, content, errors);
    if (rows.length > 0) sections.push({ file, rows });
  }

  if (errors.length > 0) {
    console.error("❌ Redirect validation failed:");
    for (const error of errors) console.error(`   ${error}`);
    process.exit(1);
  }

  const allRows = sections.flatMap((s) => s.rows);
  const warnings: string[] = [];

  let result: EmitResult;
  switch (platform) {
    case "cloudflare":
    case "netlify":
      result = emitRedirectsFile(sections, platform);
      break;
    case "vercel":
      result = emitVercelJson(allRows, warnings);
      break;
    case "amplify":
      result = emitAmplifyJson(allRows);
      break;
  }

  warnStaleArtifacts(platform, warnings);
  const limitError = checkPlatformLimit(platform, result.count, warnings);
  for (const warning of warnings) console.warn(`⚠️  ${warning}`);

  if (limitError) {
    console.error(`❌ ${limitError}`);
    process.exit(1);
  }

  console.log(`✅ Wrote ${result.output}`);
  console.log(
    `📊 ${result.count} redirect${result.count === 1 ? "" : "s"} from ${csvFiles.length} file(s)`,
  );
}

main();
