// Moves the reset archives from branches to tags: for each `archive/*` branch a tag of the same name is
// created at the branch head, then the branch is deleted (tags do not count against the Keeper's
// materialized-branch cap). Dry run by default; idempotent (a branch whose tag already exists at its head
// is only deleted; a tag at another Revision is reported and the branch is kept).
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
  const plan = s.conflict ? 'CONFLICT: tag exists at another Revision, branch kept' : `${s.createTag ? 'tag' : 'tag exists'} @ ${s.head.slice(0, 12)}, delete branch`;
  console.log(`  ${s.name}: ${plan}`);
  if (!apply) continue;
  if (s.conflict) {
    failed++;
    continue;
  }
  try {
    if (s.createTag) await client.createTag(s.name, s.name);
    await client.deleteBranch(s.name);
  } catch (err) {
    failed++;
    console.warn(`  ${s.name}: ${(err as Error).message}`);
  }
}
if (apply) console.log(failed ? `${failed} archive(s) not moved` : 'done');
process.exit(failed ? 1 : 0);
