// Moves the reset archives from branches to tags (tags do not count against the Keeper's materialized-branch
// cap). Branches and tags share one namespace, so for each `archive/*` branch the head Revision is recorded,
// the branch is deleted, then a tag of the same name is created at that Revision. Protected branches and names
// that are already tags are skipped. Dry run by default. If a tag cannot be created, its name and Revision are
// printed so it can be tagged by hand (POST /tags {name, revision}) before the Revision is garbage-collected.
//   node scripts/archive-to-tags.ts [--apply]
import { loadConfig } from '../server/src/config.ts';
import { LorebaseClient } from '../server/src/lorebase/client.ts';
import { planArchiveToTags } from '../server/src/lorebase/archive-tags.ts';

const apply = process.argv.includes('--apply');
const lb = loadConfig([]).lorebase;
const client = new LorebaseClient(lb.url, lb.domain);

await client.ready().catch(() => {
  console.error(`Keeper is not reachable at ${lb.url}; run: npm run lorebase:up`);
  process.exit(1);
});

const steps = planArchiveToTags(await client.listBranches(), await client.listTags());
console.log(`archive branches of ${lb.domain} -> tags${apply ? '' : ' (dry run; pass --apply to execute)'}: ${steps.length} branch(es)`);
let failed = 0;
for (const s of steps) {
  console.log(`  ${s.name}: ${s.skip ? `skip (${s.skip === 'tagged' ? 'already a tag' : 'protected'})` : `delete branch, tag @ ${s.head}`}`);
  if (!apply || s.skip) continue;
  try {
    await client.deleteBranch(s.name);
  } catch (err) {
    failed++;
    console.warn(`  ${s.name}: delete branch failed: ${(err as Error).message}`);
    continue;
  }
  try {
    await client.createTag(s.name, { revision: s.head });
  } catch (err) {
    failed++;
    console.warn(`  ${s.name}: branch deleted but tag failed (tag it by hand: name ${s.name}, revision ${s.head}): ${(err as Error).message}`);
  }
}
if (apply) console.log(failed ? `${failed} archive(s) not moved` : 'done');
process.exit(failed ? 1 : 0);
