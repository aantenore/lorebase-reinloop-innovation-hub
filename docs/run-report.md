# Run report: live run 1 (web research, prompt caching, economy profile)

Date: 2026-10-26, 09:04-09:34 UTC. Fresh world (`npm run world:reset`), real models, `GAME_PROFILE=economy`
(every mind on haiku, Livia on sonnet as committee chair; committee voters and group proposers on haiku, no
interns), `GAME_BUDGET_USD=3`, `--seconds 1800`, web research through Tavily. Stop rule: budget, 30 real minutes or
five committee decisions, whichever first: the 30 minutes came first.

Evidence: [docs/evidence/run1/](evidence/run1/) (summary, portfolio, committee, research, curated conversations,
Lorebase trail). Progress log: [docs/run-progress.log](run-progress.log). Export: [docs/portfolio-run1.md](portfolio-run1.md).

## Numbers

| | |
|---|---|
| Game time | day 1 08:00 to day 2 13:47 (one game minute per real second: half of the run was night or the year-end freeze) |
| Decisions | 213 individual, 29 group, about 220 spoken replies, 480 model runs |
| Failures | 8 (6 runs stopped at `maxTurns`, 1 reply at `maxToolCalls`, 1 decision without a plan, 1 group plan with malformed JSON) |
| Cost | **$2.33** of $3 (sonnet $1.83, haiku $0.50; group runs $0.06) |
| Tokens | 10.78 M input (8.46 M read from cache, 2.31 M written to it), 0.43 M output |
| Prompt cache | hit ratio **0.785**; saved **$3.04** against the same calls uncached (sonnet $2.46, haiku $0.58): without caching the run would have cost about $5.37 |
| Web research | 29 searches, 7 page reads, **22 refused by policy** (daily quota per person), 0 cache hits (no query was repeated), 1 backend error |
| Ideas | 2, both complete (`proposal`), 7 reviews, 9 web sources attached |
| Committee | 1 decision: **defer**; 0 approved, 0 killed |
| Lorebase | 2 `idea/` branches, 1 idea Proposal (open after the deferral), 1 role-playbook rule merged, Chronicle on `main` |

## Portfolio

No idea was approved or killed. The committee decided once (defer); the second idea was complete and reviewed but
never submitted. Full text in [portfolio-run1.md](portfolio-run1.md).

### AI on-premise chiavi in mano per strutture sanitarie (deferred)

- Champion: Livia; authors: Livia. Proposed day 1 11:55, submitted 18:07, deferred 18:15.
- Problem: hospitals want AI on clinical records, but data cannot leave the internal network and they lack the
  skills to run models and security; staff re-type and search data by hand.
- Solution (after review): a narrow scope, no report coding (MDR/AI Act); administrative and research uses only
  (search and summaries in records, draft discharge letters reviewed by the clinician); hardware leased through a
  partner, one mid-range GPU node with small open-weight models; a fee that includes hardware, signed offline
  updates and audit.
- Differentiation: rewritten after Dario found the competitors (Taction, Medicus AI, Petronella, iternal, ibl.ai):
  a wedge on private clinics and mid-size health authorities, managed service with audit of every answer, Italy/EU.
- Scores (4 reviews: Matteo, Dario, Giulia, Irene): impact 6.5, feasibility 4.3, novelty 3, fit 6.3, risk 7;
  weighted 5.
- Committee (Livia and Matteo present; quorum 2): both voted defer. Chair: "Il problema è reale e il wedge (cliniche
  private e ASL medie, audit incluso, UE) è credibile. Ma il TCO del pilota si basa solo su fonti vendor e la
  disponibilità a pagare non è testata, quindi non impegniamo uno slot ora."
- Sources: [Cost model for locally deployed medical LLM](https://www.talby.com/p/a-cost-model-for-patient-level-healthcare),
  [Self-Hosted AI for Hospitals and Health Systems](https://ibl.ai/blog/self-hosted-ai-for-hospitals-and-health-systems),
  [HL7 Interface cost and maintenance - Spiceworks](https://community.spiceworks.com/t/hl7-interface-cost-and-maintenance/115728),
  [HL7 Interface Guide: Build vs Buy](https://www.invene.com/blog/hl7-interface),
  [Cost-Benefit Analysis of On-Premise LLM Deployment](https://arxiv.org/html/2509.18101v1),
  [On-Prem LLM Deployment: GPU Sizing](https://iternal.ai/how-to-deploy-llm-on-premise).

### Triage sinistri su documenti non strutturati, con revisore umano (complete, not submitted)

- Champion: Livia; authors: Livia. Proposed day 1 16:40.
- Problem: insurers receive claims as PDFs, photos, emails and appraisals; operators re-read and re-type them into
  legacy systems, slowing settlement and adding errors, worst for small and mid-size insurers without data teams.
- Solution: an extraction and triage layer that reads claim documents, extracts the key fields with evidence linked
  to the source page, flags inconsistencies and sets a priority; an operator validates before anything is written;
  first step a read-only/CSV connector; it never decides the outcome of a claim.
- Scores (3 reviews: Dario, Giulia, Irene): impact 5, feasibility 6, novelty 3, fit 6, risk 6; weighted 4.9.
- Sources: [Claims 2030 (McKinsey)](https://www.mckinsey.com/industries/financial-services/our-insights/claims-2030-a-talent-strategy-for-the-future-of-insurance-claims),
  [Insurance productivity 2030 (McKinsey)](https://www.mckinsey.com/~/media/McKinsey/Industries/Financial%20Services/Our%20Insights/Insurance%20productivity%202030%20Reimagining%20the%20insurer%20for%20the%20future/Insurance-productivity-2030.pdf),
  [State of Claims Automation 2026 (Hesper AI, marked by the authors as a vendor source)](https://gethesperai.com/reports/state-of-claims-automation-2026).
- Status at the end: Livia had set a committee session for 12:45 game time "con ciò che c'è"; the run ended at 13:47
  before it took place.

## Five moments

1. **A search that falsified a claim.** Dario searched for on-premise hospital AI vendors before reviewing, then
   wrote: «La differenziazione 'nessuno fa on-prem chiavi in mano' è falsa: ci sono già Taction, Medicus AI,
   Petronella e iternal che vendono proprio questo.» Livia rewrote the differentiation, citing the review.
2. **Numbers checked against sources.** «Aggiornamento dopo ricerca: una singola interfaccia HL7v2 costa circa
   10-20k$ secondo fonti di vendor, quindi i 95-145k$ di Matteo per un pilota a 1 connettore vanno spiegati, non
   accettati.» (Dario). Livia's feasibility then marks which figures she verified "alla lettera" and drops one she
   could not verify.
3. **The quota as a fact, not an excuse.** Matteo, after his six searches: «Le ricerche web di oggi sono esaurite,
   quindi non posso portare a Dario la fonte indipendente promessa: dichiaro il limite invece di far passare numeri
   non verificati.»
4. **A defer with reasons.** Livia, chairing the session on her own idea: «il TCO del pilota si basa solo su fonti
   vendor e la disponibilità a pagare non è testata, quindi non impegniamo uno slot ora.»
5. **An attribution corrected by a fetch.** Matteo traced Livia's "Hesper 46%" to its origin; the idea now reads «Il
   46% è del Rising Medical Solutions 2024 Workers' Comp Benchmarking Study (US, via Risk & Insurance), non di
   Hesper: misura il dolore, non la disponibilità a pagare.» Dario turned it into a rule for the committee: «Ogni
   numero entra come dato solo con cliente, base dati, data e fonte. Il resto è ipotesi.»

More in [evidence/run1/conversations.md](evidence/run1/conversations.md).

## What the run shows

- **Research is used as evidence, not decoration.** Every attached source came from a search the authors ran; the
  reviews cite what the searches found; vendor and non-vendor sources are told apart in the idea text. The minds
  treated the results as claims to verify, and no web content triggered any action (results are only text).
- **Prompt caching works at this cadence.** 78.5% of input tokens came from the cache; savings exceeded the run's
  cost. Ordering tools and instructions before the perception keeps the prefix stable for each person.
- **Throughput was low.** One committee decision in 30 minutes: the clock ran one game minute per real second, so
  the night and the year-end freeze took about half the run; the minds rested at night (conduct policy
  `orario_di_lavoro`) and refused to submit without independent figures.
- **The search quota bound the work.** 22 of 58 attempted calls were refused by `ricerche_web_per_persona_al_giorno`
  (6); the minds then waited for the next day rather than submit. The policy is the lever to change.

## Problems seen

- One champion: Livia proposed both ideas and chaired the session that deferred one of them.
- Anchored scores: Giulia's and Irene's reviews of the triage idea repeat Dario's five scores exactly.
- A loop: Irene and Giulia waited on each other for hours (missing "pain"/"trend" signals, Lorebase consultations
  spent per decision).
- Some reasoning summaries come back in English and mention engine words ("10 wood"): the summary is the model's,
  not the prompt's.
- `maxTurns` stops on haiku decisions with research (5 turns: search, read, write, plan) account for 6 of 8 failures.
- The committee's vote reasons are cut at `groups.traceMaxChars` (280) in the decision record.

## Next useful step

A second run with a faster clock (`GAME_TIME_SCALE`) or a higher `ricerche_web_per_persona_al_giorno` (board change,
`npm run rule`) would show whether more searches and more working hours turn into committee decisions.

# Run 2: committee policies, independent reviews, faster clock

Date: 2026-10-26, 09:52-10:11 UTC. Fresh world (`npm run world:reset`), real models, `GAME_PROFILE=economy` (now
also clock x3, 8 turns and a web-call cap per decision), `GAME_BUDGET_USD=3`, `--seconds 1800`, web research through
Tavily (the run started before the default moved to `anthropic-native`). New policies on: `astensione_conflitto_interessi`,
`revisioni_indipendenti`; working hours 7-21, freeze of one period, web quota 12 per person and 60 in total. Stop
rule: budget, 30 real minutes or five committee decisions: **the $3 budget came first, after 19 minutes**.

Evidence: [docs/evidence/run2/](evidence/run2/). Progress log: [docs/run-progress.log](run-progress.log) (`run2`
lines). Export: [docs/portfolio-run2.md](portfolio-run2.md).

## Run 1 and run 2

| | Run 1 | Run 2 |
|---|---|---|
| Real time, stop | 30 min, time limit | 19 min, budget cap |
| Game time | day 1 08:00 to day 2 13:47 (~30 h) | day 1 07:00 to day 3 15:30 (~56 h) |
| Decisions | 213 individual, 29 group, ~220 replies, 480 runs | 293 individual, 48 group, 269 replies, 663 runs |
| Failures | 8 (6 `maxTurns`, 1 `maxToolCalls`, 1 no plan, 1 group JSON) | 6 (0 `maxTurns`; 3 replies at `maxToolCalls`, 2 group JSON, 1 no plan) |
| Cost | $2.33 (sonnet $1.83, haiku $0.50) | $3.01 (sonnet $2.27, haiku $0.73) |
| Tokens | 10.78 M in (8.46 M cached), 0.43 M out | 15.03 M in (11.73 M cached), 0.63 M out |
| Prompt cache | hit 0.785, saved $3.04 | hit 0.781, saved $4.06 |
| Web | 29 searches, 7 reads, 22 refused by quota | 10 searches, 0 reads, 0 refused, 0 capped |
| Ideas by stage | 2 proposal | 3 proposal |
| Reviews | 7 | 11 |
| Committee | 1 decision (defer) | 0 (nothing submitted) |
| Conflicts avoided | - (Livia chaired her own idea) | 0 recusals (no session) |
| Copied scores | 2 reviews equal to Dario's | 0 `scores_match` |
| Thought summaries | English and Italian, not counted | `{"en": 293, "it": 1}` |

## Portfolio

No idea was submitted, approved or killed. Full text in [portfolio-run2.md](portfolio-run2.md).

- **Audit delle decisioni AI per settori regolati (on-prem)**: champion Giulia, authors Giulia, Irene, Livia;
  5 reviews (impact 7, feasibility 5, fit 8); sources include the AI Act Service Desk text of Article 12. A signed
  evidence pack of automated decisions, kept on premise, starting from one SQL connector and one pilot.
- **AI gateway on-prem per sistemi legacy in settori regolati**: champion Livia; 5 reviews (feasibility 4); a local
  gateway that connects legacy systems, runs contained models, anonymises and logs every automated decision.
- **Triage automatico dei segreti nei repository**: champion Irene; 1 review (Dario: «una feature, non un
  prodotto»).

## What changed, what it showed

- **Turn limits fixed.** No decision stopped at `maxTurns` (6 in run 1) with 8 turns and at most 2 web calls per
  haiku decision; failures are now counted by reason (`reinloop.failureReasons`).
- **Independent reviews.** Eleven reviews, none with the same five scores as another; the spread on one idea was
  impact 6-8, feasibility 4-6, risk 5-7.
- **Waiting turned into moving.** The new perception line (words said to a named person and no answer heard since)
  appears in the minds' own reasons: «Livia, che è lontana e non risponde da 7 ore: vado da lei» (Matteo); «smetto di
  aspettare, uso il Q3 per un'idea non regolata» (Giulia, who then started a third idea with Irene).
- **The team set a bar no one could meet.** From day 2 the reviewers and Livia agreed that nothing goes to the
  committee without «pilota nominato, parere DPO scritto e fonte firmata con nome e data». The world has no
  customers to name and no DPO: no idea was submitted, so the conflict-of-interest seating was never exercised live
  (the offline smoke run showed it: a pitch co-authored by two of three committee members waited at 1 of 2 seats).
- **The faster clock spends faster.** Three game minutes per second shorten every cooldown in real time: 663 runs in
  19 minutes against 480 in 30. Livia on sonnet (venture lead) cost 76% of the run. The budget, not the clock, now
  bounds a run.
- **Fewer searches.** 10 searches and no page reads, without a single refusal: the quota was no longer the limit;
  the minds searched less (Giulia 6 of 10).

## Problems seen

- **Thought summaries are English.** 293 of 294 reasoning summaries were English although the instructions say
  «Lavori in italiano: pensi, scrivi e parli in italiano.» The summaries come from the provider's summarised thinking
  (`thinking.display: summarized`), which no reinloop param sets the language of; plan reasons, speech, reviews and
  ideas are Italian. Each thought now carries `lang`; nothing is translated. A lever left: `display: omitted` with the
  Italian plan reason as the only thought shown.
- **Group plan JSON (2 failures).** The Squadra Esplorazione's orchestrator leader (haiku) emitted `commit_plan`
  arguments that were not valid JSON; reinloop's Anthropic provider parses streamed tool input with a strict
  `JSON.parse` (`dist/providers/anthropic.js`, tool `input` assembly) and the run fails. The group then falls back to
  the members' own minds. The fix belongs in reinloop (a tolerant parse, as `parseJsonLoose` already does for
  structured output) and needs a re-pin, left for a later change.
- **Reviewer turned author.** Irene and Livia reviewed the audit idea and later enriched it (becoming co-authors);
  their reviews still count toward `min_idea_reviewers`.
- **Quarters are short.** A company year is 16 periods of 45 game minutes (12 game hours): at x3 the run crossed six
  quarters and two freezes, so slots and freezes come round faster than the minds' plans.

## Next useful step

A run with `research.provider: anthropic-native` (now the default, search cost booked in the budget) and a higher
budget, or Livia on haiku, to see whether a submission happens once the team stops waiting for a pilot; and a reinloop
fix for strict tool-input parsing, then a re-pin.

# Run 3: evidence, candidacy requirements, Italian thoughts

Date: 2026-10-26, 10:29-10:58 UTC. Fresh world (`npm run world:reset`), real models, `GAME_PROFILE=economy` (now every
mind on haiku, Livia included; clock x3), `GAME_BUDGET_USD=3`, research `anthropic-native`, public signals through
reinloop `signalTools` (pinned 474f0b5, which also recovers from malformed streamed tool arguments). New: `Evidence`
Records, `cerca_discussioni` / `cerca_progetti` / `cerca_domande` / `cerca_paper`, `allega_prova`,
`intervista_simulata`, human validation from players, candidacy requirements as policies
(`requisiti_candidatura_prove_reali` 3, `_fonti_distinte` 2, or `_validazioni_umane` 1 instead), evidence in the
committee's score (`peso_prove_nel_punteggio_comitato` 0.3), plan calls with thinking summaries omitted. No player
joined. Stop rule: budget, 30 real minutes or five committee decisions: **time came first** (stopped at 28 minutes).

Evidence: [docs/evidence/run3/](evidence/run3/), with [evidence.md](evidence/run3/evidence.md) listing every piece
of evidence with its link. Progress log: [docs/run-progress.log](run-progress.log) (`run3` lines). Export:
[docs/portfolio-run3.md](portfolio-run3.md).

## Runs 1 to 3

| | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Real time, stop | 30 min, time | 19 min, budget | 28 min, time |
| Game time | day 1 08:00 to day 2 13:47 | day 1 07:00 to day 3 15:30 | day 1 07:00 to day 4 ~21:00 |
| Model tiers | haiku, Livia sonnet | haiku, Livia sonnet | all haiku |
| Decisions | 213 + 29 group, 480 runs | 293 + 48 group, 663 runs | 468 + 69 group, 369 replies, 1057 runs |
| Failures | 8 (6 `maxTurns`) | 6 (2 group JSON) | 7 (6 no plan committed, 1 reply at `maxToolCalls`), **0 group JSON** |
| Cost | $2.33 | $3.01 | **$2.27** (minds $1.30, hosted web search $0.98) |
| Tokens in / out | 10.78 M / 0.43 M | 15.03 M / 0.63 M | 24.55 M / 1.16 M |
| Prompt cache | hit 0.785, saved $3.04 | hit 0.781, saved $4.06 | hit 0.768, saved $1.58 |
| Web searches | 29 (+7 reads), 22 refused | 10 | 86 (4 cached, 6 over the per-decision cap) |
| Public signal searches | - | - | 38: Hacker News 23, arXiv 9, Stack Overflow 3, GitHub 3 (3 cached, 13 refused: quota, per-decision cap or attachment refusals, one counter) |
| Evidence | - | - | 12: web source 11, public signal 1 (Hacker News); human validation 0; simulated interview 0 |
| Ideas | 2 proposal | 3 proposal | 2 proposal (1 meeting the requirements, 1 created on day 4) |
| Reviews | 7 | 11 | 3 |
| Candidacy gate | - | - | 1 idea passed (3 real pieces from 2 sources by day 1 18:18); 0 submissions, 0 refusals |
| Committee | 1 decision (defer) | 0 | 0 |
| Thoughts language | not counted | en 293, it 1 (summaries) | **it 438** (plan reasons; summaries omitted) |

## Portfolio

Nothing approved, killed or submitted. Full text in [portfolio-run3.md](portfolio-run3.md).

- **Assistente AI per la sicurezza nei team IT piccoli** (champion Livia, authors Livia and Irene; reviews by Dario,
  Matteo, Irene: impact 6, feasibility 6.3, novelty 3.7, fit 6.3, risk 6.7). 12 pieces of evidence, all kept as
  `Evidence` Records on its branch: [Launch HN: Traceforce (44 points)](https://news.ycombinator.com/item?id=48937020),
  [NIST AI 100-2e2025](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-2e2025.pdf),
  [Microsoft Security Copilot triage agent](https://learn.microsoft.com/en-us/defender-xdr/security-alert-triage-agent),
  [The Price of Progress (arXiv 2511.23455)](https://arxiv.org/html/2511.23455v2), [OWASP prompt injection cheat
  sheet](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) and seven
  more ([evidence.md](evidence/run3/evidence.md)). Met the requirements from day 1 18:18 and had two reviews from 19:18:
  submittable for three game days, never submitted.
- **Audit on-premise delle decisioni AI per settori regolati** (Matteo, created day 4 20:20): no reviews, no evidence.

## Why nothing reached the committee

Tooling worked: 38 signal searches and 86 web searches ran, 12 attachments were accepted and written to Lorebase,
the gate computed the requirements and the perception showed them. The stall was social:

- **A bar above the policy.** From day 4 the champion and the reviewers agreed that the idea would not go to the
  committee without verified human interviews ("nome, ruolo, data e frase esatta"); the policy makes human
  validation an alternative path, not a requirement. In the last 500 conversation lines (day 3 23:56 to day 4 22:29)
  177 mention validations or interviews (Livia 55, Dario 45, Irene 36, Matteo 33) and 59 explicitly keep an idea out
  of the committee. Dario called the requirements «un falso verde: 11 prove, ma quasi tutte fonti web a peso 0.5 e
  0 validazioni umane».
- **The perception invited it.** The evidence line showed "validazioni umane 0" next to "requisiti di candidatura
  soddisfatti", and before the pass "validazioni umane 0/1" in the same list as the other counts: read as a missing
  requirement. Fixed after the run: the line now says "requisiti di candidatura soddisfatti per policy, l'idea può
  essere candidata al comitato", marks human validations as optional and lists them as the alternative path.
- **Signals were searched but rarely attached.** 1 of 12 attachments came from the signal tools; the authors preferred
  web pages (11) and themselves discounted vendor pages, which made the evidence look weak to them.
- **No one could validate.** No player joined, and nobody ran `intervista_simulata` (0 calls); several said a
  generated interview is not a validation (`ipotesi`, weight 0, as designed).
- **The committee was never seated,** so the conflict-of-interest seating and the evidence-weighted score were not
  exercised live (the offline run passed the gate and submitted; that pitch waited for quorum because all three
  committee members had become co-authors).

## What changed, what it showed

- **Italian thoughts.** Root cause: the provider's thinking summaries follow the model, not the system prompt, and
  no API parameter sets their language. Plan calls now use `thinking.display: "omitted"`; the visible thought is the
  plan reason, Italian in 438 of 438 runs. A live haiku check with the working-language line first in the
  instructions also gave an Italian summary, but omitted summaries keep the guarantee.
- **Group plan JSON fixed upstream.** 0 failures from malformed tool arguments (2 in run 2) with reinloop 474f0b5.
- **Cost.** All-haiku minds cost $1.30 for 1057 runs; the hosted web search ($0.98 for 86 searches at about $0.01
  plus tokens) became the largest single line. Public signal APIs cost nothing.
- **Honest evidence.** Excerpts written by the authors say what each source does not prove («prezzo di listino di
  un concorrente, non un prezzo accettato da clienti»), and the team refused to pass simulated or web material off as
  validation.

## Problems seen

- The thought of a decision appeared twice in the inspector (once from the decision, once from the committed plan):
  fixed after the run; plan reasons are counted in `reinloop.reasonLangs`, summaries (when on) in `thoughtLangs`.
- `allega_prova` accepted a metric the author wrote for a web page ("10" on a price list): fixed after the run, only
  the source's metric is recorded.
- Signal refusals are one counter for quota, per-decision cap and attachment refusals; the run cannot tell them apart.
- Irene reviewed the idea and later became its co-author (as in run 2): her review still counts.

## Next useful step

A run with the new perception line ("soddisfatti per policy ... può essere candidata"), a player in the hub giving one
or two validations from the "Valida idea" panel, and the committee members kept out of authorship (or a larger
committee), to see whether a submission happens and how the committee weighs evidence in its vote.
