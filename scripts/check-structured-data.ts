import { readdirSync, readFileSync } from "fs";
import { join } from "path";

// CI guard for structured data (schema.org JSON-LD).
//
// Walks the built site in dist/, extracts every
// `<script type="application/ld+json">` block, and fails the build if any is
// malformed or structurally unsound. This is an *offline* check — it verifies
// the markup we emit is well-formed and sane, NOT that Google will grant a rich
// result (Google's Rich Results Test has no CI API; that stays a manual/live
// check on the deployed URL — see the /structured-data skill).
//
// Per block it asserts:
//   - valid JSON (catches broken escaping / interpolation)
//   - top-level is an object, or an array of objects (a JSON-LD graph)
//   - each object carries "@context" pointing at schema.org and a "@type"
//   - no unresolved template leftovers ("undefined", "${...}", "[object Object]")
//
// Run after `npm run build` (needs dist/). Wired into CI and `npm run check:sd`.

const DIST_DIR = "dist";
const LD_JSON_RE = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Recursively collect every .html file under a directory. */
function htmlFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...htmlFiles(path));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

/** Walk every string in a JSON-LD value, flagging obviously unresolved output. */
function leftoverStrings(value: unknown): string[] {
  const bad: string[] = [];
  const visit = (node: unknown): void => {
    if (typeof node === "string") {
      if (node === "undefined" || node.includes("${") || node.includes("[object Object]")) {
        bad.push(node);
      }
    } else if (Array.isArray(node)) {
      node.forEach(visit);
    } else if (node && typeof node === "object") {
      Object.values(node).forEach(visit);
    }
  };
  visit(value);
  return bad;
}

/** Validate a single parsed JSON-LD node (one entry of a graph). Returns error strings. */
function validateNode(node: unknown): string[] {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return ["top-level JSON-LD must be an object or an array of objects"];
  }
  const errors: string[] = [];
  const record = node as Record<string, unknown>;
  const context = record["@context"];
  const hasSchemaContext = typeof context === "string" && context.includes("schema.org");
  if (!hasSchemaContext) {
    errors.push('missing or non-schema.org "@context"');
  }
  if (typeof record["@type"] !== "string" || record["@type"].length === 0) {
    errors.push('missing "@type"');
  }
  const leftovers = leftoverStrings(node);
  if (leftovers.length > 0) {
    errors.push(`unresolved value(s): ${leftovers.map((s) => JSON.stringify(s)).join(", ")}`);
  }
  return errors;
}

function main(): void {
  let files: string[];
  try {
    files = htmlFiles(DIST_DIR);
  } catch {
    console.error(`✖ ${DIST_DIR}/ not found — run \`npm run build\` first.`);
    process.exit(1);
  }

  const failures: string[] = [];
  let blockCount = 0;

  for (const file of files) {
    const html = readFileSync(file, "utf8");
    for (const match of html.matchAll(LD_JSON_RE)) {
      blockCount++;
      const raw = match[1].trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        failures.push(`${file}: invalid JSON in JSON-LD block — ${message}`);
        continue;
      }
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      if (nodes.length === 0) {
        failures.push(`${file}: empty JSON-LD graph`);
        continue;
      }
      for (const node of nodes) {
        for (const error of validateNode(node)) {
          failures.push(`${file}: ${error}`);
        }
      }
    }
  }

  if (failures.length > 0) {
    console.error(`✖ Structured data check failed (${failures.length} issue(s)):\n`);
    for (const failure of failures) console.error(`  • ${failure}`);
    process.exit(1);
  }

  console.log(
    `✓ Structured data OK — ${blockCount} JSON-LD block(s) across ${files.length} page(s) are valid.`,
  );
}

main();
