import type { Company, CommitteeDecision, CommitteeVote, GameTime, Group, Idea, IdeaAction, IdeaScores, IdeaStage, Quarter, ServerMsg } from '../net/protocol';

/** Real seconds (speed-scaled) between two pipeline moves, and the minimum gap between new signals. */
const ADVANCE_EVERY: [number, number] = [6, 10];
const SPARK_GAP = 14;
/** Ideas kept on the board in the early stages before new signals stop being sparked. */
const MAX_OPEN = 14;

interface Hooks {
  emit: (m: ServerMsg) => void;
  r: () => number;
  now: () => GameTime;
  quarter: () => Quarter;
  freeze: () => boolean;
  rule: (key: string) => number;
  agents: () => { id: string; name: string; role: string; groupId: string | null }[];
  group: (id: string) => Group | undefined;
  speed: number;
}

type Seed = Omit<Idea, 'stage' | 'champion' | 'authors' | 'scores' | 'reviews' | 'branch' | 'proposalId' | 'quarter' | 'history'> & {
  stage: IdeaStage;
  champion: string;
  authors: string[];
  scores: IdeaScores;
};

const S = (impact: number, feasibility: number, novelty: number, fit: number, risk: number): IdeaScores => ({ impact, feasibility, novelty, fit, risk });

const SEEDS: Seed[] = [
  {
    code: 'IDEA-001', title: 'Agent firewall per tool MCP', stage: 'pitch', champion: 'a-ottavia', authors: ['a-ottavia', 'a-carla'],
    problem: 'Gli agenti chiamano tool esterni senza un punto di controllo: dati sensibili escono e azioni distruttive passano inosservate.',
    users: 'Platform team e security officer di aziende che mettono agenti in produzione.',
    solution: 'Un proxy tra agente e server di tool che applica policy dichiarative, maschera i dati e chiede conferma umana per le azioni a rischio.',
    differentiation: 'Policy versionate e testabili come codice, con replay delle chiamate per l’audit.',
    feasibility: 'Prototipo di proxy in 3 settimane; la parte difficile è il catalogo di policy di base.',
    risks: 'Latenza aggiunta; i grandi provider potrebbero integrarlo nativamente.',
    tags: ['security', 'agenti', 'platform'], scores: S(4.6, 3.8, 4.1, 4.5, 3.2),
  },
  {
    code: 'IDEA-002', title: 'Diff semantico per schemi dati', stage: 'proposal', champion: 'a-davide', authors: ['a-davide', 'a-bruno'],
    problem: 'Le modifiche agli schemi rompono pipeline a valle e nessuno se ne accorge finché i report non sono sbagliati.',
    users: 'Data engineer e analytics engineer con decine di modelli dati condivisi.',
    solution: 'Un diff che capisce il significato del cambiamento (rinomina, cambio di unità, cardinalità) e stima l’impatto sui consumer.',
    differentiation: 'Ragiona sulla semantica, non sul testo: segnala che "importo" è passato da euro a centesimi.',
    feasibility: 'Buona: i metadati esistono già nei cataloghi; serve un motore di regole più un modello per i casi ambigui.',
    risks: 'Falsi positivi che fanno ignorare gli avvisi.',
    tags: ['dati', 'devtools'], scores: S(4.0, 4.2, 3.8, 4.0, 2.4),
  },
  {
    code: 'IDEA-003', title: 'Copilota per post-mortem incident', stage: 'concept', champion: 'a-serena', authors: ['a-serena', 'a-elena'],
    problem: 'Scrivere un post-mortem richiede giorni di ricostruzione da chat, log e ticket; spesso non viene fatto.',
    users: 'SRE e incident commander di team con on-call.',
    solution: 'Ricostruisce la timeline da chat e allarmi, propone cause contribuenti e azioni, lascia all’umano il giudizio.',
    differentiation: 'Formato blameless guidato e collegamento automatico alle azioni aperte.',
    feasibility: 'Media: integrazioni con chat e sistemi di allarme sono il grosso del lavoro.',
    risks: 'Dati sensibili nelle chat; resistenza culturale.',
    tags: ['sre', 'ops'], scores: S(3.8, 3.6, 3.4, 3.9, 2.8),
  },
  {
    code: 'IDEA-004', title: 'Tracciamento costi LLM per feature', stage: 'insight', champion: 'a-bruno', authors: ['a-bruno'],
    problem: 'Le aziende non sanno quanto costa ogni funzionalità basata su modelli linguistici finché non arriva la fattura.',
    users: 'Product manager e FinOps.',
    solution: 'SDK leggero che etichetta ogni chiamata con feature e cliente e mostra costo e margine per feature.',
    differentiation: 'Costo unitario per cliente e per feature, non solo per chiave API.',
    feasibility: 'Alta.',
    risks: 'Mercato affollato.',
    tags: ['finops'], scores: S(3.6, 4.5, 2.6, 3.8, 2.0),
  },
  {
    code: 'IDEA-005', title: 'Generatore di test da specifiche OpenAPI', stage: 'killed', champion: 'a-davide', authors: ['a-davide'],
    problem: 'Le API cambiano più in fretta dei test di contratto.',
    users: 'Team backend e QA.',
    solution: 'Genera e mantiene test di contratto e casi limite dalle specifiche.',
    differentiation: 'Casi limite derivati dagli esempi reali di traffico.',
    feasibility: 'Alta.',
    risks: 'Esistono già molti strumenti simili: differenziazione debole.',
    tags: ['devtools', 'qa'], scores: S(3.0, 4.6, 2.0, 3.2, 1.8),
  },
  {
    code: 'IDEA-006', title: 'Catalogo prompt versionato con review', stage: 'approved', champion: 'a-sergio', authors: ['a-sergio', 'a-ada'],
    problem: 'I prompt vivono sparsi nel codice; una modifica cambia il comportamento del prodotto senza review.',
    users: 'Team prodotto che usano modelli linguistici in più servizi.',
    solution: 'Catalogo con branch, review e valutazioni automatiche prima del merge.',
    differentiation: 'Ogni modifica porta con sé l’esito delle valutazioni sul dataset di riferimento.',
    feasibility: 'Alta: riusa il flusso di review del codice.',
    risks: 'Adozione: serve disciplina nei team.',
    tags: ['platform', 'qualità'], scores: S(4.1, 4.4, 3.5, 4.6, 2.2),
  },
  {
    code: 'IDEA-007', title: 'Sandbox di dati sintetici GDPR-safe', stage: 'signal', champion: 'a-ada', authors: ['a-ada'],
    problem: 'Gli ambienti di test usano copie dei dati di produzione.',
    users: 'Team di sviluppo in settori regolati.',
    solution: '', differentiation: '', feasibility: '', risks: '',
    tags: ['privacy', 'dati'], scores: S(3.9, 3.0, 3.6, 3.7, 3.4),
  },
  {
    code: 'IDEA-008', title: 'Radar delle dipendenze open source a rischio', stage: 'signal', champion: 'a-elena', authors: ['a-elena'],
    problem: 'Librerie critiche mantenute da una sola persona: nessuno lo sa finché non smettono di essere aggiornate.',
    users: 'CTO e responsabili della supply chain software.',
    solution: '', differentiation: '', feasibility: '', risks: '',
    tags: ['security', 'open source'], scores: S(3.5, 4.0, 3.2, 3.4, 2.5),
  },
  {
    code: 'IDEA-009', title: 'Assistente migrazioni SQL a zero downtime', stage: 'insight', champion: 'a-carla', authors: ['a-carla', 'a-davide'],
    problem: 'Le migrazioni su tabelle grandi bloccano il database o richiedono finestre notturne.',
    users: 'Team backend con database relazionali grandi.',
    solution: 'Pianifica la migrazione in passi compatibili e verifica ogni passo su una copia.',
    differentiation: '', feasibility: '', risks: '',
    tags: ['dati', 'devtools'], scores: S(3.9, 3.2, 3.3, 3.6, 3.6),
  },
  {
    code: 'IDEA-010', title: 'Monitor del drift per modelli in produzione', stage: 'concept', champion: 'a-ada', authors: ['a-ada', 'a-bruno'],
    problem: 'I modelli peggiorano in silenzio quando cambiano i dati in ingresso.',
    users: 'Team ML con modelli in produzione.',
    solution: 'Confronta le distribuzioni in ingresso con quelle di training e collega il drift alle metriche di business.',
    differentiation: 'Allarmi tarati sull’impatto di business, non sulla statistica pura.',
    feasibility: 'Media.',
    risks: 'Integrazioni eterogenee.',
    tags: ['ml', 'osservabilità'], scores: S(3.7, 3.5, 2.9, 3.5, 2.6),
  },
];

/** Web sources attached to some seed ideas. */
const SOURCES: Record<string, { title: string; url: string }[]> = {
  'IDEA-001': [
    { title: 'OWASP Top 10 for LLM Applications', url: 'https://owasp.org/www-project-top-10-for-large-language-model-applications/' },
    { title: 'Model Context Protocol', url: 'https://modelcontextprotocol.io/' },
  ],
  'IDEA-002': [{ title: '', url: 'https://json-schema.org/understanding-json-schema' }],
  'IDEA-004': [{ title: 'Anthropic API pricing', url: 'https://www.anthropic.com/pricing' }],
};

/** Signals that turn into new ideas while the hub works. */
const SPARKS: { title: string; problem: string; tags: string[] }[] = [
  { title: 'Rilevatore di flaky test con causa probabile', problem: 'I test instabili fanno perdere ore e minano la fiducia nella CI.', tags: ['qa', 'devtools'] },
  { title: 'Mappa architetturale per l’onboarding', problem: 'I nuovi sviluppatori impiegano settimane a capire come è fatto il sistema.', tags: ['devex'] },
  { title: 'Valutazione continua degli agenti di supporto', problem: 'Nessuno misura se le risposte degli assistenti peggiorano dopo un rilascio.', tags: ['qualità', 'agenti'] },
  { title: 'Riassunti di review del codice per i manager', problem: 'I manager non vedono dove si accumula il debito tecnico.', tags: ['devex'] },
  { title: 'Guardrail di costo per pipeline di dati', problem: 'Una query sbagliata in pipeline può costare migliaia di euro in una notte.', tags: ['finops', 'dati'] },
  { title: 'Traduttore di runbook in automazioni verificate', problem: 'I runbook sono documenti che nessuno aggiorna né esegue.', tags: ['sre', 'agenti'] },
];

const THEMES: Record<Quarter, string[]> = {
  Q1: ['Sicurezza degli agenti', 'Qualità dei dati'],
  Q2: ['Esperienza degli sviluppatori', 'Costi sotto controllo'],
  Q3: ['Agenti in produzione', 'Dati affidabili', 'Developer experience'],
  Q4: ['Efficienza operativa', 'Fiducia e compliance'],
};
const FREEZE_THEME = 'Costo minimo';

const NEXT_STAGE: Partial<Record<IdeaStage, IdeaStage>> = { signal: 'insight', insight: 'concept', concept: 'proposal', proposal: 'pitch' };
const STAGE_NOTE: Partial<Record<IdeaStage, string>> = {
  insight: 'Segnale confermato da più fonti: diventa un insight.',
  concept: 'Soluzione e differenziazione abbozzate: diventa un concept.',
  proposal: 'Proposta scritta e aperta in revisione su Lorebase.',
  pitch: 'Review completate: pronta per il comitato investimenti.',
};

const REVIEW_COMMENTS = [
  'Problema reale, ma l’utente va nominato meglio.',
  'Differenziazione convincente; la fattibilità è ottimista.',
  'Mi preoccupa il rischio di adozione: servono due clienti pilota.',
  'Ben allineata ai temi del trimestre.',
  'Il mercato è affollato: cosa ci rende diversi in una frase?',
  'Ottimo segnale, ma i dati a supporto sono ancora pochi.',
];

const clamp5 = (v: number) => Math.round(Math.max(1, Math.min(5, v)) * 10) / 10;
const slug = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/** The idea pipeline of the mock hub: signals become ideas, ideas get reviewed and pitched to the committee. */
export class IdeaPipeline {
  private ideas = new Map<string, Idea>();
  private slotsLeft: number;
  private themes: string[];
  private seq = SEEDS.length;
  private nextAt = 5;
  private sparkAt = 8;
  private sparkIdx = 0;
  private deferred = new Set<string>();

  constructor(private h: Hooks) {
    const q = h.quarter();
    this.themes = [...THEMES[q]];
    this.slotsLeft = Math.max(0, h.rule('ideas.slots_per_quarter') - 1);
    const at = h.now();
    for (const s of SEEDS) {
      const idea: Idea = {
        ...s,
        champion: this.nm(s.champion),
        authors: s.authors.map((a) => this.nm(a)),
        sources: SOURCES[s.code],
        scores: s.stage === 'signal' ? null : s.scores,
        reviews: [],
        branch: `idea/${slug(s.title)}`,
        proposalId: ['proposal', 'pitch', 'approved', 'killed'].includes(s.stage) ? `ip-${s.code.slice(-3)}` : null,
        quarter: q,
        history: [{ at, by: this.nm(s.champion), action: 'created', note: 'Segnale registrato.' }],
      };
      if (['pitch', 'approved', 'killed'].includes(s.stage)) idea.reviews = this.makeReviews(idea, 2);
      if (s.stage === 'approved' || s.stage === 'killed') idea.history.push({ at, by: this.nm('g-board'), action: s.stage, note: s.stage === 'approved' ? 'Approvata dal comitato investimenti.' : 'Scartata dal comitato: differenziazione debole.' });
      this.ideas.set(idea.code, idea);
    }
  }

  /** Idea people are names: entity (or group) id -> display name. */
  private nm(id: string): string {
    return this.h.agents().find((a) => a.id === id)?.name ?? this.h.group(id)?.name ?? id;
  }

  // ------------------------------------------------------------ queries

  list(): Idea[] {
    return [...this.ideas.values()].map((i) => structuredClone(i));
  }

  get(code: string): Idea | undefined {
    const i = this.ideas.get(code);
    return i && structuredClone(i);
  }

  company(): Company {
    return { name: 'Officina delle Idee', quarter: this.h.quarter(), slotsLeft: this.slotsLeft, themes: [...this.themes], freeze: this.h.freeze() };
  }

  championedBy(id: string): string | undefined {
    for (const i of this.ideas.values()) if (i.champion === this.nm(id) && i.stage !== 'killed') return `«${i.title}»`;
    return undefined;
  }

  // ------------------------------------------------------------ events from the world

  tick(_dt: number, elapsed: number): void {
    if (elapsed < this.nextAt) return;
    this.nextAt = elapsed + ADVANCE_EVERY[0] + this.h.r() * (ADVANCE_EVERY[1] - ADVANCE_EVERY[0]);
    const open = [...this.ideas.values()].filter((i) => i.stage !== 'approved' && i.stage !== 'killed');
    if (!open.length) return;
    // later stages move first more often, so pitches reach the committee
    open.sort((a, b) => this.rank(b.stage) - this.rank(a.stage));
    const pick = open[Math.floor(Math.pow(this.h.r(), 1.6) * open.length)];
    this.advance(pick);
    if (elapsed >= this.sparkAt && open.length < MAX_OPEN && this.h.r() < 0.35) this.spark(this.randomAgent()?.id ?? 'a-ada', elapsed);
  }

  /** A gathered signal may become a new idea on the board. */
  spark(by: string, elapsed = 0): void {
    if (elapsed && elapsed < this.sparkAt) return;
    this.sparkAt = Math.max(this.sparkAt, elapsed) + SPARK_GAP;
    const open = [...this.ideas.values()].filter((i) => i.stage === 'signal').length;
    if (open >= 3 || this.sparkIdx >= SPARKS.length) return;
    const sp = SPARKS[this.sparkIdx++];
    const code = `IDEA-${String(++this.seq).padStart(3, '0')}`;
    const at = this.h.now();
    const idea: Idea = {
      code, title: sp.title, problem: sp.problem, users: '', solution: '', differentiation: '', feasibility: '', risks: '', tags: sp.tags,
      stage: 'signal', champion: this.nm(by), authors: [this.nm(by)], scores: null, reviews: [], branch: `idea/${slug(sp.title)}`, proposalId: null,
      quarter: this.h.quarter(), history: [{ at, by: this.nm(by), action: 'created', note: 'Nuovo segnale raccolto.' }],
    };
    this.ideas.set(code, idea);
    this.emitIdea(idea, 'created');
  }

  newQuarter(q: Quarter): void {
    this.slotsLeft = this.h.rule('ideas.slots_per_quarter');
    this.themes = [...THEMES[q]];
    this.deferred.clear();
    this.emitCompany();
  }

  setFreeze(on: boolean): void {
    this.themes = on ? [...this.themes.filter((t) => t !== FREEZE_THEME), FREEZE_THEME] : this.themes.filter((t) => t !== FREEZE_THEME);
    if (on) this.slotsLeft = Math.min(this.slotsLeft, 1);
    this.emitCompany(on);
  }

  /** Someone left: their ideas get a new champion. */
  orphan(id: string, name: string): void {
    for (const i of this.ideas.values()) {
      if (i.champion !== name || i.stage === 'killed') continue;
      const heir = this.randomAgent((a) => a.id !== id && i.authors.includes(a.name)) ?? this.randomAgent((a) => a.id !== id);
      if (!heir) continue;
      i.champion = heir.name;
      i.history.push({ at: this.h.now(), by: heir.name, action: 'champion', note: `${heir.name} prende in carico l’idea.` });
      this.emitIdea(i, 'updated');
    }
  }

  // ------------------------------------------------------------ pipeline

  private rank(s: IdeaStage): number {
    return ['signal', 'insight', 'concept', 'proposal', 'pitch'].indexOf(s);
  }

  private advance(i: Idea): void {
    const at = this.h.now();
    if (i.stage === 'pitch') return this.committee(i);
    if (i.stage === 'proposal' && i.reviews.length < Math.max(1, this.h.rule('review.min_reviewers'))) {
      const [rev] = this.makeReviews(i, 1);
      i.reviews.push(rev);
      i.history.push({ at, by: rev.by, action: 'reviewed', note: rev.comment });
      return this.emitIdea(i, 'reviewed');
    }
    const next = NEXT_STAGE[i.stage];
    if (!next) return;
    const prev = i.stage;
    i.stage = next;
    const helper = this.randomAgent((a) => !i.authors.includes(a.name));
    if (helper && i.authors.length < 3 && this.h.r() < 0.5) i.authors.push(helper.name);
    if (next === 'insight') {
      i.users ||= 'Team tecnici di aziende medio-grandi.';
      i.scores = this.selfScore(i);
    }
    if (next === 'concept') {
      i.solution ||= 'Un servizio leggero che si integra negli strumenti esistenti e automatizza la parte ripetitiva.';
      i.differentiation ||= 'Parte dal problema dell’utente, non dalla tecnologia.';
      i.feasibility ||= 'Prototipo in poche settimane con il team attuale.';
      i.risks ||= 'Adozione e concorrenza da verificare.';
    }
    if (next === 'proposal') {
      i.proposalId = `ip-${i.code.slice(-3)}`;
      i.history.push({ at, by: i.champion ?? '', action: 'submitted', note: `Proposta aperta su ⎇ ${i.branch}.` });
      return this.emitIdea(i, 'submitted');
    }
    i.history.push({ at, by: i.champion ?? '', action: 'stage', note: STAGE_NOTE[next] ?? `${prev} → ${next}` });
    this.emitIdea(i, next === 'insight' || next === 'concept' ? 'updated' : 'stage');
  }

  /** Committee verdict: average of the scores, risk weighed by the risk appetite policy. */
  private committee(i: Idea): void {
    const at = this.h.now();
    const s = i.scores ?? this.selfScore(i);
    const appetite = this.h.rule('risk.appetite');
    const threshold = this.h.rule('committee.approve_threshold');
    let value = (s.impact + s.feasibility + s.novelty + s.fit) / 4 - Math.max(0, s.risk - 2.5) * (1 - appetite) * 0.8;
    if (this.h.freeze() && s.feasibility < 3.8) value -= 0.3;
    const board = this.h.group('g-board');
    const members = (board?.members ?? []).filter((m) => this.h.agents().some((a) => a.id === m));
    const votes: CommitteeVote[] = members.map((m) => {
      const v = value + (this.h.r() - 0.5) * 0.8;
      const vote: CommitteeDecision = v >= threshold ? 'approve' : v < threshold - 0.5 ? 'kill' : 'defer';
      const reason = vote === 'approve' ? 'Impatto alto e coerente con i temi.' : vote === 'kill' ? (s.risk > 3 ? 'Troppo rischiosa con l’attuale propensione al rischio.' : 'Differenziazione insufficiente.') : 'Servono più dati prima di decidere.';
      return { member: m, vote, reason };
    });
    const tally = (d: CommitteeDecision) => votes.filter((v) => v.vote === d).length;
    let decision: CommitteeDecision = tally('approve') > votes.length / 2 ? 'approve' : tally('kill') > votes.length / 2 ? 'kill' : 'defer';
    if (decision === 'approve' && this.slotsLeft <= 0) decision = 'defer';
    if (decision === 'defer' && this.deferred.has(i.code)) decision = value >= threshold - 0.2 && this.slotsLeft > 0 ? 'approve' : 'kill';
    const name = (id: string) => this.h.agents().find((a) => a.id === id)?.name ?? id;
    const summary =
      decision === 'approve'
        ? `«${i.title}» approvata (${tally('approve')}/${votes.length}): entra nel portfolio del ${this.h.quarter()}.`
        : decision === 'kill'
          ? `«${i.title}» scartata (${tally('kill')}/${votes.length}): ${votes.find((v) => v.vote === 'kill')?.reason ?? 'non convince.'}`
          : `«${i.title}» rinviata: ${this.slotsLeft <= 0 ? 'nessuno slot libero nel trimestre.' : 'il comitato vuole più dati.'}`;
    votes.forEach((v, k) =>
      setTimeout(
        () => this.h.emit({ type: 'deliberation', groupId: 'g-board', pattern: 'council', member: v.member, role: 'voter', text: `${v.vote === 'approve' ? 'Approvo' : v.vote === 'kill' ? 'Scarto' : 'Rinvio'}: ${v.reason}` }),
        (k * 700) / this.h.speed,
      ),
    );
    setTimeout(() => {
      this.h.emit({ type: 'committee', groupId: 'g-board', ideaCode: i.code, decision, votes, summary });
      if (decision === 'defer') {
        this.deferred.add(i.code);
        i.history.push({ at, by: this.nm('g-board'), action: 'deferred', note: summary });
        this.emitIdea(i, 'updated');
        return;
      }
      i.stage = decision === 'approve' ? 'approved' : 'killed';
      i.history.push({ at, by: this.nm('g-board'), action: i.stage, note: `${summary} Voti: ${votes.map((v) => `${name(v.member)} ${v.vote}`).join(', ')}.` });
      if (decision === 'approve') this.slotsLeft = Math.max(0, this.slotsLeft - 1);
      this.emitIdea(i, decision === 'approve' ? 'approved' : 'killed');
      if (decision === 'approve') this.emitCompany();
    }, (votes.length * 700 + 400) / this.h.speed);
  }

  private selfScore(i: Idea): IdeaScores {
    const r = this.h.r;
    const base = SEEDS.find((s) => s.code === i.code)?.scores;
    return base ?? S(clamp5(3 + r() * 1.8), clamp5(2.8 + r() * 2), clamp5(2.6 + r() * 2), clamp5(3 + r() * 1.6), clamp5(1.8 + r() * 2.4));
  }

  private makeReviews(i: Idea, n: number): Idea['reviews'] {
    const out: Idea['reviews'] = [];
    const s = i.scores ?? this.selfScore(i);
    for (let k = 0; k < n; k++) {
      const by = this.randomAgent((a) => a.name !== i.champion && (a.role === 'critic' || a.role === 'strategist' || this.h.r() < 0.4))?.name ?? 'Sergio';
      const j = () => (this.h.r() - 0.5) * 0.9;
      out.push({
        by,
        scores: S(clamp5(s.impact + j()), clamp5(s.feasibility + j()), clamp5(s.novelty + j()), clamp5(s.fit + j()), clamp5(s.risk + j())),
        comment: REVIEW_COMMENTS[Math.floor(this.h.r() * REVIEW_COMMENTS.length)],
        at: this.h.now(),
      });
    }
    return out;
  }

  private randomAgent(pred: (a: { id: string; name: string; role: string }) => boolean = () => true) {
    const list = this.h.agents().filter(pred);
    return list[Math.floor(this.h.r() * list.length)];
  }

  private emitIdea(i: Idea, action: IdeaAction): void {
    this.h.emit({ type: 'idea', idea: structuredClone(i), action });
  }

  private emitCompany(freeze = this.h.freeze()): void {
    this.h.emit({ type: 'company', quarter: this.h.quarter(), slotsLeft: this.slotsLeft, themes: [...this.themes], freeze });
  }
}
