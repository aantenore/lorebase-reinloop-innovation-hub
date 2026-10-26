# Prompts

What the people of the hub read. The prompt is minimal: identity, role in the company, faculties and
factual perception. No tasks, no goals, no strategy, no advice on when to use a tool. Everything
they read is Italian (`config/i18n/it.rt.json`, language in `config/sim.json`); code identifiers,
policy keys and logs stay in English. Policies are not in the prompt: they live in Lorebase and are
consulted with the `lorebase_*` tools.

## Parts

| Part | Source |
|------|--------|
| Instructions (system) | `rt.instructions`: name and personality, the hub (people here generate and evaluate IT product ideas, they do not build them), role code and title (Lorebase `Role`), the faculties (a mind connected to Lorebase: policies, the role's playbook, the newsletter, the portfolio of approved ideas; a private memory `remember`/`recall`) and the plan interface (`commit_plan`, horizon of the tier) |
| Observation (user message, at each decision) | `rt.observation.*`, `rt.look.*`, `rt.recipes.*`, `rt.body.*`: day, hour, quarter and freeze; energy, stress, what the person carries (codes and names) and where; body changes since it last thought; group; current step; why it thinks again (a fact); what it sees within `vision_radius` (rooms, coffee, whiteboard material, desks, colleagues, signals to pick up); the work methods it knows and what it lacks; seniority; exchange offers; hearsay; the company line; the ideas block; what was said to it; what it lived; which policies changed |
| Tools | `commit_plan`, `say`, `form_group`, `join_group`, `leave_group`, `scambia`, `chiedi`, `rispondi_scambio`, `giudica`, `testimonia`, `proponi_legge` (a policy proposal), `share_insight` / `review_insights` / `judge_insight` (role playbook), the idea tools below; Lorebase read tools from Herald; private memory `remember` / `recall` |
| Spoken reply | same instructions + `rt.replyInstructions`; short observation; optional `rethink` |
| Group members | `rt.memberInstructions` + the group situation (`rt.group.*`); plan writers get `commit_plan`, proposers prose; both get the faculties line, the Lorebase and memory tools and the idea tools; judges, voters and routers answer with structured output and no tools |
| Committee | `rt.committee.voteTask` (each consulted member, structured `{vote, reason}`), `rt.committee.chairTask` (the chair, structured `{decision, summary}`); the brief is `rt.committee.idea` + `rt.committee.company` |

## Idea tools

Descriptions say what each tool does, never when or why to use it (`rt.tools.idea.*`):

| Tool | Arguments | Effect |
|------|-----------|--------|
| `proponi_idea` | `title`, `problem`, `users?`, `solution?`, `differentiation?`, `feasibility?`, `risks?`, `tags?`, `signals?` | a new idea on its own `idea/<code>` branch, the person as champion; carried items named in `signals` (signals, work artifacts) go into it |
| `arricchisci_idea` | `code` + any field | adds or rewrites fields of an open idea; the editor becomes a co-author |
| `valuta_idea` | `code`, `impact`, `feasibility`, `novelty`, `fit`, `risk` (0-10), `comment` | a peer review (never of one's own idea; one per person, a new one replaces the old) |
| `candida_al_comitato` | `code` | an author submits a complete idea with enough reviews; a Proposal into `main` opens |
| `leggi_idea` | `code` | the idea in full (fields, authors, reviews, weighted score, history) |

Refusals are facts (`rt.ideaReason.*`): "l'idea non è completa", "non ha ancora abbastanza valutazioni",
"il comitato l'ha rimandata e da allora non è cambiato niente". The numbers behind them (reviewers,
slots, quorum) are policies to consult in Lorebase.

## Company and ideas in perception

Two blocks, facts only:

- `AZIENDA`: quarter, approval slots left this quarter (rule `quarter_idea_slots` minus approvals),
  freeze on or off, the person's career step.
- `IDEE IN AZIENDA`: up to `ideas.perceiveMax` open ideas (the person's first) and the latest decided
  ones: code, title, stage, champion, authors, number of reviews, whether it is the person's or reviewed
  by it, which fields are missing.

Why a person thinks again may also be a fact about ideas (`rt.why.idea.*`: a colleague reviewed your idea,
the committee approved, killed or deferred it) or the end of a quarter (`rt.why.quarter`).

The strategic themes are policies (category `strategy`): they are not in the prompt, people read them in
Lorebase like any policy. The committee brief carries the weighted score of the reviews computed with the
evaluation policies (`weight_*`, risk counted inverted): a fact derived from the policies, not advice.

## Rendered example

Giulia (architetto, sonnet) at the start of a mock world; the company and ideas blocks as the game adds them.

```text
Sei Giulia, una delle menti più brillanti del mondo agentico. Il tuo carattere: Pragmatica, diffida delle architetture eleganti che nessuno sa gestire.
Lavori nell'hub innovazione di un'azienda IT: qui le persone generano e valutano idee di prodotto (software, AI, infrastruttura, strumenti per sviluppatori, sicurezza, dati); non le costruiscono.
Il tuo ruolo nell'azienda: Architetto (architetto).
La tua mente è collegata a Lorebase (strumenti lorebase_*): lì trovi le policy dell'azienda, il playbook condiviso del tuo ruolo, la newsletter aziendale e il portafoglio delle idee approvate. Hai anche una memoria privata (remember/recall).
Il tempo scorre senza pause. Quando ti fermi a pensare fissi con commit_plan ciò che farai per circa 60 minuti; mentre pensi continui a fare ciò che stavi facendo.
Pensi e parli in italiano.
```

```text
GIORNO 1, ORE 08:00 (orario di lavoro). Trimestre Q1; il freeze di fine anno arriva tra 630 minuti.

TU: energia 10/10, stress 0; porti: 1 Insight (insight); attrezzi: nessuno; sei in (20,16); non sei a una postazione; cammini a 2 caselle al minuto e lavori a rapidità 1.

IL TUO GRUPPO: nessuno.

STAVI FACENDO: niente.

PERCHÉ CI RIPENSI: arrivi in ufficio e ti guardi intorno per la prima volta.

CIÒ CHE PERCEPISCI:
Sei in (20,16) in piazza centrale: caffè 0, materiale 0.
Il campus misura 40x30 caselle; x cresce verso est, y verso sud. I muri non si attraversano: si passa dalle porte.
Caselle con caffè, materiale o postazioni entro 7: ...
Segnali da cogliere in vista: Modelli piccoli alla pari dei grandi (research_modelli_piccoli_nicchia) in (19,21); Retrieval migliore con grafi strutturati (research_retrieval_grafi) in (19,21); ...
Persone in vista: Enea [Ricercatore] in (20,13) energia 10 stress 0; porta: niente; non sta facendo niente.
Postazione più vicina: (17,23) livello 1, a 7 caselle.
Gruppi qui intorno: nessuno.

METODI DI LAVORO CHE CONOSCI:
- Sintetizzare un insight (sintesi_insight): 1 segnale di tendenza qualsiasi (@trend), 1 problema degli utenti qualsiasi (@pain) -> 1 Insight (insight); ti manca: ...
- Scrivere una nota di fattibilità (nota_fattibilita): 1 Insight (insight), 1 risultato di ricerca qualsiasi (@research) -> 1 Nota di fattibilità (nota_fattibilita); ti manca: 1 risultato di ricerca qualsiasi (@research)
- Scrivere un concept (concept): 1 Insight (insight), 1 Nota di fattibilità (nota_fattibilita) -> 1 Concept di prodotto (concept); si fa dove c'è una postazione (shelter); ti manca: 1 Nota di fattibilità (nota_fattibilita)

AZIENDA: Hub Innovazione; trimestre Q1; slot di approvazione rimasti nel trimestre: 3 su 3; nessun freeze in corso. La tua carriera: Senior.

IDEE IN AZIENDA:
- ci-senza-test-instabili-70t38: «CI senza test instabili» (concept); champion Livia; autori Livia; valutazioni 0; mancano: differenziazione, fattibilità, rischi

CIÒ CHE TI È STATO DETTO:
- niente

CIÒ CHE RICORDI:
- niente
```

## Offline mock provider

`npm run game:mock` (or no `ANTHROPIC_API_KEY`) replaces every model with a deterministic heuristic
(`server/src/rt/mock.ts`, `mockIdeaCalls` in `server/src/rt/decide.ts`, the committee stand-in in
`server/src/rt/game.ts`): people propose ideas from the seeds `rt.mock.ideas.<n>`, enrich missing fields
by role, review with scores derived from the idea code, submit ready ideas; the committee approves from
`mock.committeeApproveAt`, kills below `mock.committeeKillBelow`, defers in between. It does not read
these prompts: it is a fallback, not an agent.

## Legacy tick dashboard

`npm run dev` still runs the turn-based dashboard inherited from the engine (`config/i18n/it.json`); it
knows nothing of ideas.
