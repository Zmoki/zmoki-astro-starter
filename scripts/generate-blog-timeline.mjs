import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

// Writes blog-timeline.csv: each post's publish, modified and git-commit dates.

const BLOG_DIR = "src/content/blog";
const SITE_URL = "https://starter.zmoki.xyz";
const OUTPUT_FILE = "blog-timeline.csv";

function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  const frontmatterText = match[1];
  const frontmatter = {};

  // Only flat `key: value` pairs, which is all the dates need.
  frontmatterText.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex > 0) {
        const key = trimmed.substring(0, colonIndex).trim();
        let value = trimmed.substring(colonIndex + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        frontmatter[key] = value;
      }
    }
  });

  return frontmatter;
}

function getGitCommitDates(filePath) {
  try {
    const gitLog = execSync(`git log --format="%ai" -- "${filePath}"`, {
      encoding: "utf-8",
      cwd: process.cwd(),
    });

    return gitLog
      .trim()
      .split("\n")
      .filter((line) => line.trim())
      .map((dateStr) => {
        const date = new Date(dateStr.trim());
        return date.toISOString().split("T")[0];
      })
      .filter((date, index, self) => self.indexOf(date) === index);
  } catch (error) {
    console.warn(`Warning: Could not get git history for ${filePath}:`, error.message);
    return [];
  }
}

function csvEscape(value) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function main() {
  console.log("🚀 Generating blog posts timeline...");

  const blogFiles = readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith(".mdx") || file.endsWith(".md"))
    .sort();

  console.log(`Found ${blogFiles.length} blog posts`);

  const timelineEntries = [];

  for (const file of blogFiles) {
    const filePath = join(BLOG_DIR, file);
    const content = readFileSync(filePath, "utf-8");
    const frontmatter = parseFrontmatter(content);

    if (!frontmatter) {
      console.warn(`Warning: Could not parse frontmatter for ${file}`);
      continue;
    }

    const slug = file.replace(/\.(mdx|md)$/, "");
    const fullUrl = `${SITE_URL}/blog/${slug}/`;

    if (frontmatter.publishDate) {
      const publishDate = new Date(frontmatter.publishDate).toISOString().split("T")[0];
      timelineEntries.push({
        date: publishDate,
        url: fullUrl,
        change: "published",
      });
    }

    if (frontmatter.contentModifiedDate) {
      const modifiedDate = new Date(frontmatter.contentModifiedDate).toISOString().split("T")[0];
      const publishDate = frontmatter.publishDate
        ? new Date(frontmatter.publishDate).toISOString().split("T")[0]
        : null;

      if (modifiedDate !== publishDate) {
        timelineEntries.push({
          date: modifiedDate,
          url: fullUrl,
          change: "modified",
        });
      }
    }

    const gitDates = getGitCommitDates(filePath);
    for (const gitDate of gitDates) {
      // Skip dates the frontmatter already covers.
      const isPublishDate =
        frontmatter.publishDate &&
        new Date(frontmatter.publishDate).toISOString().split("T")[0] === gitDate;
      const isModifiedDate =
        frontmatter.contentModifiedDate &&
        new Date(frontmatter.contentModifiedDate).toISOString().split("T")[0] === gitDate;

      if (!isPublishDate && !isModifiedDate) {
        timelineEntries.push({
          date: gitDate,
          url: fullUrl,
          change: "modified",
        });
      }
    }
  }

  timelineEntries.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA - dateB;
  });

  const csvHeader = "date,full url,changes\n";
  const csvRows = timelineEntries
    .map((entry) => `${csvEscape(entry.date)},${csvEscape(entry.url)},${csvEscape(entry.change)}`)
    .join("\n");

  const csvContent = csvHeader + csvRows;

  writeFileSync(OUTPUT_FILE, csvContent, "utf-8");

  console.log(`✅ Timeline generated: ${OUTPUT_FILE}`);
  console.log(`📊 Total entries: ${timelineEntries.length}`);
  console.log(
    `📅 Date range: ${timelineEntries[0]?.date} to ${timelineEntries[timelineEntries.length - 1]?.date}`,
  );
}

main();
