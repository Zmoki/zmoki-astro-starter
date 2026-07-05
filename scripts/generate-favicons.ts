import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sharp from "sharp";

// Rasterizes the site's brand mark into the raster favicon set — the single
// command behind every non-SVG icon. The source of truth is public/brand-mark.svg
// (a square, full-bleed SVG); this script does NOT invent the art, it only renders
// that file at the sizes each platform wants. Rerun (`npm run favicons`) whenever
// you replace brand-mark.svg. The SVG icon itself is served straight from
// /brand-mark.svg (see the <link>s in BaseLayout / BrandLayout), so it isn't
// re-emitted here; and the OG cards rasterize the same file (src/og/card.ts).
//
// Outputs, all committed under public/:
//   favicon.ico          — legacy fallback (16/32/48, PNG-encoded entries)
//   apple-touch-icon.png — 180×180, iOS home screen
//   icon-192.png         — PWA / Android
//   icon-512.png         — PWA / Android + install splash

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const source = readFileSync(join(publicDir, "brand-mark.svg"));

// Rasterize the brand mark to a square PNG of the given size. libvips renders the
// SVG at the target resolution (not upscaled), so every size stays crisp.
const rasterize = (size: number): Promise<Buffer> =>
  sharp(source).resize(size, size).png().toBuffer();

// Pack PNG buffers into an ICO container (each entry is a PNG-encoded image —
// supported by every browser that reads .ico). Avoids an extra dependency.
function buildIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(images.length, 4); // image count

  const dirEntrySize = 16;
  let offset = header.length + images.length * dirEntrySize;
  const entries: Buffer[] = [];
  for (const { size, png } of images) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 ⇒ 256)
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(png.length, 8); // image byte size
    entry.writeUInt32LE(offset, 12); // image byte offset
    offset += png.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

const write = (name: string, data: Buffer) => {
  writeFileSync(join(publicDir, name), data);
  console.log(`  ${name.padEnd(22)} ${data.length.toLocaleString()} bytes`);
};

console.log("Generating favicons from public/brand-mark.svg");

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(
  icoSizes.map(async (size) => ({ size, png: await rasterize(size) })),
);
write("favicon.ico", buildIco(icoImages));

write("apple-touch-icon.png", await rasterize(180));
write("icon-192.png", await rasterize(192));
write("icon-512.png", await rasterize(512));

console.log("Done.");
