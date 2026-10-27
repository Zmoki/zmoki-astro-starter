// HTML-to-text helpers. Relative imports only: src/markdown/ (loaded by
// astro.config.mjs) uses them too.

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">" };

/** Decodes numeric entities and the five XML ones (&amp; &quot; &apos; &lt; &gt;). */
export const decodeEntities = (text: string): string =>
  text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|(amp|quot|apos|lt|gt));/gi, (_, dec, hex, name) =>
    dec
      ? String.fromCodePoint(Number(dec))
      : hex
        ? String.fromCodePoint(parseInt(hex, 16))
        : ENTITIES[name.toLowerCase()],
  );

/** A title or description that pages render with set:html, as plain text. */
export const htmlToText = (html: string): string =>
  decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
