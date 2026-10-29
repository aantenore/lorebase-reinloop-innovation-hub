# Changelog

## Unreleased

- `world:reset` archives on a Lorebase tag `archive/<stamp>` instead of a branch, so resets no longer fill the Keeper's
  materialized-branch cap. `npm run lorebase:archive-to-tags` (dry run; `-- --apply`) converts existing `archive/*`
  branches to tags (deletes the branch, then tags its recorded head Revision).
- Live run 6 recorded: `docs/run-report.md` (Run 6 and "Findings across runs 1-6" at the top), `docs/evidence/run6/`,
  `docs/portfolio-run6.md`; idea board, idea detail and board mode screenshots from run 6.
- While a committee session is convened or deciding, perception says so (`rt.observation.ideaSessionNow`) instead of
  naming the next grid point (seen in run 6).
- Page reads have their own quotas: policies `letture_web_per_persona_al_giorno` (12) and `letture_web_totali_al_giorno`
  (60), apart from the search quotas (`research.policies.readsPerPerson`, `readsTotal`). With `anthropic-native`,
  `web_fetch` now reads pages through Anthropic's hosted fetch tool (`research.anthropicFetch`; one call per page,
  restricted to its host, booked as `web_fetch`).
- Refusals split by tool and cause: `reinloop.webRefusals` and `reinloop.signalRefusals` in
  `/api/observatory/summary` (`<tool>:<reason>`: person quota, hub quota, per-decision cap, `not_from_search`,
  excluded domain, ...).
- Committee sessions on a grid: policy `cadenza_sedute_comitato_ore` (2 game hours; 0 keeps a session per
  submission). Perception of each idea adds how long a submitted idea has waited and the day and hour of the next
  session, and how long an unsubmitted idea has met the candidacy requirements.
- Official sources: `Signal` records take an optional `url` (schema); the regulatory seed signals carry their
  EUR-Lex text (AI Act, NIS2, GDPR, European Accessibility Act); the seed rewrites stored signals whose `url`
  differs. `web_fetch` also accepts the `url` of a signal the person carries, has read on an idea or brought into
  an idea of theirs (same normalization and checks); carried signals and `leggi_idea` show the URL.
- Live run 5 recorded: `docs/run-report.md` (Run 5, with the diagnosis of run 4's plan runs), `docs/evidence/run5/`,
  `docs/portfolio-run5.md`.
- Committee ballots include every seated member (`ideas.committee.maxVoters`, default 0 = all); in run 4
  `groups.maxProposers` 2 also capped the ballots and one member never voted.
- Committee decision basis as policy: `criteri_comitato` with one rule per criterion (`criterio_comitato_*`:
  prove del problema, concorrenza, fattibilità, rischio, coerenza strategica); ballots are `vota_idea` calls with a
  verdict per criterion, a kill or defer must name an unmet criterion, demands outside the criteria are recorded as
  out of policy; the chair records the decision with `decidi_idea`. `fase_approvazione` (1 = concept: an approval funds
  a concept exploration, paying customers belong to the pilot stage), `costo_del_rinvio` (a deferral of an idea that
  meets the candidacy requirements consumes approval slots), `obiettivo_portfolio_trimestre` (3 concepts explored).
  Perception: `PORTAFOGLIO` and `COMITATO INVESTIMENTI` lines; decision records carry unmet criteria, out-of-policy
  demands, the phase funded and the slots spent (also in the markdown export); stats `criteriaMet`, `criteriaUnmet`,
  `outOfPolicy`, `deferralSlots`.
- Plan runs that end without `commit_plan` (27 in run 4: the model closed with prose after 3 to 6 turns) get one
  closing run where only `commit_plan` answers (`decisions.closingTurn`); stats `closingRuns`, `closingCommitted`.
- Hacker News signal searches: a query no story matches with every word is asked again with optional words (no typo
  tolerance), results marked `match: "partial"` (`evidence.signals.hackernews.partialMatch`); signal tool descriptions
  state the language each source indexes.
- Committee independence as policies: `comitato_non_coautore` (committee members cannot propose ideas; an edit of
  theirs is recorded as a reviewer's contribution, `contributed`, not co-authorship) and
  `supplenti_comitato_per_anzianita` (below quorum, non-conflicted people of the hub sit as alternates by career
  step, then esteem; counted in `alternates`).
- Policy `slot_scadono_a_fine_trimestre`: unused approval slots are lost at the end of the quarter (off: they carry
  over); perception and the committee brief say how many are left and on which day and hour they expire
  (`/api/company`: `slotsExpire`, `quarterEndsDay`, `slotsCarried`).
- Perception of the candidacy requirements: only what the policy requires and whether it is met; human validation
  only as the alternative path, never as a count among the requirements (also in the refusal of `candida_al_comitato`).
- Cost: hosted web search quotas down (`ricerche_web_per_persona_al_giorno` 3, `ricerche_web_totali_al_giorno` 10),
  public signal quotas up (16, 120), research and signal caches kept a day; spend per tool in
  `reinloop.costUsd.byTool` (`minds`, `web_search`, `intervista_simulata`, `segnali_pubblici`).
- Live run 4 recorded: `docs/run-report.md` (Run 4), `docs/evidence/run4/`, `docs/portfolio-run4.md`, board mode
  screenshot.
- reinloop pinned at 474f0b5 (`vendor/reinloop-474f0b5c.tgz`): `signalTools` and recovery from malformed streamed
  tool arguments (the group plan JSON failures of run 2).
- Evidence for ideas: Lorebase Kind `Evidence` on the idea branch (`public_signal`, `web_source`,
  `human_validation`, `simulated_interview`), tools `cerca_discussioni`, `cerca_progetti`, `cerca_domande`,
  `cerca_paper`, `allega_prova` (only URLs from the person's own searches), `intervista_simulata` (weight 0, label
  `ipotesi`); `POST /api/ideas/:code/validation` for players and `npm run idea:validate`; `evidence` event.
- Candidacy requirements and evidence weights as policies (`requisiti_candidatura_*`, `peso_prova_*`,
  `peso_prove_nel_punteggio_comitato`, `prove_per_punteggio_pieno`, quotas `segnali_pubblici_*`,
  `interviste_simulate_*`); the submit tool says what is missing; perception and the committee brief show evidence.
- Plan calls use `thinking.display: "omitted"`; the thought shown is the person's Italian plan reason; the working
  language is the first line of the instructions.
- Perception states when an idea meets the candidacy requirements per policy and that human validations are
  optional (the alternative path); plan reasons counted by language in `reinloop.reasonLangs`; a decision's
  thought is no longer shown twice; `allega_prova` records only the source's metric.
- Live run 3 recorded (`docs/run-report.md`, `docs/evidence/run3/`, `docs/portfolio-run3.md`).
- `economy` profile: Livia on haiku too (run 2: sonnet was 76% of the cost).
- Game client: evidence in the idea drawer grouped by type with weights and the `ipotesi` badge, requirements
  bar, evidence badge and pulse on cards, "Valida idea" panel.
- reinloop pinned at 96601b2 (`vendor/reinloop-96601b26.tgz`): prompt caching, hosted tools, web tools.
- Web research for every mind (`web_search`, `web_fetch`, provider in `research.provider`: tavily,
  anthropic-native or off): daily quotas and excluded domains are policies (`ricerche_web_per_persona_al_giorno`,
  `ricerche_web_totali_al_giorno`, `domini_esclusi`), server-side cache, `research` events, `GET /api/research`.
- Ideas cite web sources (`Idea.sources`, Lorebase `Idea.sources`; `proponi_idea` / `arricchisci_idea` accept them).
- Prompt caching (`promptCache`) with cache reads, writes, hit ratio and savings in `/api/observatory/summary`.
- Cost profiles (`GAME_PROFILE`), `economy`: haiku minds, Livia on sonnet as committee chair.
- Offline movement habits by company role (`mock.habits`) instead of engine role names.
- Game client: idea sources as links, research bubbles and inspector section, idea people as names and
  committee votes by entity id.

## 0.1.0 - 2026-10-24

First release. Requires Lorebase 0.2.3 or later (checkout next to this one) and pins reinloop 0.2.0
(`vendor/reinloop-512adcbe.tgz`).

- Real-time world: people with bodies (hunger, health, age), a mind per person (one reinloop agent each) and
  reflexes that act while minds think; laws and social roles read from Lorebase at every turn and applied live
  when a rule changes.
- Groups (council, assembly, company, crowd) deciding through reinloop patterns, with per-member cost booking.
- Economy from Lorebase: regional materials, recipes, technologies, crafting, gifts, asks and barter offers.
- Society kept across restarts in mnemo: esteem, opinions, fame, skills and families (by name).
- Run log of every decision, reply and group decision kept in mnemo (`memory.runStore`, `GET /runs`).
- Factual perception: wild zones, what others carry, causes of damage, missing recipe ingredients.
- Law proposals and insights as Lorebase Proposals with links to their review page; `npm run world:reset`
  restores the seed with a single bulk delete.
- Mock provider for offline runs (`npm run game:mock`); run reports in `docs/run-report.md`.
