# Portafoglio idee - Hub Innovazione (Q3)

## Approvate (0)

Nessuna.

## In pipeline (1)

### Audit delle decisioni automatiche per banche (tracciabilità AI Act) (`audit-delle-decisioni-automatich-opbn1`)

- Fase: proposta completa; Champion: Irene; Autori: Irene; Trimestre: Q4
- Tag: sicurezza, ai, compliance, banca
- **Problema**: Le banche usano modelli AI per credito e antifrode, ma i log delle decisioni automatiche sono frammentari. L'AI Act art. 12 impone registrazione automatica per i sistemi ad alto rischio, applicabile dal 2 agosto 2026. Compliance, DPO e security non riescono a ricostruire le singole decisioni.
- **Utenti**: Compliance bancaria, CISO e responsabili del rischio modelli di banche e fintech europee
- **Soluzione**: Un audit trail che registra input, versione del modello e motivazione di ogni decisione automatica, con report pronti per le autorità di vigilanza.
- **Differenziazione**: Non la sola integrità dei log (già coperta da ZizkaDB, 146 stelle): report bancari per la vigilanza che collegano ogni decisione di credito o antifrode a versione del modello, input minimizzato e motivazione, con retention di almeno sei mesi lato deployer.
- **Fattibilità**: Fattibile con integrazione via log e API sui sistemi di decisione esistenti; la parte critica è la coerenza e l'integrità dei log.
- **Rischi**: NON VERIFICATO: il riferimento all'art. 12 AI Act (log automatici) è da memoria, non letto da fonte primaria. Date in conflitto: l'idea riporta 2 ago 2026 per l'Annex III, una pagina secondaria riporta 2 dic 2027. Prima della candidatura vanno verificate su EUR-Lex e con un DPO.
- Punteggi: impatto 6.5, fattibilità 5.5, novità 3.5, coerenza 6.5, rischio 6; pesato 5.5 (2 valutazioni)
  - Dario: Problema reale e scadenza AI Act interessante, ma le tre prove sono fonti web secondarie (una dichiara lei stessa il limite di non essere il testo ufficiale) e nessun cliente bancario è stato intervistato. Prima di candidarla servono validazioni umane con ruolo e data.
  - Matteo: Problema reale e scadenza AI Act con fonti distinte, ma la differenziazione sull'integrità dei log è già occupata da ZizkaDB (146 stelle, cita l'art. 12). Le fonti sono secondarie, non il testo EUR-Lex, e manca la firma compliance che Dario chiede: prima di candidarla va chiarita
- Fonti: [What the EU AI Act requires for AI agent logging - Help Net Security](https://www.helpnetsecurity.com/2026/04/16/eu-ai-act-logging-requirements/), [Article 12 AI Act - Record-keeping and automatic logging](https://www.aiacto.eu/en/obligations/art-12)
- Prove (9):
  - Fonte web (web; peso 0.5): [Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/) - Pagina secondaria che riassume l'art. 12 AI Act (registrazione automatica degli eventi per sistemi ad alto rischio). LIMITE: non è il testo ufficiale EUR-Lex; la verifica sul testo ufficiale è ancora  (Irene)
  - Fonte web (web; peso 0.5): [EU AI Act Credit Scoring High-Risk System Guide (July 2026)](https://www.openlayer.com/blog/credit-scoring-eu-ai-act-compliance-guide) - Banche e fintech che addestrano o modificano modelli di credit scoring sono deployer soggetti all'art. 12 (record-keeping) e alla supervisione umana. (Matteo)
  - Fonte web (web; peso 0.5): [Agent Security Meets Regulatory Reality -- A Practitioner Systematization of Autonomous-Agent Threats and Controls in Regulated Financial Systems](https://arxiv.org/pdf/2606.29142) - L'art. 26(6) impone ai deployer di conservare i log generati automaticamente per almeno sei mesi: domanda concreta di tracciabilità in banca. (Matteo)
  - Segnale pubblico (github, stars 146; peso 1): [ZIZKA-AI-SL/ZizkaDB](https://github.com/ZIZKA-AI-SL/ZizkaDB) - Concorrente già esistente con log di decisioni AI a prova di manomissione e riferimento esplicito all'art. 12: la differenziazione "integrità dei log" non è unica. Segnale contro il criterio concorren (Dario)
  - Fonte web (web; peso 0.5): [EU AI Act Article 12: Record-Keeping](https://www.euaiact.com/article/12) - Fonte secondaria, non il testo ufficiale EUR-Lex: l'art. 12 richiede che i sistemi ad alto rischio registrino automaticamente eventi (log) lungo il ciclo di vita, per identificare situazioni di rischi (Irene)
  - Fonte web (web; peso 0.5): [Regulation - EU - 2024/1689 - EN - EUR-Lex - European Union](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng) - Link ufficiale EUR-Lex del Regolamento 2024/1689 trovato con la ricerca. Il testo dell'art. 12 non è ancora stato letto e verificato da me: serve lettura diretta prima di considerarlo fonte primaria. (Irene)
  - Fonte web (web; peso 0.5): [L_202401689IT.000101.fmx.xml](https://eur-lex.europa.eu/legal-content/IT/TXT/HTML/?uri=CELEX%3A32024R1689) - Pagina EUR-Lex del Regolamento 2024/1689 trovata in ricerca; lo snippet di una fonte secondaria riporta il testo dell'art. 12 sulla registrazione automatica degli eventi (log) per i sistemi ad alto ri (Livia)
  - Segnale pubblico (hackernews, points 4; peso 1): [Ask HN: How do you audit autonomous AI agent decisions?](https://news.ycombinator.com/item?id=46714180) - Domanda pubblica su come auditare le decisioni di agenti AI autonomi: 4 punti, 2 commenti. Segnale debole di pain (nessuna risposta risolutiva evidente), da trattare come trend parziale. (Giulia)
  - Segnale pubblico (hackernews, points 5; peso 1): [Enterprise AI customers pulling back from OpenAI and Anthropic as costs mount](https://news.ycombinator.com/item?id=48694123) - Segnale parziale di tendenza: i clienti enterprise rallentano la spesa AI per costi crescenti e ROI incerto (5 punti, 5 commenti, giugno 2026). Usabile come trend di budget, non come prova di domanda  (Giulia)

## Scartate (0)

Nessuna.
