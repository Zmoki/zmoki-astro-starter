import puppeteer from "puppeteer";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";

// Get port from command line arguments, default to 4321
const port = process.argv[2] || "4321";
const SITE_URL = `http://localhost:${port}`;
const OG_IMAGES_DIR = "public/og-images";
const EXCLUDED_PATHS = [];

// Ensure og-images directory exists
if (!existsSync(OG_IMAGES_DIR)) {
  mkdirSync(OG_IMAGES_DIR, { recursive: true });
}

// Function to parse sitemap.xml and extract URLs
async function parseSitemap(sitemapUrl) {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }
    const sitemapContent = await response.text();
    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);

    if (!urlMatches) {
      console.log("No URLs found in sitemap");
      return [];
    }

    return urlMatches.map((match) => {
      const url = match.replace(/<\/?loc>/g, "");
      return new URL(url).pathname; // Convert absolute sitemap URL to a local path
    });
  } catch (error) {
    console.error(`Error fetching sitemap from ${sitemapUrl}:`, error.message);
    throw error;
  }
}

// Function to generate filename from URL path
function getImageFilename(path) {
  if (path === "/") {
    return "wide.jpg";
  }

  // Remove leading slash and trailing slash
  const cleanPath = path.replace(/^\/|\/$/g, "");

  // Split path into segments and create directory structure
  const segments = cleanPath.split("/");
  const directory = segments.join("/");

  return `${directory}/wide.jpg`;
}

// Function to check if server is running
async function checkServerRunning() {
  try {
    const response = await fetch(SITE_URL);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to generate OG image for a single page
async function generateOGImage(browser, url, filename) {
  try {
    console.log(`Generating OG image for: ${url}`);

    const page = await browser.newPage();

    // Set viewport to 816px width
    await page.setViewport({ width: 816, height: 800 });

    // Navigate to the page
    await page.goto(`${SITE_URL}${url}`, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for main content to load and ensure it's fully rendered
    await page.waitForSelector("main", { timeout: 10000 });

    // Wait a bit more for any dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get the main element
    const mainElement = await page.$("main");

    if (!mainElement) {
      console.log(`No main element found for ${url}`);
      await page.close();
      return false;
    }

    // Get the bounding box of the main element
    const boundingBox = await mainElement.boundingBox();

    if (!boundingBox) {
      console.log(`Could not get bounding box for main element on ${url}`);
      await page.close();
      return false;
    }

    // Create directory for the image if it doesn't exist
    const imagePath = join(OG_IMAGES_DIR, filename);
    const imageDir = imagePath.substring(0, imagePath.lastIndexOf("/"));
    if (!existsSync(imageDir)) {
      mkdirSync(imageDir, { recursive: true });
    }

    // Take screenshot of the main element, starting from the top
    const screenshotBuffer = await mainElement.screenshot({
      type: "jpeg",
      quality: 90,
      clip: {
        x: 0, // Start from the left edge of the main element
        y: 0, // Start from the top of the main element
        width: 800,
        height: 500,
      },
    });

    // Create a new page for compositing the final image
    const compositePage = await browser.newPage();
    await compositePage.setViewport({ width: 1200, height: 675 });

    // Create HTML for the composite image
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 1200px;
              height: 675px;
              background-color: #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            }
            .screenshot {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
            .gradient-overlay {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 1200px;
              height: 200px;
              background: linear-gradient(
                to bottom,
                transparent 0%,
                rgba(226, 232, 240, 0.5) 30%,
                #e2e8f0 70%
              );
              pointer-events: none;
              z-index: 10;
            }
          </style>
        </head>
        <body>
          <img class="screenshot" src="data:image/jpeg;base64,${screenshotBuffer.toString("base64")}" />
          <div class="gradient-overlay"></div>
        </body>
      </html>
    `;

    await compositePage.setContent(html);
    await compositePage.waitForSelector(".screenshot");
    await compositePage.waitForSelector(".gradient-overlay");

    // Take screenshot of the composite page
    await compositePage.screenshot({
      path: imagePath,
      type: "jpeg",
      quality: 90,
      clip: {
        x: 0,
        y: 0,
        width: 1200,
        height: 675,
      },
    });

    await compositePage.close();

    console.log(`✓ Generated: ${filename}`);
    await page.close();
    return true;
  } catch (error) {
    console.error(`Error generating OG image for ${url}:`, error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log("🚀 Starting OG image generation...");
  console.log(`Using server URL: ${SITE_URL}`);

  let browser;

  try {
    // Check if server is running
    console.log("🔍 Checking if server is running...");
    const isServerRunning = await checkServerRunning();

    if (!isServerRunning) {
      console.error(`❌ Server is not running at ${SITE_URL}`);
      console.error("Please start the preview server first with: npm run preview");
      process.exit(1);
    }

    console.log("✅ Server is running!");

    // Parse sitemap to get all URLs
    console.log("📄 Fetching sitemap...");
    const urls = await parseSitemap(`${SITE_URL}/sitemap.xml`);
    console.log(`Found ${urls.length} URLs in sitemap`);

    // Launch Puppeteer
    console.log("🌐 Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    // Generate OG images for each URL
    let successCount = 0;
    let failCount = 0;

    for (const url of urls) {
      if (EXCLUDED_PATHS.includes(url)) {
        console.log(`Skipping ${url} as it is excluded`);
        continue;
      }

      const filename = getImageFilename(url);
      const success = await generateOGImage(browser, url, filename);

      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // Small delay between screenshots
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ OG image generation complete!`);
    console.log(`✓ Success: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    console.log(`📁 Images saved to: ${OG_IMAGES_DIR}`);
  } catch (error) {
    console.error("❌ Error during OG image generation:", error);
    process.exit(1);
  } finally {
    // Cleanup
    if (browser) {
      await browser.close();
    }
  }
}

// Run the script
main().catch(console.error);
