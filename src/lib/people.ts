import {
  getCollection,
  getEntry,
  type CollectionEntry,
  type ReferenceDataEntry,
} from "astro:content";

// People live in the `people` collection; other entries point at them with
// reference("people"). Components take PersonProps, never a collection entry.

export type PersonEntry = CollectionEntry<"people">;

/** The one projection from a person entry to component props (byline, author box, card). */
export interface PersonProps {
  id: string;
  name: string;
  role: string;
  company?: string;
  url?: string;
  bio?: string;
  image?: { src: string; alt: string };
  socials: { label: string; url: string }[];
  /** Their profile page's path, when they have one. */
  profilePath?: string;
}

export const profilePath = (id: string) => `/people/${id}/`;

export function personToProps(entry: PersonEntry): PersonProps {
  const { name, role, company, url, bio, image, socials = [], profile } = entry.data;
  return {
    id: entry.id,
    name,
    role,
    company,
    url,
    bio,
    image,
    socials,
    profilePath: profile ? profilePath(entry.id) : undefined,
  };
}

/** The person a reference points at. Throws on a dangling id. */
export async function getPerson(ref: ReferenceDataEntry<"people">): Promise<PersonEntry> {
  const entry = await getEntry(ref);
  if (!entry) throw new Error(`No person "${ref.id}" in src/content/people/.`);
  return entry;
}

/** People with a profile page, by name. */
export async function getProfiles(): Promise<PersonEntry[]> {
  const people = await getCollection("people", (entry) => !!entry.data.profile);
  return people.sort((a, b) => a.data.name.localeCompare(b.data.name));
}
