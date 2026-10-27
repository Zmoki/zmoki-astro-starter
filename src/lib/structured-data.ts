import { site } from "@/site.config";
import { htmlToText } from "@/lib/html-text";

// One builder per schema.org type the site emits; JsonLd.astro renders the result.
// Each takes only facts the page shows, and absolute URLs built by the caller
// (siteUrls in src/lib/urls.ts). Which pages carry which type: src/STRUCTURED-DATA.md.

type Schema = Record<string, unknown>;
type Person = { name: string; url?: string };

const CONTEXT = "https://schema.org";

// One @id for the site owner on every page, so Google reads the home page's
// Organization, every publisher and every image creator as one entity.
const ORGANIZATION_ID = `${site.domain}/#organization`;

/** The site owner (site.organization), as a publisher or image creator. */
const owner = (): Schema => ({
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: site.organization.name,
  url: site.organization.url,
});

const person = ({ name, url }: Person): Schema => ({
  "@type": "Person",
  name,
  ...(url ? { url } : {}),
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
    headline: htmlToText(post.title),
    ...(post.description ? { description: htmlToText(post.description) } : {}),
    datePublished: post.publishDate.toISOString(),
    dateModified: post.contentModifiedDate.toISOString(),
    author: person(post.author),
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
    creator: image.author ? person(image.author) : owner(),
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
 * Organization that publishes it. `home` is the absolute home URL and `logo` the
 * absolute URL of site.organization.logo.
 */
export function siteIdentity({ home, logo }: { home: string; logo: string }): Schema[] {
  return [
    {
      "@context": CONTEXT,
      "@type": "WebSite",
      "@id": `${home}#website`,
      name: site.name,
      url: home,
      publisher: { "@id": ORGANIZATION_ID },
    },
    {
      "@context": CONTEXT,
      ...owner(),
      logo,
    },
  ];
}

/**
 * A person's profile page. `url` is the page's absolute URL; `sameAs` their own
 * site and profiles elsewhere; `image` an absolute photo URL.
 */
export function profilePage(profile: {
  name: string;
  role: string;
  company?: string;
  bio?: string;
  image?: string;
  sameAs: string[];
  url: string;
  publishDate: Date;
  contentModifiedDate: Date;
}): Schema {
  return {
    "@context": CONTEXT,
    "@type": "ProfilePage",
    url: profile.url,
    dateCreated: profile.publishDate.toISOString(),
    dateModified: profile.contentModifiedDate.toISOString(),
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      jobTitle: profile.role,
      ...(profile.company ? { worksFor: { "@type": "Organization", name: profile.company } } : {}),
      ...(profile.bio ? { description: profile.bio } : {}),
      ...(profile.image ? { image: profile.image } : {}),
      ...(profile.sameAs.length ? { sameAs: profile.sameAs } : {}),
    },
  };
}
