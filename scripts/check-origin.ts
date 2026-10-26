import { existsSync, readdirSync, readFileSync } from "fs";
import { extname, join } from "path";
import { site } from "../src/site.config.ts";
import { DIST_DIR } from "./lib/dist-files.ts";

// CI guard over dist/ (run after `npm run build`): the image origin
// (site.platform.imagesCDNHost) appears in no built file. Pages, JSON-LD, the
// sitemap, the feed and the CSP must all point at renditions under /_astro.
// See src/lib/images.ts.

// Encoded images and fonts can't contain a URL worth reporting; everything else is read as text.
const BINARY = new Set([
  ".avif",
  ".webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".woff",
  ".woff2",
  ".pdf",
]);

function textFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...textFiles(path));
    else if (entry.isFile() && !BINARY.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

function main(): void {
  const origin = (site.platform.imagesCDNHost || "").trim();
  if (!origin) {
    console.log("✓ No image origin set (site.platform.imagesCDNHost is empty); nothing to check.");
    return;
  }
  if (!existsSync(DIST_DIR)) {
    console.error(`✖ ${DIST_DIR}/ not found — run \`npm run build\` first.`);
    process.exit(1);
  }

  // The bare hostname also catches escaped forms such as https:\/\/host in JSON.
  const host = new URL(origin).host;
  const leaks: string[] = [];
  for (const file of textFiles(DIST_DIR)) {
    const text = readFileSync(file, "utf8");
    let at = text.indexOf(host);
    while (at !== -1) {
      leaks.push(
        `  ${file}: …${text.slice(Math.max(0, at - 60), at + host.length + 40).replace(/\s+/g, " ")}…`,
      );
      at = text.indexOf(host, at + host.length);
    }
  }

  if (leaks.length) {
    console.error(`✖ The image origin ${host} is published in ${leaks.length} place(s):`);
    console.error(leaks.join("\n"));
    console.error("\nHand out image URLs through publishedImageUrl (src/lib/images.ts) instead.");
    process.exit(1);
  }
  console.log(`✓ Image origin ${host} appears nowhere in ${DIST_DIR}/.`);
}

main();
