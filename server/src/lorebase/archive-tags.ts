// Plan for moving `archive/*` branches to tags (a tag does not count against the materialized-branch cap).
// Branches and tags share one namespace: the branch is deleted first, then the tag takes its name at the
// recorded head Revision.
export const ARCHIVE_PREFIX = 'archive/';

export interface ArchiveStep {
  name: string;
  head: string;
  /** Why the branch is left alone (none: it is moved). */
  skip?: 'protected' | 'tagged';
}

export function planArchiveToTags(branches: Array<{ name: string; head: string; protected?: boolean }>, tags: Array<{ name: string }>): ArchiveStep[] {
  const tagged = new Set(tags.map((t) => t.name));
  return branches
    .filter((b) => b.name.startsWith(ARCHIVE_PREFIX))
    .map((b) => {
      const skip = b.protected ? 'protected' : tagged.has(b.name) ? 'tagged' : undefined;
      return { name: b.name, head: b.head, ...(skip ? { skip } : {}) } as ArchiveStep;
    });
}
