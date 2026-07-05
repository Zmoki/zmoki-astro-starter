import { readdirSync } from "fs";
import { join } from "path";

// Shared dist/ walking used by the post-build CI guards (check-links,
// check-structured-data, check-sitemap) so the walk + route mapping lives once.

/** The build output directory these CI guards read. */
export const DIST_DIR = "dist";

/** Recursively collect every .html file under a directory (default: dist/). */
export function htmlFiles(dir: string = DIST_DIR): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...htmlFiles(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(path);
  }
  return files;
}

/** Map a dist/ .html file to the directory-format route it serves. */
export function routeForFile(file: string): string {
  const rel = file.slice(DIST_DIR.length).replace(/\\/g, "/");
  if (rel.endsWith("/index.html")) return rel.slice(0, -"index.html".length); // "/blog/foo/"
  return rel; // e.g. "/404.html"
}
