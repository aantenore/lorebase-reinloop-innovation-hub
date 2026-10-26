import type { Group, Rule, Tier } from '../net/protocol';

export interface AgentSeed {
  id: string;
  name: string;
  role: string;
  tier: Exclude<Tier, 'human'>;
  groupId: string;
  speed: number;
  persona: string;
}

export const MODELS: Record<string, string> = {
  opus: 'modello-avanzato',
  sonnet: 'modello-bilanciato',
  haiku: 'modello-rapido',
  human: 'umano',
};

export const AGENTS: AgentSeed[] = [
  { id: 'a-ottavia', name: 'Ottavia', role: 'strategist', tier: 'opus', groupId: 'g-board', speed: 1.5, persona: 'visionaria e spietata sulle priorità' },
  { id: 'a-sergio', name: 'Sergio', role: 'critic', tier: 'sonnet', groupId: 'g-board', speed: 1.4, persona: 'scettico e ironico, ama i numeri' },
  { id: 'a-serena', name: 'Serena', role: 'designer', tier: 'sonnet', groupId: 'g-review', speed: 1.4, persona: 'empatica e ossessionata dai dettagli' },
  { id: 'a-ada', name: 'Ada', role: 'researcher', tier: 'haiku', groupId: 'g-track', speed: 1.8, persona: 'curiosa e instancabile' },
  { id: 'a-bruno', name: 'Bruno', role: 'analyst', tier: 'haiku', groupId: 'g-track', speed: 1.6, persona: 'metodico e diffidente dei trend' },
  { id: 'a-carla', name: 'Carla', role: 'engineer', tier: 'haiku', groupId: 'g-board', speed: 1.6, persona: 'pragmatica, stima tutto in sprint' },
  { id: 'a-davide', name: 'Davide', role: 'engineer', tier: 'haiku', groupId: 'g-track', speed: 1.7, persona: 'sperimentatore, prototipa per gioco' },
  { id: 'a-elena', name: 'Elena', role: 'analyst', tier: 'haiku', groupId: 'g-review', speed: 1.5, persona: 'precisa e paziente con i dati' },
];

export const CROWD_NAMES = ['Luca', 'Marta', 'Nico'];

export const GROUPS: Group[] = [
  {
    id: 'g-board',
    name: 'Comitato investimenti',
    pattern: 'council',
    members: ['a-ottavia', 'a-sergio', 'a-carla'],
    leader: 'a-ottavia',
    color: '#d4a020',
    lastDecision: {
      summary: 'Il comitato approva lo studio su "assistente per audit contabili": punteggio medio 3,8, Sergio chiede un utente nominato.',
      trace: [
        { member: 'a-ottavia', role: 'leader', text: 'Il mercato c’è e nessuno lo serve bene. Propongo di approvare e passare al business case.' },
        { member: 'a-sergio', role: 'critic', text: 'Chi è il primo utente pagante? Senza un nome la valuto 2.' },
        { member: 'a-carla', role: 'proposer', text: 'Tecnicamente è fattibile in due sprint, ma i dati vanno validati.' },
      ],
    },
  },
  {
    id: 'g-track',
    name: 'Discovery track',
    pattern: 'chain',
    members: ['a-ada', 'a-bruno', 'a-davide'],
    leader: 'a-ada',
    color: '#3a9ad0',
    lastDecision: {
      summary: 'Ada raccoglie i segnali, Bruno li valida con i dati, Davide verifica la fattibilità.',
      trace: [
        { member: 'a-ada', role: 'proposer', text: 'Tre interviste su cinque citano la riconciliazione manuale come dolore.' },
        { member: 'a-bruno', role: 'router', text: 'Allora confronto i volumi con il benchmark di settore prima di passarlo a Davide.' },
        { member: 'a-davide', role: 'leader', text: 'Se i dati reggono, preparo una stima di fattibilità in giornata.' },
      ],
    },
  },
  {
    id: 'g-review',
    name: 'Design review',
    pattern: 'mentor',
    members: ['a-serena', 'a-elena'],
    leader: 'a-serena',
    color: '#8a5ad0',
    lastDecision: {
      summary: 'Elena presenta un one-pager; Serena lo rimanda indietro: manca il problema dell’utente.',
      trace: [
        { member: 'a-elena', role: 'proposer', text: 'Ecco il one-pager: mercato grande, trend in crescita.' },
        { member: 'a-serena', role: 'critic', text: 'Grande per chi? Descrivi la giornata di una persona vera e rifacciamo il mockup.' },
        { member: 'a-elena', role: 'proposer', text: 'Torno con due interviste e una persona più concreta.' },
      ],
    },
  },
  {
    id: 'g-interns',
    name: 'Stagisti',
    pattern: 'crowd',
    members: ['c-0', 'c-1', 'c-2'],
    leader: null,
    color: '#7ab060',
    lastDecision: { summary: 'Una sola mente muove gli stagisti: girare tra le scrivanie, ascoltare e prendere appunti.', trace: [] },
  },
];

export const ASSEMBLY_DECISION: Group['lastDecision'] = {
  summary: 'Con il budget congelato il discovery track diventa Hackathon: 2 voti a 1 per prototipare la sola idea sull’audit.',
  trace: [
    { member: 'a-ada', role: 'proposer', text: 'Continuiamo a scansionare il mercato, i segnali non costano nulla.' },
    { member: 'a-davide', role: 'proposer', text: 'Concentriamoci su una sola idea e mostriamola in demo.' },
    { member: 'a-bruno', role: 'voter', text: 'Voto per concentrarci.' },
    { member: 'a-davide', role: 'voter', text: 'Voto per concentrarci.' },
    { member: 'a-ada', role: 'voter', text: 'Voto per continuare la scansione.' },
  ],
};

export const RULES: Rule[] = [
  { key: 'signals.per_scan', value: 2, text: 'Segnali raccolti per ogni scansione di mercato', category: 'ricerca', unit: 'segnali' },
  { key: 'data.per_benchmark', value: 3, text: 'Dati ottenuti per ogni benchmark in lab', category: 'ricerca', unit: 'dati' },
  { key: 'stress.per_hour', value: 4, text: 'Quanto cresce lo stress ogni ora', category: 'persone', unit: 'punti/ora' },
  { key: 'freeze.energy_drain', value: 2, text: 'Energia persa all’ora durante un freeze del budget', category: 'persone', unit: 'energia/ora' },
  { key: 'risk.appetite', value: 0.5, text: 'Propensione al rischio del comitato (0-1)', category: 'strategia', unit: 'scala 0-1' },
  { key: 'ideas.slots_per_quarter', value: 4, text: 'Idee che possono entrare nel portfolio ogni trimestre', category: 'portfolio', unit: 'idee' },
  { key: 'review.min_reviewers', value: 2, text: 'Revisori minimi per valutare un’idea', category: 'portfolio', unit: 'revisori' },
  { key: 'committee.approve_threshold', value: 3.5, text: 'Punteggio medio minimo per approvare un’idea (scala 1-5)', category: 'portfolio', unit: 'punti' },
  { key: 'quarter.length_days', value: 2, text: 'Durata di un trimestre', category: 'calendario', unit: 'giorni' },
];

/** Ambient lines: [opener, reply]. */
export const CHATTER: [string, string][] = [
  ['Hai visto quanti segnali sono usciti dalla scansione di stamattina?', 'Pochi buoni, tanti rumorosi. Li filtro prima di pranzo.'],
  ['Questa idea come la valuti?', 'Un 3 pieno: problema vero, ma non ho ancora un utente con un nome.'],
  ['Il comitato si riunisce alle quattro.', 'Allora il one-pager lo chiudo adesso, caffè incluso.'],
  ['Chi ha toccato la lavagna? C’era il business case.', 'Era un disegno di Nico, giuro. Lo ricopio subito.'],
  ['Quanto manca alla fine del trimestre?', 'Un giorno. Gli slot nel portfolio sono quasi finiti.'],
  ['Il caffè è finito di nuovo.', 'Metto un OKR: "zero crisi di caffè entro Q3".'],
  ['Il benchmark ha dato dati strani.', 'Rifallo con un altro campione, poi ne parliamo in review.'],
  ['Ottavia vuole tutti in sala alle cinque.', 'Spero siano buone notizie sul budget.'],
];

export const THOUGHTS = [
  'Se questo segnale è rumore, ho perso una mattina.',
  'Forse dovrei chiedere un parere alla design review.',
  'Questo trend è già troppo affollato.',
  'Il punteggio è onesto o sto cercando conferme?',
  'Il comitato oggi sembra di buon umore.',
  'Devo ricordarmi di pranzare, e di sistemare l’OKR.',
];

export const REPLIES: Record<string, string[]> = {
  strategist: ['Benvenuto. Qui generiamo e valutiamo idee, non le costruiamo: se hai un segnale interessante, portamelo prima del comitato.', 'Il portfolio ha slot limitati per trimestre. Convincimi che la tua idea merita uno di questi.'],
  critic: ['Una idea senza utente nominato non passa la review. Hai un nome e un problema concreto?', 'Mi piace dire di no: serve a proteggere gli slot per le idee buone. Convincimi.'],
  designer: ['Prima di parlare di soluzioni, raccontami la giornata della persona che ha il problema. Poi facciamo il mockup.', 'Un’idea si capisce quando la puoi disegnare su una lavagna in cinque minuti.'],
  researcher: ['Sto scansionando il mercato: ogni mattina raccolgo segnali nuovi. Ne vuoi qualcuno?', 'Le interviste sono oro, ma durano poco: un segnale vecchio è già rumore.'],
  analyst: ['Dammi i dati e ti dico quanto vale il segnale. Senza numeri è solo un’opinione.', 'Faccio benchmark in lab: ogni dato che porto a casa vale più di tre trend report.'],
  engineer: ['Non costruiamo nulla, ma stimo la fattibilità: dimmi cosa vuoi e ti dico in quanti sprint si farebbe.', 'Il prototipo mentale costa poco. Quello vero lo lasciamo a chi riceverà l’idea.'],
  intern: ['Ciao! Sono qui per imparare: posso seguirti a una review?', 'Ho preso appunti ieri in comitato, ma non ho capito perché Sergio ha dato 2.'],
  visitor: ['Benvenuto in azienda. Cosa ti porta nel nostro hub?'],
};
export const DEFAULT_REPLY = ['Ciao, benvenuto. Di che idea vuoi parlare?'];
