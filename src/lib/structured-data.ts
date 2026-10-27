import { site } from "@/site.config";

// One builder per schema.org type the site emits; JsonLd.astro renders the result.
// Each takes only facts the page shows, and absolute URLs built by the caller
// (siteUrls in src/lib/urls.ts). Which pages carry which type: src/STRUCTURED-DATA.md.

type Schema = Record<string, unknown>;
type Person = { name: string; url: string };

const CONTEXT = "https://schema.org";

/** The site owner (site.organization), as an author, publisher or image creator. */
const owner = (): Schema => ({
  "@type": "Organization",
  name: site.organization.name,
  url: site.organization.url,
});

/** A blog post. `image` is the cover's published URL, or the OG card. */
export function blogPosting(post: {
  title: string;
  description?: string;
  publishDate: Date;
  contentModifiedDate: Date;
  author: Person;
  image: string;
  url: string;
}): Schema {
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: post.title,
    ...(post.description ? { description: post.description } : {}),
    datePublished: post.publishDate.toISOString(),
    dateModified: post.contentModifiedDate.toISOString(),
    author: { "@type": "Person", name: post.author.name, url: post.author.url },
    publisher: owner(),
    image: post.image,
    mainEntityOfPage: post.url,
  };
}

/** A content image's license. Credited to `author`, else the site owner. */
export function imageObject(image: {
  contentUrl: string;
  license: string;
  author?: Person;
}): Schema {
  const credit = image.author ?? site.organization;
  return {
    "@context": CONTEXT,
    "@type": "ImageObject",
    contentUrl: image.contentUrl,
    license: image.license,
    acquireLicensePage: image.license,
    creditText: credit.name,
    copyrightNotice: `© ${site.copyright.year} ${credit.name}`,
    creator: image.author ? { "@type": "Person", ...image.author } : owner(),
  };
}

export interface Crumb {
  name: string;
  /** Absolute URL. Omit it on the last crumb, the current page. */
  url?: string;
}

/** The trail the visible breadcrumb shows (Breadcrumbs.astro builds both from one array). */
export function breadcrumbList(crumbs: Crumb[]): Schema {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      ...(crumb.url ? { item: crumb.url } : {}),
    })),
  };
}

/**
 * The site's identity, for the home page only: WebSite (Google's site name) and the
 * Organization that publishes it, linked by @id. `home` is the absolute home URL
 * and `logo` the brand mark's absolute PNG URL.
 */
export function siteIdentity({ home, logo }: { home: string; logo: string }): Schema[] {
  const organizationId = `${home}#organization`;
  return [
    {
      "@context": CONTEXT,
      "@type": "WebSite",
      "@id": `${home}#website`,
      name: site.name,
      url: home,
      publisher: { "@id": organizationId },
    },
    {
      "@context": CONTEXT,
      ...owner(),
      "@id": organizationId,
      logo,
    },
  ];
}
