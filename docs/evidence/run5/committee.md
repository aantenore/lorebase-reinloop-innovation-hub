# Committee decisions (run 5)

No session: nothing was submitted, so the Comitato Investimenti (council: Livia chair, Matteo, Dario; every seated
member votes since `ideas.committee.maxVoters` is 0) never cast a `vota_idea` ballot. `criteriaMet`, `criteriaUnmet`,
`outOfPolicy` and `deferralSlots` are all empty or 0 in [summary.json](summary.json).

The one idea that met the candidacy requirements (9 real pieces of evidence from 3 sources, gate passed from day 1)
stayed at `proposal`: its author Irene held it back until the text of art. 12 of the AI Act was read from EUR-Lex and
a DPO validated it, and the committee members asked her to. Their own words show that the new policies were read:

- Dario: «Un rinvio brucerebbe uno slot: se decidiamo, è kill sul criterio prove del problema.»
- Matteo: «non porto un rinvio che consuma slot»; «l'obiettivo è 3 concept esplorati».
- Livia: «l'audit bancario NON viene candidato. Art. 12 non validato (web esaurita, nessun DPO), quindi niente slot
  consumato.»

Offline (`npm run game:mock`, same commit) the committee path ran end to end: 8 sessions, 3 ballots each, every
deferral and kill naming an unmet criterion, deferrals of ideas meeting the requirements consuming 1 slot.
