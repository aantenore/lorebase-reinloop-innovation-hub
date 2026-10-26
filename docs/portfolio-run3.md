# Portafoglio idee - Hub Innovazione (Q2)

## Approvate (0)

Nessuna.

## In pipeline (2)

### Assistente AI per la sicurezza nei team IT piccoli (`assistente-ai-per-la-sicurezza-n-972z1`)

- Fase: proposta completa; Champion: Livia; Autori: Livia, Irene; Trimestre: Q1
- Tag: sicurezza, ai, it
- **Problema**: I team IT di aziende medie non trovano esperti di sicurezza (carenza di talenti), e il budget si sta spostando verso l'AI mentre i tool SaaS si consolidano. Chi gestisce la sicurezza con poche persone ha poco tempo per triage, revisione di configurazioni e risposta agli incidenti.
- **Utenti**: Team IT e sicurezza di aziende medie con 2-10 persone dedicate alla sicurezza.
- **Soluzione**: Un assistente AI che si integra con gli strumenti gia' in uso (consolidati in piattaforme meno numerose) e svolge triage degli alert, controlli di configurazione e bozze di risposta, con revisione umana sulle decisioni.
- **Differenziazione**: Non un nuovo SaaS da aggiungere allo stack, ma un livello che lavora dentro lo stack esistente, sfruttando il calo dei prezzi dell'inferenza per rendere il costo per utente sostenibile.
- **Fattibilità**: Fattibile con modelli di inferenza commerciali e connettori ai tool piu' diffusi; serve un prototipo su un solo ambito (triage alert) prima di espandersi.
- **Rischi**: Prompt injection da log, ticket e alert; permessi ampi sugli strumenti connessi; errori del modello su decisioni di sicurezza; dipendenza dai fornitori di modelli; concorrenza di SIEM con AI nativa. Condizioni minime per il comitato: permessi in sola lettura per ambito, nessuna azione automatica senza approvazione umana, log di audit di ogni azione dell'assistente, test di prompt injection prima del pilota.
- Punteggi: impatto 6, fattibilità 6.3, novità 3.7, coerenza 6.3, rischio 6.7; pesato 5.4 (3 valutazioni)
  - Dario: Idea plausibile ma affollata: SIEM e piattaforme di sicurezza stanno già aggiungendo AI nativa, e Traceforce è un concorrente, non una prova di domanda. Le prove reali sono 2/3 ma una è un blog e l'altra un lancio di concorrente; serve un dato di disponibilità a pagare e un'ipote
  - Matteo: Il problema (pochi esperti di sicurezza nei team piccoli) è reale e le prove sono di due fonti distinte, ma la novità è limitata: il mercato ha già tool AI per la sicurezza. Serve una validazione umana con 3-5 team reali e una scelta netta sul primo ambito (triage alert) prima di
  - Irene: Dal lato sicurezza: un assistente che legge alert e configurazioni con permessi ampi diventa esso stesso una superficie d'attacco (prompt injection da log e ticket, privilegi eccessivi). Prima di candidarla servono un piano di permessi minimi, la revisione umana obbligatoria sull
- Prove (12):
  - Fonte web (web; peso 0.5): [AI for Small IT Teams: How to Give People AI Without Losing Control of Your Data](https://www.mrc-productivity.com/blog/2026/06/ai-for-small-it-teams-how-to-give-people-ai-without-losing-control-of-your-data/) - Piccoli team IT che adottano AI senza perdere controllo dei dati; citata una quota dell'8,5% di usi con dati sensibili (record clienti, codice sorgente). Sostiene il problema della sicurezza nei team  (Livia)
  - Segnale pubblico (hackernews, points 44; peso 1): [Launch HN: Traceforce (YC S26) – Company-wide security monitoring for AI apps](https://news.ycombinator.com/item?id=48937020) - Un prodotto di monitoraggio sicurezza per app AI ha ricevuto attenzione (44 punti, 28 commenti): segnale di interesse per la sicurezza attorno all'AI aziendale. È adiacente, non identico, all'assisten (Livia)
  - Fonte web (web; peso 0.5): [Best AI Security Tools for Small Teams (2026 Honest Review)](https://sequirly.com/blog/best-ai-security-tools-small-teams) - Strumenti di sicurezza AI per team sotto i 100 utenti senza reparto IT: prezzi pubblici indicativi, ad esempio Team a 19 dollari per utente al mese (15 annuale). Prova di prezzo di riferimento per il  (Livia)
  - Fonte web (web; peso 0.5): [Microsoft Security Copilot Security Alert Triage Agent in Microsoft Defender (Preview) - Microsoft Defender XDR](https://learn.microsoft.com/en-us/defender-xdr/security-alert-triage-agent) - Pagina ufficiale di un concorrente: un agente AI di triage degli alert già in preview dentro Defender. Non è una validazione umana; mostra che la fascia "assistente AI per la sicurezza" è presidiata d (Giulia)
  - Fonte web (web,  10; peso 0.5): [Pricing](https://www.aisecurityplatform.ai/pricing) - Piani a 10 USD e 15 USD per utente al mese: prezzo di listino di un concorrente, non un prezzo accettato da clienti. Da usare come seconda fonte di prezzo indipendente, con data di verifica da conferm (Livia)
  - Fonte web (web; peso 0.5): [AI SOC Pricing Guide 2026: Complete Cost Breakdown](https://underdefense.com/blog/ai-soc-pricing-guide/) - Listino di un vendor, non prezzo accettato: ~10-37 USD per endpoint/mese per servizi AI SOC; prodotto diverso (SOC gestito), solo come fascia indicativa. Data: 2026 (pagina). (Livia)
  - Fonte web (web; peso 0.5): [AI SOC Security: Prompt Injection Risks](https://neuraltrust.ai/blog/ai-soc-prompt-injection) - Pagina di un vendor che riporta un'attack success rate media dell'83,4% per prompt injection da log su tre LLM senza difese, e riduzione a 8,4% con difese a più livelli su GPT-4o (cita Karanjai et al. (Irene)
  - Fonte web (web; peso 0.5): [Adversarial Machine Learning: A Taxonomy and ...](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-2e2025.pdf) - Fonte pubblica indipendente da vendor (NIST). Classifica prompt injection diretta e indiretta e la sicurezza degli agenti AI, con mitigazioni e limiti. Sostiene il rischio di prompt injection da log e (Irene)
  - Fonte web (web; peso 0.5): [The Price of Progress Price Performance and the Future of AI](https://arxiv.org/html/2511.23455v2) - Fonte accademica pubblica sull'andamento prezzo/prestazioni dell'inferenza AI; usata solo come trend qualitativo, senza cifre. (Giulia)
  - Fonte web (web; peso 0.5): [ISC2 Survey: 30% of Cyber Pros Using AI Security Tools](https://www.isc2.org/Insights/2025/07/2025-isc2-ai-pulse-survey) - Organizzazioni più piccole (1–99 dipendenti) tra le meno adottanti: solo il 20% usa attivamente strumenti AI per la sicurezza; il 23% non prevede di valutarli. Dato di adozione, non prova diretta del  (Matteo)
  - Fonte web (web; peso 0.5): [LLM inference prices have fallen rapidly but unequally across tasks](https://epoch.ai/data-insights/llm-inference-price-trends) - Fonte indipendente da vendor (Epoch AI, ricerca). Il calo del prezzo per raggiungere una data soglia di prestazione va da 9x a 900x per anno, a seconda del benchmark; es. GPT-4 su domande PhD-level ~4 (Irene)
  - Fonte web (web; peso 0.5): [LLM Prompt Injection Prevention - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) - Lo screening degli input non è un confine di sicurezza; i permessi vanno imposti a parte, con least privilege e approvazione umana per le operazioni privilegiate. Rilevante per il limite «solo triage  (Livia)

### Audit on-premise delle decisioni AI per settori regolati (`audit-on-premise-delle-decisioni-8st6e`)

- Fase: proposta completa; Champion: Matteo; Autori: Matteo; Trimestre: Q1
- Tag: compliance, on-premise, audit, ai
- **Problema**: Banche, ospedali e assicurazioni vogliono usare AI sui propri dati ma non possono far uscire i dati dal perimetro, e devono poter dimostrare come sono state prese le decisioni automatiche. Oggi l'audit è fatto a mano o non esiste. Segnali raccolti: banca (audit delle decisioni automatiche), ospedale (tutto on-premise), logistica (sistemi legacy da integrare), assicurazione (sinistri su documenti non strutturati).
- **Utenti**: Responsabili compliance, DPO e team IT di banche, ospedali e assicurazioni.
- **Soluzione**: Un livello di audit trail installabile on-premise che registra input, documenti usati, versione del modello e motivazione di ogni decisione AI, con report pronti per i revisori e connettori per sistemi legacy.
- **Differenziazione**: Non è un modello né una piattaforma cloud: è uno strato di audit che gira dentro il perimetro del cliente e si aggancia a sistemi legacy esistenti.
- **Fattibilità**: Fattibile come prototipo su un solo caso d'uso; i connettori legacy sono la parte costosa. Richiede validazione con clienti reali prima di qualsiasi investimento.
- **Rischi**: Segnali di mercato solo interni, nessuna validazione umana ancora; rischio che i clienti considerino l'audit una funzione dei fornitori già esistenti; carenza di esperti di sicurezza per l'implementazione.

## Scartate (0)

Nessuna.
