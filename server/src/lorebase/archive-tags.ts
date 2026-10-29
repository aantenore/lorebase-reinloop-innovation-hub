// Plan for moving `archive/*` branches to tags (a tag does not count against the materialized-branch cap).
import type { TagInfo } from './client.ts';

export const ARCHIVE_PREFIX = 'archive/';

export interface ArchiveStep {
  name: string;
  head: string;
  /** The tag still has to be created (false: it already exists at this head, only the branch is left). */
  createTag: boolean;
  /** The branch cannot be removed: a tag of the same name points to another Revision. */
  conflict: boolean;
}

export function planArchiveToTags(branches: Array<{ name: string; head: string }>, tags: TagInfo[]): ArchiveStep[] {
  const tagged = new Map(tags.map((t) => [t.name, t.revision]));
  return branches
    .filter((b) => b.name.startsWith(ARCHIVE_PREFIX))
    .map((b) => {
      const at = tagged.get(b.name);
      return { name: b.name, head: b.head, createTag: at === undefined, conflict: at !== undefined && at !== b.head };
    });
}
