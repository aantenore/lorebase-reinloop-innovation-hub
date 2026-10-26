# Portafoglio idee - Hub Innovazione (Q2)

## Approvate (0)

Nessuna.

## In pipeline (2)

### Audit trail on-premise per decisioni AI (art. 12) con connettori legacy (`audit-trail-on-premise-per-decis-s6zr1`)

- Fase: proposta completa; Champion: Giulia; Autori: Giulia; Trimestre: Q3
- Tag: ai-governance, compliance, on-premise, legacy
- **Problema**: Banche, ospedali e aziende logistiche usano decisioni automatiche (AI) ma non riescono a dimostrare cosa è stato deciso, con quali dati e da quale modello. Il requisito di tracciabilità dell'EU AI Act (art. 12, registrazione degli eventi) va rispettato, e i dati sensibili non possono uscire dall'infrastruttura del cliente. Il pain è esplicito in Banca (audit delle decisioni automatiche) e in Ospedale (tutto deve restare on-premise); in Logistica i sistemi legacy rendono l'integrazione il vero os
- **Utenti**: Responsabili compliance e DPO di banche, ospedali e logistica; team IT che gestisce sistemi legacy e integrazioni AI.
- **Soluzione**: Un audit trail on-premise che registra in modo immutabile input, output, versione del modello e decisione di ogni chiamata AI, con connettori verso i sistemi legacy del cliente (database, code, mainframe, ERP) e report pronti per l'audit. Nessun dato lascia l'infrastruttura del cliente.
- **Differenziazione**: Combina tracciabilità on-premise per decisioni AI con connettori legacy già pronti, invece di richiedere la migrazione verso il cloud o una piattaforma AI nuova. Il focus è la prova di audit, non la costruzione del modello.
- **Fattibilità**: Fattibile come esplorazione: architettura a log append-only con connettori a plugin, deployabile on-premise a container. Rischio principale: il numero di connettori legacy e la varietà dei formati. Da validare con un cliente pilota prima di qualsiasi impegno.
- **Rischi**: Concorrenza da piattaforme di governance AI già consolidate; costo dei connettori legacy più alto del previsto; obblighi dell'art. 12 con scadenze tra dic 2027 e ago 2028, quindi urgenza commerciale non immediata. Prova di clienti paganti da fare nella fase pilota.
- Punteggi: impatto 6.3, fattibilità 5.7, novità 4, coerenza 7, rischio 5.3; pesato 5.7 (3 valutazioni)
  - Livia: Il problema è reale e lo vedo in Banca (audit) e Ospedale (on-prem), ma senza una prova reale o una validazione umana non passa i requisiti di candidatura. L'urgenza normativa è lontana (dic 2027 / ago 2028) e la concorrenza da piattaforme di governance AI è forte: serve almeno u
  - Dario: Problema reale (tracciabilità delle decisioni AI, on-premise), ma le prove sono deboli: due fonti web sulla norma e un segnale HN da 2 punti che è concorrenza, non domanda. Serve un volume o un cliente che lo chieda; la data art. 12 (dic 2027) non è ancora verificata sulla fonte 
  - Irene: Problema reale e coerente con on-premise e sicurezza, ma le prove di volume annuo non sono verificate e la scadenza Art. 12 è dic 2027, quindi nessuna urgenza commerciale. Dal lato sicurezza servono integrità dei log (append-only con firma/hash), gestione chiavi e controllo acces
- Prove (3):
  - Fonte web (web; peso 0.5): [Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/) - Art. 12 EU AI Act: i sistemi ad alto rischio devono registrare automaticamente gli eventi (log) per tutta la vita del sistema. Entrata in vigore: 2 dic 2027 (Annex III) / 2 ago 2028 (Annex I). (Giulia)
  - Fonte web (web; peso 0.5): [EU AI Act Article 12 & ISO 42001 Logging for AI Agents](https://www.permit.io/blog/eu-ai-act-article-12-iso-42001-agent-logging) - Articolo che collega il requisito di logging dell'art. 12 a pratiche di logging per agenti AI: conferma che il log delle decisioni è un tema di mercato concreto, non solo normativo. (Giulia)
  - Segnale pubblico (hackernews, points 2; peso 1): [Show HN: EnforceAuth GA Launch](https://news.ycombinator.com/item?id=46872357) - Lancio di un prodotto di autorizzazione/controllo per sistemi AI: segnale di concorrenza diretta (debole, pochi punti). Da considerare nei rischi. (Giulia)
- Decisione del comitato: rimandata - Idea rinviata: il problema è plausibile e coerente con la strategia, ma le prove allegate (due fonti web sulla norma e un segnale HN che indica concorrenza, non domanda) non mostrano che banche, ospedali o logistica soffrano il problema. Gl Criteri non soddisfatti (policy criteri_comitato): prove_del_problema. Richieste fuori policy: Verificare la data di applicazione dell'art. 12 sulla fonte ufficiale (la fonte citata riporta 2 dic 2027, dato non ancora verificato).; Specificare nel progetto in
  - Criteri non soddisfatti: prove_del_problema
  - Slot di approvazione consumati dal rinvio (policy costo_del_rinvio): 1
  - Voto di Livia: rimandata (coerenza_strategica soddisfatto, concorrenza soddisfatto, fattibilita soddisfatto, prove_del_problema non soddisfatto, rischio soddisfatto): Il problema è reale e l'idea è coerente, ma manca la prova che il problema esista presso banche, ospedali e logistica: torna agli autori per una validazione con almeno alcuni responsabili compliance/DPO o team IT, e la verifica della data dell'art. 12 sulla fonte.
  - Voto di Matteo: rimandata (coerenza_strategica soddisfatto, concorrenza soddisfatto, fattibilita soddisfatto, prove_del_problema non soddisfatto, rischio soddisfatto): Il problema è plausibile e coerente, ma il criterio prove_del_problema non è soddisfatto: nessuna evidenza di domanda presso banche, ospedali o logistica; l'idea torna agli autori per validare il problema con gli utenti indicati prima di un nuovo passaggio in comitato.
    - Richiesta fuori policy: Verificare la data di applicazione dell'art. 12 sulla fonte ufficiale (la fonte citata riporta 2 dic 2027, ma il dato non è ancora verificato).
    - Richiesta fuori policy: Specificare nel progetto integrità dei log (append-only con hash/firma), gestione delle chiavi e controllo degli accessi.
  - Voto di Dario: rimandata (coerenza_strategica soddisfatto, concorrenza soddisfatto, fattibilita soddisfatto, prove_del_problema non soddisfatto, rischio soddisfatto): Il problema sembra plausibile, ma la prova è inesistente: non c'è una sola fonte che mostri che i clienti indicati soffrono il problema, e la data normativa su cui poggia l'urgenza non è verificata. Rinvio agli autori con quattro compiti precisi: intervistare almeno due clienti (
  - Richiesta fuori policy: Verificare la data di applicazione dell'art. 12 sulla fonte ufficiale (la fonte citata riporta 2 dic 2027, dato non ancora verificato).
  - Richiesta fuori policy: Specificare nel progetto integrità dei log (append-only con hash/firma), gestione delle chiavi e controllo degli accessi.
  - Richiesta fuori policy: Verificare la data di applicazione dell'art. 12 sulla fonte ufficiale (la fonte citata riporta 2 dic 2027, ma il dato non è ancora verificato).

### Audit trail on-premise per decisioni AI con connettori legacy (`audit-trail-on-premise-per-decis-x5zy5`)

- Fase: proposta completa; Champion: Giulia; Autori: Giulia; Trimestre: Q3
- Tag: ai, compliance, sicurezza, on-premise
- **Problema**: Banche, ospedali, assicurazioni e logistica usano decisioni automatiche AI ma non hanno un log verificabile e on-premise delle decisioni (art. 12 AI Act). Le voci raccolte da clienti reali (Banca, Ospedale, Logistica, Assicurazione) descrivono il problema dell'audit e dell'integrazione con sistemi legacy; il dimensionamento di mercato mostra la spesa verso l'AI che lo rende urgente.
- **Utenti**: Clienti regolamentati con AI in produzione: banche, ospedali, assicurazioni, logistica; team compliance e DPO.
- **Soluzione**: Un servizio di audit trail che registra le decisioni AI in ambiente on-premise, con connettori verso sistemi legacy, e produce tracce consultabili dai revisori.
- **Differenziazione**: On-premise di default e connettori per sistemi legacy, non solo cloud e osservabilità generica.
- **Fattibilità**: Fattibile in fase di esplorazione: componenti di logging e connettori standard; da validare con un prototipo su un solo connettore.
- **Rischi**: Domanda da confermare oltre le quattro voci; concorrenza di piattaforme MLOps; complessità dei connettori legacy.
- Punteggi: impatto 5.8, fattibilità 5.8, novità 3.4, coerenza 7.2, rischio 5.6; pesato 5.5 (5 valutazioni)
  - Livia: Il problema di tracciabilità on-premise emerge da quattro voci di clienti, ma le prove registrate sono solo due segnali HN che parlano di concorrenza, non di domanda. Senza il dimensionamento allegato e con 2 prove su 3, non è candidabile: non la considero pronta per il comitato.
  - Enea: Problema reale e coerente con i segnali dei clienti, ma le prove pubbliche sono deboli (due Show HN con 2 e 3 punti) e concorrenza MLOps già presente; per la candidatura servono ancora prove reali e una seconda fonte distinta, quindi la sosterrei solo dopo aver verificato la doma
  - Dario: Duplicato quasi identico di s6zr1, con meno prove: nessun dimensionamento con fonte, e i due segnali HN sono concorrenza, non domanda. Non la candiderei; meglio fonderla con s6zr1 quando arriva un volume verificato con anno, unità e link.
  - Irene: Sembra un duplicato di audit-trail-on-premise-per-decis-s6zr1, con prove più deboli: due segnali HN (2 e 3 punti) che indicano concorrenza, non domanda, e nessuna fonte art. 12 verificata con anno e unità. Non la farei candidare in parallelo: meglio unire le prove e i rischi in s
  - Matteo: Problema plausibile e coerente con la strategia: quattro voci di clienti regolamentati (Banca, Ospedale, Logistica, Assicurazione) sono il punto forte. Le prove pubbliche però sono deboli: due segnali HN mostrano soprattutto concorrenza, e la data dell'art. 12 non è ancora verifi
- Prove (4):
  - Segnale pubblico (hackernews, points 2; peso 1): [Show HN: Open-source EU AI Act compliance layer for AI agents (8/2026 deadline)](https://news.ycombinator.com/item?id=47141347) - Progetto open source che propone un livello di compliance AI Act per agenti AI, con scadenza 8/2026: segnale che la richiesta di log e audit delle decisioni AI esiste, e che c'è concorrenza su questo  (Giulia)
  - Segnale pubblico (hackernews, points 3; peso 1): [Show HN: ContextGraph Cloud – Governance infrastructure for AI agents](https://github.com/akz4ol/contextgraph-cloud) - Infrastruttura di governance per agenti AI presentata su Hacker News: conferma che il tema della tracciabilità delle decisioni degli agenti è sentito, ma con offerta ancora giovane e poco adozione. (Giulia)
  - Fonte web (web; peso 0.5): [Article 12, Record-keeping, EU AI Act](https://www.artificial-intelligence-act.com/Artificial_Intelligence_Act_Article_12.html) - Fonte regolatoria: l'art. 12 richiede che i sistemi AI ad alto rischio registrino automaticamente gli eventi (tracciabilità del funzionamento). Prova dell'esistenza del bisogno normativo, non della do (Livia)
  - Segnale pubblico (hackernews, points 42; peso 1): [Show HN: Open-Source Article 12 Logging Infrastructure for the EU AI Act](https://news.ycombinator.com/item?id=47230438) - Segnale pubblico (HN, marzo 2026): un progetto open source di logging conforme all'art. 12 dell'AI Act, 42 punti e 10 commenti. Prova di interesse per il problema, non di data né di volume di clienti. (Irene)
- Decisione del comitato: rimandata - Rinviata: il problema non è ancora documentato da prove allegate presso i clienti indicati. Le voci di Banca, Ospedale, Logistica e Assicurazione restano nel testo senza validazione allegata, i due segnali HN indicano concorrenza e non doma Criteri non soddisfatti (policy criteri_comitato): prove_del_problema. Richieste fuori policy: Valutare l'unione con audit-trail-on-premise-per-decis-s6zr1 (duplicato quasi identico) e portare un'unica candidatura con le prove consolidate; Valutare l'unione c
  - Criteri non soddisfatti: prove_del_problema
  - Slot di approvazione consumati dal rinvio (policy costo_del_rinvio): 1
  - Voto di Livia: rimandata (coerenza_strategica soddisfatto, concorrenza soddisfatto, fattibilita soddisfatto, prove_del_problema non soddisfatto, rischio soddisfatto): Il problema non è ancora documentato da prove allegate che mostrino la domanda presso i clienti indicati: le voci dei clienti restano nel testo, i segnali pubblici indicano concorrenza e manca un dimensionamento con fonte. Rinvio agli autori per allegare le prove e chiarire la so
    - Richiesta fuori policy: Valutare l'unione con audit-trail-on-premise-per-decis-s6zr1 (duplicato quasi identico, segnalato da Dario e Irene) e portare un'unica candidatura con le prove consolidate.
    - Richiesta fuori policy: Allegare un dimensionamento di mercato con fonte, anno e unità, e le validazioni delle quattro voci dei clienti.
  - Voto di Matteo: rimandata (coerenza_strategica soddisfatto, concorrenza soddisfatto, fattibilita soddisfatto, prove_del_problema non soddisfatto, rischio soddisfatto): Il problema è plausibile e coerente, ma la prova del problema non è ancora allegata come evidenza verificabile presso gli utenti indicati: le voci dei clienti vanno documentate, i segnali HN sono concorrenza e la fonte art. 12 non prova la domanda. Rinvio agli autori con condizio
    - Richiesta fuori policy: Verificare se è un duplicato di audit-trail-on-premise-per-decis-s6zr1 e, in caso, unire prove e rischi.
    - Richiesta fuori policy: Allegare un dimensionamento di mercato con fonte, anno e unità (la spesa AI citata nel problema non è ancora documentata).
  - Voto di Dario: scartata (coerenza_strategica soddisfatto, concorrenza non soddisfatto, fattibilita soddisfatto, prove_del_problema non soddisfatto, rischio soddisfatto): È un duplicato quasi identico di audit-trail-on-premise-per-decis-s6zr1 con prove più deboli: i segnali pubblici indicano concorrenza, non domanda, e il dimensionamento non è verificato. Propongo di fonderla con s6zr1 quando arriveranno dati di volume con anno, unità e link.
  - Richiesta fuori policy: Valutare l'unione con audit-trail-on-premise-per-decis-s6zr1 (duplicato quasi identico) e portare un'unica candidatura con le prove consolidate
  - Richiesta fuori policy: Valutare l'unione con audit-trail-on-premise-per-decis-s6zr1 (duplicato quasi identico, segnalato da Dario e Irene) e portare un'unica candidatura con le prove consolidate.
  - Richiesta fuori policy: Allegare un dimensionamento di mercato con fonte, anno e unità, e le validazioni delle quattro voci dei clienti.
  - Richiesta fuori policy: Verificare se è un duplicato di audit-trail-on-premise-per-decis-s6zr1 e, in caso, unire prove e rischi.
  - Richiesta fuori policy: Allegare un dimensionamento di mercato con fonte, anno e unità (la spesa AI citata nel problema non è ancora documentata).

## Scartate (0)

Nessuna.
