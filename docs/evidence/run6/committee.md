# Committee decisions (run 6)

Comitato Investimenti (council: Livia chair, Matteo, Dario; every seated member votes). Sessions on the grid of policy
`cadenza_sedute_comitato_ore` 2 (every two game hours from day 1 00:00); each session started at its grid time and
the ballots ran behind the four-run limiter, so the decision was recorded 1.8 and 2.2 game hours after the session
began. Both decisions were deferrals naming the unmet criterion `prove_del_problema`; each consumed one approval
slot (`costo_del_rinvio` 1), since both ideas met the candidacy requirements.

## Audit trail on-premise per decisioni AI (art. 12) con connettori legacy (`audit-trail-on-premise-per-decis-s6zr1`): **defer**

Submitted day 3 06:10, decided day 3 09:46. Evidence 3; reviews 3.

| member | vote | prove_del_problema | concorrenza | fattibilita | rischio | coerenza_strategica |
|---|---|---|---|---|---|---|
| Livia | defer | **unmet** | met | met | met | met |
| Matteo | defer | **unmet** | met | met | met | met |
| Dario | defer | **unmet** | met | met | met | met |

Unmet (chair): prove_del_problema. Out-of-policy demands recorded: 3.

- Verificare la data di applicazione dell'art. 12 sulla fonte ufficiale (la fonte citata riporta 2 dic 2027, dato non ancora verificato).
- Specificare nel progetto integrità dei log (append-only con hash/firma), gestione delle chiavi e controllo degli accessi.
- Verificare la data di applicazione dell'art. 12 sulla fonte ufficiale (la fonte citata riporta 2 dic 2027, ma il dato non è ancora verificato).

Chair's summary: «Idea rinviata: il problema è plausibile e coerente con la strategia, ma le prove allegate (due fonti web sulla norma e un segnale HN che indica concorrenza, non domanda) non mostrano che banche, ospedali o logistica soffrano il problema. Gl»

- Livia on `prove_del_problema`: «Le prove sono la norma (art. 12) e un articolo sul tema, più un segnale HN da 2 punti che è concorrenza e non domanda. Non c'è nessuna validazione presso banche, ospedali o logistica, né volumi o interviste con i responsabili compliance/DPO o il team IT.»
- Matteo on `prove_del_problema`: «Le prove sono una fonte sulla norma (art. 12), un articolo di mercato e un segnale HN da 2 punti che è concorrenza, non domanda. Nessuna evidenza che banche, ospedali o logistica abbiano il problema: mancano interviste, validazioni o richieste da parte degli utenti indicati.»
- Dario on `prove_del_problema`: «Le prove sono due fonti web sulla norma e un segnale HN da 2 punti che è concorrenza, non domanda. Nessuna prova che banche, ospedali o logistica abbiano il problema: i 'segnali' Banca/Ospedale/Logistica sono affermazioni senza fonte. Manca anche un dato di volume.»

## Audit trail on-premise per decisioni AI con connettori legacy (`audit-trail-on-premise-per-decis-x5zy5`): **defer**

Submitted day 4 08:42, decided day 4 12:14. Evidence 4; reviews 5.

| member | vote | prove_del_problema | concorrenza | fattibilita | rischio | coerenza_strategica |
|---|---|---|---|---|---|---|
| Livia | defer | **unmet** | met | met | met | met |
| Matteo | defer | **unmet** | met | met | met | met |
| Dario | kill | **unmet** | **unmet** | met | met | met |

Unmet (chair): prove_del_problema. Out-of-policy demands recorded: 5.

- Valutare l'unione con audit-trail-on-premise-per-decis-s6zr1 (duplicato quasi identico) e portare un'unica candidatura con le prove consolidate
- Valutare l'unione con audit-trail-on-premise-per-decis-s6zr1 (duplicato quasi identico, segnalato da Dario e Irene) e portare un'unica candidatura con le prove consolidate.
- Allegare un dimensionamento di mercato con fonte, anno e unità, e le validazioni delle quattro voci dei clienti.
- Verificare se è un duplicato di audit-trail-on-premise-per-decis-s6zr1 e, in caso, unire prove e rischi.
- Allegare un dimensionamento di mercato con fonte, anno e unità (la spesa AI citata nel problema non è ancora documentata).

Chair's summary: «Rinviata: il problema non è ancora documentato da prove allegate presso i clienti indicati. Le voci di Banca, Ospedale, Logistica e Assicurazione restano nel testo senza validazione allegata, i due segnali HN indicano concorrenza e non doma»

- Livia on `prove_del_problema`: «Le quattro voci dei clienti (Banca, Ospedale, Logistica, Assicurazione) stanno nel testo, ma non come prove allegate con fonte. Le due prove HN (2 e 3 punti) mostrano soprattutto concorrenza, non domanda. Manca un dimensionamento con fonte, anno e unità. La fonte web sull'art. 12»
- Matteo on `prove_del_problema`: «Le quattro voci dei clienti (Banca, Ospedale, Logistica, Assicurazione) non sono allegate come prove verificabili. I due segnali HN (2 e 3 punti) mostrano concorrenza, non domanda. La fonte art. 12 prova l'esistenza dell'obbligo, non che gli utenti indicati soffrano il problema.»
- Dario on `prove_del_problema`: «Le quattro voci dei clienti non sono allegate come prova. I due segnali HN mostrano soprattutto concorrenza, non domanda presso Banca, Ospedale, Logistica e Assicurazione. Nessun dimensionamento con fonte, anno e unità. L'art. 12 prova l'obbligo regolatorio, non che gli utenti lo»

## What the members said about the schedule

- Matteo (day 4 10:21): «La seduta del comitato è alle 10:00 e gli slot scadono alle 10:00.»
- Livia (day 4 11:32): «Comitato: seduta alle 12:00. Porto in votazione x5zy5 insieme a s6zr1, decidiamo sui criteri della policy.» The 10:00 session was still deciding; perception named the next grid point, 12:00 (fixed after the run: while a session is convened or deciding the line says it is under way).
- Giulia (day 4 11:03): «Matteo, chiedo di togliere x5zy5 dalla coda del comitato.» No tool withdraws a submission; the session decided on it.
