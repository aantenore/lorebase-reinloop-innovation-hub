# Portafoglio idee - Hub Innovazione (Q4)

## Approvate (0)

Nessuna.

## In pipeline (3)

### Audit delle decisioni AI per settori regolati (on-prem) (`audit-delle-decisioni-ai-per-set-wk9w1`)

- Fase: proposta completa; Champion: Giulia; Autori: Giulia, Irene, Livia; Trimestre: Q1
- Tag: ai, sicurezza, compliance, on-prem
- **Problema**: Banche, ospedali e altri settori regolati usano decisioni automatiche (AI) che devono poter essere spiegate, verificate e tracciate, ma i dati sensibili non possono uscire dal perimetro aziendale. Oggi gli audit sono manuali o affidati a servizi cloud che i clienti non accettano.
- **Utenti**: Responsabili compliance, risk e sicurezza di banche e ospedali; team AI interni di settori regolati.
- **Soluzione**: Roadmap di crescita: dopo il pilota, i connettori on-prem verso sistemi legacy (SQL prima, poi HL7/EDI) del gateway di Livia diventano il modulo di raccolta del registro di audit, così l'evidence pack nasce già alla fonte. Si parte solo dal connettore SQL e dal pilota; nessun connettore extra senza cliente firmatario.
- **Differenziazione**: Non un tool generico di osservabilità: il prodotto parte dagli obblighi di conservazione dei log per sistemi ad alto rischio (EU AI Act, art. 12 e 19: tracciamento automatico, conservazione minima di sei mesi, accesso su richiesta delle autorità) e produce evidence pack di compliance. Il valore sta nel formato dell'evidenza e nel fatto che resta nel perimetro del cliente, non solo nell'hosting.
- **Fattibilità**: Piano dati (fase pilota): 1) Fonte on-prem: il connettore legge solo campi minimi (id decisione, timestamp, versione modello, esito, motivazione sintetica), pseudonimizzati alla fonte. 2) Firma: ogni decisione è attribuita a un owner di processo lato cliente che approva o rivede; il registro traccia chi ha firmato e quando. 3) Registro append-only con hash chain verificabile da terzi. Chiavi: generate e custodite dal cliente, con rotazione; detentori presso il cliente da nominare nel pilota (res
- **Rischi**: Buchi aperti, non risolti: chiavi di firma presso il cliente (custodia ed evidenza); revoca sigillata nella hash chain senza riscrivere il passato; ruoli audit/operativo/sviluppo separati, nessun accesso dev; mappatura id reversibile e dove vive; pilota nominato e parere DPO scritto mancanti. Stato: sotto condizione, non pronto.
- Punteggi: impatto 7, fattibilità 5, novità 5.2, coerenza 7.8, rischio 5.8; pesato 6.1 (5 valutazioni)
  - Irene: Dal lato sicurezza il perimetro ridotto è giusto, ma il registro delle decisioni è un bersaglio ad alto valore: serve chiarire chiavi (gestione e rotazione), integrità append-only verificabile e accessi segregati prima del pilota. La pseudonimizzazione alla fonte va specificata (
  - Bruno: Problema reale e ancorato all'AI Act, ma non ho numeri su quanti clienti pagherebbero o su quanti log esistono davvero: il segnale Banca è un singolo caso in call. Prima di costruire serve un pilota con dati reali.
  - Livia: Idea ben ancorata a un obbligo normativo (AI Act art. 12/19) e con MVP ridotto onesto. Crescita chiara: evidence pack come prodotto, poi estensione ad altri settori. Limite: nessun pilota ancora e mercato affollato di suite GRC; serve un cliente con log reali prima di costruire.
  - Dario: Il piano dati ora c'è: fonte on-prem, owner che firma ogni decisione, registro append-only con chiavi del cliente, pseudonimizzazione alla fonte. Resta però scritto solo sulla carta: nessun cliente pilota nominato e la novità è ancora l'hosting. Non la candido al Comitato finché 
  - Matteo: Problema forte e ancorato a obblighi reali (AI Act art. 12, 19), ma il piano dati e la custodia delle chiavi sono ancora aperti. Non candidabile finché non ci sono pilota nominato e parere DPO scritto.
- Fonti: [AI Audit Logging: EU AI Act Article 12, ISO 42001 (Claire)](https://www.letsaskclaire.com/security/ai-audit-logging), [EU AI Act Article 12: Record-keeping (AI Act Service Desk)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12), [EU AI Act compliance audit log: what regulators expect (Prediction Guard)](https://predictionguard.com/blog/eu-ai-act-compliance-audit-log-what-regulators-expect-and-how-to-document-it)

### AI gateway on-prem per sistemi legacy in settori regolati (`ai-gateway-on-prem-per-sistemi-l-yrei2`)

- Fase: proposta completa; Champion: Livia; Autori: Livia; Trimestre: Q3
- Tag: on-prem, legacy, sicurezza, ai, compliance
- **Problema**: Ospedali, logistica e banche vogliono usare AI ma i dati devono restare on-premise e i sistemi legacy non si integrano facilmente. Il costo dell'integrazione e la carenza di esperti di sicurezza bloccano l'adozione.
- **Utenti**: CIO e responsabili sicurezza/compliance di ospedali, aziende logistiche e banche; team IT con poche risorse di sicurezza.
- **Soluzione**: Un gateway installabile in locale che si collega ai sistemi legacy tramite connettori pronti, esegue modelli AI contenuti, anonimizza i dati e registra ogni decisione automatica in un log verificabile (audit) senza far uscire dati dal perimetro del cliente.
- **Differenziazione**: Non duplica l'audit di Giulia: il gateway è il livello di esecuzione e integrazione (connettori legacy + modelli locali); l'audit è un modulo che si può acquistare da lui. Proposta: posizionarlo come complementare, con interfaccia di log compatibile con l'evidence pack dell'idea di Giulia. Vs integratori: prodotto standard con connettori riusabili.
- **Fattibilità**: Approvazione condizionata proposta: si sblocca solo la discovery di 1 settimana con 1 pilota (ospedale o logistica). Gate di uscita: pilota nominato + firmatario + perimetro prodotto vs progetto su misura. MVP: un connettore SQL, un caso d'uso di estrazione su documenti, modelli piccoli in container, anonimizzazione in ingresso. Stima onesta: 2 trimestri con 3-4 persone. HL7 ed EDI solo dopo il pilota.
- **Rischi**: Nessun referente firmato né parere DPO ancora disponibili: la domanda dei settori regolati è ipotesi da validare con un pilota nominato prima di qualsiasi investimento. Rischio di integrazione con sistemi legacy eterogenei e carenza di esperti di sicurezza per la gestione on-prem.
- Punteggi: impatto 6.6, fattibilità 4, novità 4.6, coerenza 7.4, rischio 6.6; pesato 5.5 (5 valutazioni)
  - Dario: Il problema dei sistemi legacy on-prem è reale, ma "MVP in pochi mesi" con 2-3 connettori (SQL, EDI, HL7) e un runtime di modelli è ottimistico. Va chiarito chi sono i clienti pilota e quale parte è davvero prodotto e non progetto su misura; le fonti sono assenti e l'overlap con 
  - Matteo: Problema reale e documentato (on-prem + legacy in sanità, banca, logistica), ma il perimetro è ancora largo: senza un cliente pilota identificato e con sovrapposizione con l'audit di Giulia, il rischio è scivolare in progetto su misura. Propongo di approvarlo solo con il primo pa
  - Bruno: Senza un pilota con nome e firmatario i numeri di mercato restano ipotesi: zero clienti confermati su tre settori. Stima di 2 trimestri con 3-4 persone contro un freeze tra poche ore: va chiuso come discovery di una settimana o come disegno.
  - Irene: Dal lato sicurezza il gateway è il livello dove passano chiavi, dati sensibili e accessi ai sistemi legacy: serve un perimetro di sicurezza definito prima di qualsiasi pilota. Condizione corretta il pilota con nome e firmatario; non candiderei nulla prima di quello.
  - Giulia: Buona separazione: il gateway è il livello di esecuzione e connettori, l'audit può esserne un modulo. Ma senza un pilota con nome e firmatario resta un progetto su misura; la condizione di stop di fine trimestre va rispettata.
- Fonti: [EU AI Act Article 12: Record-keeping (AI Act Service Desk)](https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-12)

### Triage automatico dei segreti nei repository (`triage-automatico-dei-segreti-ne-jge73`)

- Fase: proposta completa; Champion: Irene; Autori: Irene; Trimestre: Q3
- Tag: sicurezza, developer tools
- **Problema**: Chiavi e password dimenticate nei repository restano esposte per mesi, e il team sicurezza non ha abbastanza persone per smistarle.
- **Utenti**: team di sicurezza e sviluppatori
- **Soluzione**: Scanner che classifica i segreti trovati per rischio, propone la rotazione e assegna il ticket al team proprietario del repo.
- **Differenziazione**: Triage e assegnazione automatica invece del solo allarme.
- **Fattibilità**: Fattibile con scanner open source e integrazione con il sistema ticket esistente.
- **Rischi**: Falsi positivi che stancano i team; gestione dei dati sensibili dei repo.
- Punteggi: impatto 5, fattibilità 8, novità 2, coerenza 5, rischio 3; pesato 5.2 (1 valutazioni)
  - Dario: Il rilevamento dei segreti è una commodity (GitHub secret scanning, GitGuardian, truffleHog): "triage e assegnazione" è una feature, non un prodotto. Senza un dato su quanti team pagherebbero o su cosa costa oggi il ritardo di rotazione, la differenziazione regge poco. Potrebbe v

## Scartate (0)

Nessuna.
