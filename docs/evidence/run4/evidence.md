# Evidence (run 4)

Every piece of evidence attached to an idea during the run (Lorebase Kind `Evidence` on the idea branch), grouped by idea. Weights are the policy weights when collected; no simulated interview and no human validation were made.

## Triage di sicurezza AI a costo ridotto (`triage-di-sicurezza-ai-a-costo-r-tnsa1`)

Stage proposal, champion Giulia, authors Giulia, Irene; 8 pieces; real 8, distinct sources 2, human validations 0; candidacy requirements met per policy (3 real, 2 sources).

### web_source (7)

- [From Investigation Failures to Reliable SOC Agents: Understanding and Improving LLM-Based Alert Triage](https://arxiv.org/html/2610.10608v1) (web; weight 0.5; Giulia, giorno 1 13:08)
  > Agenti LLM per il triage degli avvisi SOC: un prompt diretto usa circa 5.000 token per avviso con il F1 più alto; i metodi più costosi (oltre 28.000 token) non migliorano. Il costo per avviso è un vincolo reale.
- [Evaluation of LLM Agents for the SOC Tier 1 Analyst Triage Process](https://www.utupub.fi/bitstreams/3a5765e0-ef07-41f2-b801-75f432d58777/download) (web; weight 0.5; Giulia, giorno 1 13:08)
  > Gli agenti LLM migliorano la velocità del triage di primo livello e riducono il carico cognitivo degli analisti; restano rischi di allucinazioni, complessità di integrazione e privacy.
- [Best AI Tools for Security Alert Triage (2026)](https://panther.com/blog/ai-tools-security-alert-triage) (web; weight 0.5; Matteo, giorno 1 21:11)
  > Prezzi enterprise dei tool di triage: base da 36.000 USD/anno; altri da 59K a 313K/anno senza tier per le PMI. Mostra un gap SMB, non disponibilità a pagare delle PMI.
- [How much SOC as a service costs, and what the price includes · SaaSInsight](https://www.saasinsight.io/guides/soc-as-a-service-pricing) (web; weight 0.5; Matteo, giorno 1 22:31)
  > Prezzi pubblicati dei SOC-as-a-service da 5 a 28 dollari per utente al mese: esiste una fascia bassa di spesa per la sicurezza in aziende piccole e medie. Non prova però che paghino per un triage AI da solo; spesso onboarding e log restano esclusi.
- [MDR Pricing in 2026: What It Actually Costs](https://daylight.ai/blog/mdr-pricing) (web; weight 0.5; Irene, giorno 2 01:39)
  > Dal fornitore: entry level MDR (monitoraggio 24/7, alert triage, contenimento di base) a 8-25 dollari per endpoint al mese. Nota: è prezzo di vendor, non una prova di pagamento di una PMI; il prezzo è per endpoint e include servizio umano.
- [SOC as a Service Pricing in 2026](https://www.bdemerson.com/article/soc-as-a-service-pricing) (web; weight 0.5; Matteo, giorno 2 02:57)
  > Prezzo di vendor/articolo, non dato di clienti: detection e response 8-25 $/endpoint/mese; il triage che valida e arricchisce gli alert costa di più, e il tier basso taglia proprio il triage. Non prova che una PMI paghi per il triage.
- [Insurance Industry Spending Billions on AI With Little to Show for It, New Research Finds from Simplifai](https://simplifai.ai/news/insurance-industry-spending-billions-on-ai-with-little-to-show-for-it-new-research-finds-from-simplifai) (web; weight 0.5; Matteo, giorno 3 04:04)
  > Ricerca di un vendor (Simplifai): 14% degli assicuratori spende oltre 50 milioni di dollari l'anno in AI generativa; 83% dei grandi carrier USA/Europa destina almeno 5 milioni l'anno all'AI. È spesa aggregata in AI generica, NON spesa documentata su sinistri documentali di un cli

### public_signal (1)

- [beenuar/AiSOC](https://github.com/beenuar/AiSOC) (github, stars 3884; weight 1; Giulia, giorno 1 15:17)
  > Progetto GitHub con 3884 stelle, 22 issue aperte, aggiornato oggi: alert fusion e triage con agenti LLM, self-hostable, MIT. Segnale di domanda forte per il triage AI, ma anche di concorrenza gratuita da considerare nei rischi.
