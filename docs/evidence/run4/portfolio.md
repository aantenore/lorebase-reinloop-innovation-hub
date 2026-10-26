# Portafoglio idee - Hub Innovazione (Q3)

## Approvate (0)

Nessuna.

## In pipeline (1)

### Triage di sicurezza AI a costo ridotto (`triage-di-sicurezza-ai-a-costo-r-tnsa1`)

- Fase: proposta completa; Champion: Giulia; Autori: Giulia, Irene; Trimestre: Q2
- Tag: sicurezza, ai, consolidamento
- **Problema**: Le aziende medie non trovano esperti di sicurezza e pagano troppi strumenti SaaS sovrapposti. Il budget si sta spostando verso l'AI, ma spesso finisce in altri tool invece di risolvere il triage degli avvisi di sicurezza.
- **Utenti**: Team IT e DevOps di aziende medie senza un security engineer dedicato
- **Soluzione**: Un modello di triage per gli alert di sicurezza, eseguito in locale (on-premise) nel perimetro del cliente: il modello gira su infrastruttura del cliente, senza chiamate verso API esterne. I dati sensibili (cartelle cliniche, audit bancari) non escono dal perimetro del cliente; nessun dato sensibile viene inviato a fornitori terzi, e i log restano nel perimetro. Primo passo: pilota con un cliente, su dati anonimizzati, prima di qualsiasi uso su dati reali.
- **Differenziazione**: Consolidamento di più tool in uno solo, costruito sul calo del prezzo dell'inferenza: il costo per avviso scende abbastanza da renderlo accessibile a chi oggi non può assumere.
- **Fattibilità**: Modelli open-weight piccoli e medi eseguibili on-premise con costi di inferenza in calo. Il pilota richiede un cliente disponibile e un ambiente di test isolato; nessun pilota è ancora avviato, e va proposto come condizione per l'investimento.
- **Rischi**: RISCHI DI SICUREZZA (Irene, security): 1) Fuga di dati sensibili: i documenti bancari, sinistri o clinici inviati al triage possono contenere PII e dati regolati; serve on-prem o VPC dedicata, nessun invio a API terze senza DPA. 2) Prompt injection tramite testo dei documenti: un allegato può manipolare la classificazione (es. abbassare la severità di un incidente); serve separazione istruzioni/dati e controllo umano sui casi critici. 3) Falsi negativi: un incidente classificato come basso può p
- Punteggi: impatto 6, fattibilità 5.8, novità 4, coerenza 6.3, rischio 6.5; pesato 5.4 (4 valutazioni)
  - Dario: Le due fonti sono paper sul triage LLM, non prove di domanda: nessuna dimostra che le aziende medie pagherebbero, né che il costo per avviso renda il prodotto accessibile. Zero validazioni umane e zero clienti pilota: la strada alternativa non esiste ancora.
  - Irene: Problema reale e consolidamento SaaS plausibile, ma il rischio sicurezza è alto: dati sensibili nei prompt e clienti come ospedali che esigono on-premise non sono risolti nella proposta. Le prove sono paper e un repo gratuito; nessuna citazione letterale verificata con fonte, dat
  - Livia: Con la Soluzione aggiornata (modello in locale, dati sensibili nel perimetro del cliente) il vincolo on-premise ora è una soluzione e non solo un rischio dichiarato: il rischio scende da 7 a 5. Resta aperto il pilota: senza un cliente e un ambiente di test non c'è domanda dimostr
  - Matteo: Problema concreto e consolidamento coerente, ma le prove sono paper e prezzi di vendor: nessuna spesa cliente verificata. Non candidabile al comitato in questo slot; va prima un cliente pilota con dati anonimizzati.
- Prove (8):
  - Fonte web (web; peso 0.5): [From Investigation Failures to Reliable SOC Agents: Understanding and Improving LLM-Based Alert Triage](https://arxiv.org/html/2610.10608v1) - Agenti LLM per il triage degli avvisi SOC: un prompt diretto usa circa 5.000 token per avviso con il F1 più alto; i metodi più costosi (oltre 28.000 token) non migliorano. Il costo per avviso è un vin (Giulia)
  - Fonte web (web; peso 0.5): [Evaluation of LLM Agents for the SOC Tier 1 Analyst Triage Process](https://www.utupub.fi/bitstreams/3a5765e0-ef07-41f2-b801-75f432d58777/download) - Gli agenti LLM migliorano la velocità del triage di primo livello e riducono il carico cognitivo degli analisti; restano rischi di allucinazioni, complessità di integrazione e privacy. (Giulia)
  - Segnale pubblico (github, stars 3884; peso 1): [beenuar/AiSOC](https://github.com/beenuar/AiSOC) - Progetto GitHub con 3884 stelle, 22 issue aperte, aggiornato oggi: alert fusion e triage con agenti LLM, self-hostable, MIT. Segnale di domanda forte per il triage AI, ma anche di concorrenza gratuita (Giulia)
  - Fonte web (web; peso 0.5): [Best AI Tools for Security Alert Triage (2026)](https://panther.com/blog/ai-tools-security-alert-triage) - Prezzi enterprise dei tool di triage: base da 36.000 USD/anno; altri da 59K a 313K/anno senza tier per le PMI. Mostra un gap SMB, non disponibilità a pagare delle PMI. (Matteo)
  - Fonte web (web; peso 0.5): [How much SOC as a service costs, and what the price includes · SaaSInsight](https://www.saasinsight.io/guides/soc-as-a-service-pricing) - Prezzi pubblicati dei SOC-as-a-service da 5 a 28 dollari per utente al mese: esiste una fascia bassa di spesa per la sicurezza in aziende piccole e medie. Non prova però che paghino per un triage AI d (Matteo)
  - Fonte web (web; peso 0.5): [MDR Pricing in 2026: What It Actually Costs](https://daylight.ai/blog/mdr-pricing) - Dal fornitore: entry level MDR (monitoraggio 24/7, alert triage, contenimento di base) a 8-25 dollari per endpoint al mese. Nota: è prezzo di vendor, non una prova di pagamento di una PMI; il prezzo è (Irene)
  - Fonte web (web; peso 0.5): [SOC as a Service Pricing in 2026](https://www.bdemerson.com/article/soc-as-a-service-pricing) - Prezzo di vendor/articolo, non dato di clienti: detection e response 8-25 $/endpoint/mese; il triage che valida e arricchisce gli alert costa di più, e il tier basso taglia proprio il triage. Non prov (Matteo)
  - Fonte web (web; peso 0.5): [Insurance Industry Spending Billions on AI With Little to Show for It, New Research Finds from Simplifai](https://simplifai.ai/news/insurance-industry-spending-billions-on-ai-with-little-to-show-for-it-new-research-finds-from-simplifai) - Ricerca di un vendor (Simplifai): 14% degli assicuratori spende oltre 50 milioni di dollari l'anno in AI generativa; 83% dei grandi carrier USA/Europa destina almeno 5 milioni l'anno all'AI. È spesa a (Matteo)
- Decisione del comitato: rimandata - Il problema è concreto e il consolidamento SaaS è coerente, ma le prove sono solo paper e fonti di prezzo di vendor, senza domanda dimostrata, pilota o validazioni umane, e il rischio su dati sensibili e AI Act resta alto. Rimandiamo: serve

## Scartate (0)

Nessuna.
