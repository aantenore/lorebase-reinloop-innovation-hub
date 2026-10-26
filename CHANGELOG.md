# Changelog

## Unreleased

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
