import { site } from "../site.config.ts";

// No astro:assets here, so astro.config.mjs can import it too. See src/lib/images.ts.

export const IMAGE_ORIGIN = (site.platform.imagesCDNHost || "").trim().replace(/\/+$/, "");

/** Whether Astro optimizes this URL at build (it's on the image origin). */
export const isOnImageOrigin = (src: string): boolean =>
  !!IMAGE_ORIGIN && src.startsWith(`${IMAGE_ORIGIN}/`);
