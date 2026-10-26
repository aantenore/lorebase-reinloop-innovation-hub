# Conversations and thoughts (run 1, curated)

Selected from the run's conversation log (`GET /api/conversations`), the reviews on the ideas and the research log
(`GET /api/research`). Times are game time (day, hour). Quotes are verbatim Italian; the short notes in italics
say what happened around them. Texts cut by the world's limits (`commentMaxChars`, `traceMaxChars`) end with "...".

## 1. A search that changed an idea: competitors on-premise (day 1)

*Livia proposes "AI on-premise chiavi in mano per strutture sanitarie" at 11:55, claiming nobody sells it turnkey.
Dario searches the web before reviewing it:*

- 12:31 **Dario** cerca «on-premise private LLM appliance hospitals healthcare vendors 2025»
- 12:32 **Dario** cerca «AI Act GDPR medical device software hospital on-premise LLM compliance requirements»
- 12:37 **Dario**, review (impact 6, feasibility 5, novelty 2, fit 6, risk 7):
  > La differenziazione 'nessuno fa on-prem chiavi in mano' è falsa: ci sono già Taction, Medicus AI, Petronella e
  > iternal che vendono proprio questo. Gestione da noi = servizi per cliente, margine a rischio; 'codifica di
  > referti' sfiora il dispositivo medico (MDR/AI Act). ...
- 13:41 **Livia** rewrites solution, differentiation, feasibility, risks and attaches sources. The new differentiation:
  > Correzione dopo la review di Dario: esistono già fornitori on-prem per sanità (Taction, Medicus AI, Petronella,
  > iternal, e piattaforme self-hosted come ibl.ai). Non vendiamo 'l'unico on-prem' ma un wedge più stretto: cliniche
  > private e ASL medie ...

## 2. Checking a number against the sources (day 1)

*Matteo had estimated 95-145k$ for a one-connector pilot. Dario and Livia look for interface prices:*

- 13:55 **Dario** cerca «hospital legacy EHR integration cost HL7 FHIR on-premise AI deployment per hospital»
- 14:53 **Dario** cerca «EHR integration cost pilot hospital interface engine HL7 FHIR cost range»
- 15:02 **Dario**, updated review:
  > Aggiornamento dopo ricerca: una singola interfaccia HL7v2 costa circa 10-20k$ secondo fonti di vendor, quindi i
  > 95-145k$ di Matteo per un pilota a 1 connettore vanno spiegati, non accettati. Ma le fonti sono tutte vendor di
  > integrazione, e il costo hardware e la manutenzione annu...
- 17:29-17:31 **Livia** legge tebra.com e pabau.com, cerca «nirmitee.io HL7 interface cost ...». Her feasibility then says:
  > Verificati alla lettera: interfaccia HL7v2 $5,000-$15,000 build + $1,200-$3,600/anno (nirmitee.io/...);
  > hardware on-premise $10,000-$50,000 (pabau.com/...). Il 15-20% di manutenzione attribuito a Tebra NON è
  > verificato e va escluso ...

## 3. The quota runs out, and they say so (day 1, 16:26-18:07)

*Six searches per person per day (`ricerche_web_per_persona_al_giorno`). Matteo has used his:*

- 16:26 **Matteo** (pensiero): «Le ricerche web sono esaurite per oggi, quindi l'idea ospedale resta ferma. Mi sposto
  alla postazione e avviso il comitato.»
- 16:27 **Matteo** a tutti: «Comitato: ricerche web esaurite per oggi. Nessun TCO ospedale candidabile finché
  manutenzione e hardware non hanno fonti. Lavoro sui segnali verificati.»
- 18:07 **Matteo** (pensiero): «Le ricerche web di oggi sono esaurite, quindi non posso portare a Dario la fonte
  indipendente promessa: dichiaro il limite invece di far passare numeri non verificati.»

## 4. The committee session (day 1, 18:07-18:15)

- 18:07 **Livia** a tutti: «Comitato: ho candidato l'AI on-premise sanità prima del freeze. Punteggio 5, dichiaro i
  limiti: costi solo da fonti vendor, nessuna quotazione reale, disponibilità a pagare non testata. Chiedo un via
  libera condizionato a un pilota con quot...»
- 18:12 **Livia** (voto, defer): «L'idea ha un problema reale e un wedge più stretto credibile, ma il TCO del pilota
  (95-145k$) non è ancora validato da quotazioni reali: le fonti sono solo vendor, la disponibilità a pagare non è
  testata e Matteo ha segnalato il costo di integrazione non quantificato. ...»
- 18:12 **Matteo** (voto, defer): «Il problema è reale e il wedge (cliniche private e ASL medie, audit incluso,
  GDPR/AI Act) è sensato, ma il TCO di integrazione HL7/FHIR e il costo del nodo GPU non sono ancora quotati con
  fonti reali ...»
- 18:15 **Livia** (presidente, decisione defer): «Il problema è reale e il wedge (cliniche private e ASL medie, audit
  incluso, UE) è credibile. Ma il TCO del pilota si basa solo su fonti vendor e la disponibilità a pagare non è
  testata, quindi non impegniamo uno slot ora. ...»

*The champion chaired the session on her own idea and voted to defer it.*

## 5. A playbook rule learned from the deferral (day 1)

*Sara (UX designer) shares a rule for her role; no other UX designer exists, so it is accepted automatically:*

> Nelle idee di triage dei sinistri, le cifre sul costo di un sinistro gestito a mano vanno raccolte da fonti
> indipendenti prima del voto; l'UX va validata con i revisori reali, non dedotta dai vendor.

## 6. Correcting an attribution with a fetch (day 2, 09:01-11:10)

- 09:01 **Livia** a tutti: «ho aggiornato il triage sinistri con un dato nuovo ma di vendor (Hesper: 46% dei
  professionisti spende 30-40% del tempo in amministrativo), segnato come non verificato. ...»
- 09:34 **Matteo** cerca «Hesper 46% professionals spend 30-40% time administrative claims», 09:38 legge un articolo di
  riskandinsurance.com.
- 10:05-10:19 **Livia** rewrites the triage risks (final text):
  > Il 46% è del Rising Medical Solutions 2024 Workers' Comp Benchmarking Study (US, via Risk & Insurance), non di
  > Hesper: misura il dolore, non la disponibilità a pagare.
- 11:10 **Dario** a tutti: «criterio per il comitato. Ogni numero entra come dato solo con cliente, base dati, data e
  fonte. Il resto è ipotesi. Il 46% resta una misura del dolore, non della domanda.»

## 7. Untrusted documents, from the security side (day 2, 09:58)

**Irene**, review of the triage idea:
> Dal lato sicurezza: i PDF e le email dei sinistri sono un vettore di prompt injection (testo nascosto nei documenti
> che pilota l'estrazione) e contengono dati personali e sanitari, quindi servono minimizzazione, log di accesso e
> separazione dei dati di pratiche diverse. ...

## 8. Not spending a slot (day 2, night)

- 05:26 **Livia** (pensiero): «Le due idee hanno punteggio ~5 e cifre non verificate: candidarle prima del freeze
  brucerebbe uno slot. Aspetto le 8 e le interviste col team.»
- 12:16 **Livia** a tutti: «scadenza operativa. Entro le 12:40 Bruno consegna la tabella (anche parziale, con
  verificato/ipotesi), Sara le interviste già chiuse, Enea il confronto con le fonti. Alle 12:45 il comitato decide su
  triage sinistri con ciò che c'è ...»

*The run ended at 13:47, before that session.*

## 9. A loop that never resolved (day 1 night - day 2)

*Irene and Giulia wait for each other for hours: Irene cannot synthesise an insight without a "pain" and a "trend"
signal, and her Lorebase consultations per decision are spent.*

- 22:17 **Irene** (pensiero): «Mancano i segnali pain e trend per la sintesi dell'insight, e Giulia aspetta da ore senza
  un esito. Mi avvicino per dirle lo stato reale, poi cerco i segnali su Lorebase e sul campo ...»
- 23:13 **Giulia** (pensiero): «Ho promesso a Irene di restare alla postazione e non toccare nulla finché non arriva un
  codice verificato; intanto aspetto senza sprecare consultazioni di Lorebase.»
