# Committee decisions (run 4)

Two sessions, both on the same idea, both **defer**. The Comitato Investimenti (council: Livia chair, Matteo, Dario)
sat with quorum 2; no member was an author (policy `comitato_non_coautore`), so nobody recused and no alternate was
needed (`recusals` 0, `alternates` 0). In the economy profile `groups.maxProposers` is 2, so the two members with the
highest vote weight voted (Livia, Matteo); Dario, the sharpest critic in conversation, never cast a ballot.

## 1. Triage di sicurezza AI a costo ridotto: defer (day 1 16:23)

Submitted by Giulia on day 1 15:35 with 3 pieces of real evidence from 2 sources (requirements met per policy) and 2
reviews (Dario, Livia).

- Livia (defer): «Il problema è concreto e il consolidamento SaaS è una leva reale, ma la prova è debole: due paper
  sul triage LLM e un repo GitHub che dimostra interesse per il tema, non disponibilità a pagare; manca un pilota o
  una validazione umana, e il rischio su dati sensibili e concorrenza ...»
- Matteo (defer): «... le prove sono solo paper sul triage LLM e un segnale GitHub (AiSOC, progetto gratuito e
  self-hostable): nessuna dimostra che le aziende medie pagherebbero né che il costo per avviso renda il prodotto
  accessibile ...»
- Chair's summary (Livia): «... due paper sul triage LLM e un repo open-source gratuito (AiSOC) non dimostrano
  disponibilità a pagare né che il costo per avviso renda il prodotto ...»

## 2. Triage di sicurezza AI a costo ridotto: defer (day 2 11:05)

Resubmitted by Giulia on day 2 10:01 after Matteo and Irene added four pricing pages (7 real pieces, 2 sources) and
Irene rewrote the risks; 3 reviews.

- Livia (defer): «... le prove sono solo paper e fonti di prezzo di vendor, senza domanda dimostrata, pilota o
  validazioni umane; il rischio su dati sensibili e AI Act resta alto e va risolto con un piano on-premise e una
  validazione con u[n cliente] ...»
- Matteo (defer): «Le prove sono solo fonti di prezzo di vendor e paper, senza dati di disponibilità a pagare, pilota
  o validazione umana, e il rischio su dati sensibili e AI Act resta non risolto: serve una validazione con un
  cliente pilota e un modello on-premise dimostrato prima di decidere ...»
- Chair's summary: «... Rimandiamo: serve ...» (cut at `decisions.textMaxChars`).

After the second deferral Giulia rewrote solution, feasibility and risks (on-premise model, pilot on anonymised data);
Livia's new review lowered risk from 7 to 5. The idea was never submitted again: see [conversations.md](conversations.md).
