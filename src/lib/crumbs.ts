import { site } from "@/site.config";
import type { BreadcrumbItem } from "@/components/Breadcrumbs.astro";

// Crumbs shared by the layouts. A section's label follows its top-nav link, so
// renaming it in site.nav renames the breadcrumb too.
const navLabel = (href: string, fallback: string) =>
  site.nav.find((item) => item.href === href)?.label ?? fallback;

export const homeCrumb: BreadcrumbItem = { name: "Home", href: "/" };
export const blogCrumb: BreadcrumbItem = { name: navLabel("/blog/", "Blog"), href: "/blog/" };
export const peopleCrumb: BreadcrumbItem = {
  name: navLabel("/people/", "People"),
  href: "/people/",
};
