import { existsSync, readFileSync, writeFileSync } from "fs";
import { site } from "../src/site.config.ts";
import { headerRules, type HeaderRule } from "../src/headers/headers.config.ts";

// Compiles src/headers/headers.config.ts into the header file for
// site.platform.deploy. Also runs before `npm run build`.

type Platform = "cloudflare" | "netlify" | "vercel" | "amplify";

interface EmitResult {
  output: string;
  count: number;
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(rules: HeaderRule[], errors: string[]): void {
  rules.forEach((rule, i) => {
    const where = `headerRules[${i}]`;
    if (!rule.source) errors.push(`${where}: missing "source" path pattern`);
    if (!rule.headers || Object.keys(rule.headers).length === 0) {
      errors.push(`${where} (${rule.source}): has no headers`);
    }
    for (const [name, value] of Object.entries(rule.headers ?? {})) {
      // A header value spanning lines would corrupt every artifact format.
      if (/[\r\n]/.test(value)) {
        errors.push(`${where} (${rule.source}): header "${name}" contains a newline`);
      }
    }
  });
}

// ── Emitters ──────────────────────────────────────────────────────────────────

// Cloudflare Pages and Netlify share the `_headers` format.
function emitHeadersFile(rules: HeaderRule[], platform: Platform): EmitResult {
  const output = "public/_headers";
  const header = [
    "# GENERATED FILE — do not edit by hand.",
    `# Source: src/headers/headers.config.ts  ·  Build: npm run build:headers  ·  Platform: ${platform}`,
    "# Format: a path pattern, then each header indented two spaces as `Name: value`.",
  ].join("\n");

  const blocks = rules.map((rule) => {
    const lines = Object.entries(rule.headers).map(([name, value]) => `  ${name}: ${value}`);
    return `${rule.source}\n${lines.join("\n")}`;
  });
  const body = blocks.length > 0 ? blocks.join("\n\n") : "# (no header rules defined yet)";
  writeFileSync(output, `${header}\n\n${body}\n`, "utf-8");
  return { output, count: rules.length };
}

// Merge into vercel.json, keeping other keys (e.g. `redirects` from generate-redirects.ts).
function emitVercelJson(rules: HeaderRule[]): EmitResult {
  const output = "vercel.json";
  const headers = rules.map((rule) => ({
    source: rule.source,
    headers: Object.entries(rule.headers).map(([key, value]) => ({ key, value })),
  }));

  let config: Record<string, unknown> = {};
  if (existsSync(output)) {
    try {
      config = JSON.parse(readFileSync(output, "utf-8"));
    } catch (error) {
      throw new Error(`Could not parse existing ${output}: ${(error as Error).message}`);
    }
  }
  config.headers = headers;
  writeFileSync(output, `${JSON.stringify(config, null, 2)}\n`, "utf-8");
  return { output, count: headers.length };
}

// Amplify has no committed-file convention: paste the output into its console or IaC.
function emitAmplifyJson(rules: HeaderRule[]): EmitResult {
  const output = "customHeaders.json";
  const entries = rules.map((rule) => ({
    pattern: rule.source,
    headers: Object.entries(rule.headers).map(([key, value]) => ({ key, value })),
  }));
  writeFileSync(output, `${JSON.stringify(entries, null, 2)}\n`, "utf-8");
  return { output, count: entries.length };
}

// Warn about files left from a previous platform (not vercel.json, which holds other config).
function warnStaleArtifacts(platform: Platform, warnings: string[]): void {
  const headersFileHost = platform === "cloudflare" || platform === "netlify";
  if (!headersFileHost && existsSync("public/_headers")) {
    warnings.push(
      `Stale public/_headers exists but platform is "${platform}" — delete it so it isn't deployed.`,
    );
  }
  if (platform !== "amplify" && existsSync("customHeaders.json")) {
    warnings.push(`Stale customHeaders.json exists but platform is "${platform}" — delete it.`);
  }
}

function main(): void {
  const platform = site.platform.deploy as Platform;
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

  console.log(
    `🧱 Building headers for platform "${platform}" from src/headers/headers.config.ts ...`,
  );

  const errors: string[] = [];
  validate(headerRules, errors);
  if (errors.length > 0) {
    console.error("❌ Header validation failed:");
    for (const error of errors) console.error(`   ${error}`);
    process.exit(1);
  }

  const warnings: string[] = [];
  let result: EmitResult;
  switch (platform) {
    case "cloudflare":
    case "netlify":
      result = emitHeadersFile(headerRules, platform);
      break;
    case "vercel":
      result = emitVercelJson(headerRules);
      break;
    case "amplify":
      result = emitAmplifyJson(headerRules);
      break;
  }

  warnStaleArtifacts(platform, warnings);
  for (const warning of warnings) console.warn(`⚠️  ${warning}`);

  console.log(`✅ Wrote ${result.output}`);
  console.log(
    `📊 ${result.count} header rule${result.count === 1 ? "" : "s"} from src/headers/headers.config.ts`,
  );
}

main();
