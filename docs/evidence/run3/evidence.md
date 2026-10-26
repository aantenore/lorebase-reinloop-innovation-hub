# Evidence (run 3)

Every piece of evidence attached to an idea during the run (Lorebase Kind `Evidence` on the idea branch), grouped by idea. Weights are the policy weights when collected; simulated interviews would carry weight 0 and the label `ipotesi` (none were run).

## Assistente AI per la sicurezza nei team IT piccoli (`assistente-ai-per-la-sicurezza-n-972z1`)

Stage proposal, champion Livia, authors Livia, Irene; 12 pieces; real 12, distinct sources 2, human validations 0; candidacy requirements met.

### public_signal (1)

- [Launch HN: Traceforce (YC S26) – Company-wide security monitoring for AI apps](https://news.ycombinator.com/item?id=48937020) (hackernews, points 44; weight 1; Livia, giorno 1 13:52)
  > Un prodotto di monitoraggio sicurezza per app AI ha ricevuto attenzione (44 punti, 28 commenti): segnale di interesse per la sicurezza attorno all'AI aziendale. È adiacente, non identico, all'assistente per team piccoli.

### web_source (11)

- [AI for Small IT Teams: How to Give People AI Without Losing Control of Your Data](https://www.mrc-productivity.com/blog/2026/06/ai-for-small-it-teams-how-to-give-people-ai-without-losing-control-of-your-data/) (web; weight 0.5; Livia, giorno 1 13:52)
  > Piccoli team IT che adottano AI senza perdere controllo dei dati; citata una quota dell'8,5% di usi con dati sensibili (record clienti, codice sorgente). Sostiene il problema della sicurezza nei team piccoli, non l'efficacia di un assistente.
- [Best AI Security Tools for Small Teams (2026 Honest Review)](https://sequirly.com/blog/best-ai-security-tools-small-teams) (web; weight 0.5; Livia, giorno 1 18:18)
  > Strumenti di sicurezza AI per team sotto i 100 utenti senza reparto IT: prezzi pubblici indicativi, ad esempio Team a 19 dollari per utente al mese (15 annuale). Prova di prezzo di riferimento per il pagante, da confermare con interviste.
- [Microsoft Security Copilot Security Alert Triage Agent in Microsoft Defender (Preview) - Microsoft Defender XDR](https://learn.microsoft.com/en-us/defender-xdr/security-alert-triage-agent) (web; weight 0.5; Giulia, giorno 2 01:51)
  > Pagina ufficiale di un concorrente: un agente AI di triage degli alert già in preview dentro Defender. Non è una validazione umana; mostra che la fascia "assistente AI per la sicurezza" è presidiata da grandi vendor, quindi la differenziazione per i team IT piccoli va dimostrata.
- [Pricing](https://www.aisecurityplatform.ai/pricing) (web, metric 10 given by the author; weight 0.5; Livia, giorno 2 15:01)
  > Piani a 10 USD e 15 USD per utente al mese: prezzo di listino di un concorrente, non un prezzo accettato da clienti. Da usare come seconda fonte di prezzo indipendente, con data di verifica da confermare.
- [AI SOC Pricing Guide 2026: Complete Cost Breakdown](https://underdefense.com/blog/ai-soc-pricing-guide/) (web; weight 0.5; Livia, giorno 2 18:07)
  > Listino di un vendor, non prezzo accettato: ~10-37 USD per endpoint/mese per servizi AI SOC; prodotto diverso (SOC gestito), solo come fascia indicativa. Data: 2026 (pagina).
- [AI SOC Security: Prompt Injection Risks](https://neuraltrust.ai/blog/ai-soc-prompt-injection) (web; weight 0.5; Irene, giorno 3 09:28)
  > Pagina di un vendor che riporta un'attack success rate media dell'83,4% per prompt injection da log su tre LLM senza difese, e riduzione a 8,4% con difese a più livelli su GPT-4o (cita Karanjai et al., 2026). Fonte secondaria: il paper originale non l'ho trovato su arXiv; dato da
- [Adversarial Machine Learning: A Taxonomy and ...](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-2e2025.pdf) (web; weight 0.5; Irene, giorno 3 13:31)
  > Fonte pubblica indipendente da vendor (NIST). Classifica prompt injection diretta e indiretta e la sicurezza degli agenti AI, con mitigazioni e limiti. Sostiene il rischio di prompt injection da log e ticket dell'assistente, quindi i controlli di permessi minimi e revisione umana
- [The Price of Progress Price Performance and the Future of AI](https://arxiv.org/html/2511.23455v2) (web; weight 0.5; Giulia, giorno 4 06:22)
  > Fonte accademica pubblica sull'andamento prezzo/prestazioni dell'inferenza AI; usata solo come trend qualitativo, senza cifre.
- [ISC2 Survey: 30% of Cyber Pros Using AI Security Tools](https://www.isc2.org/Insights/2025/07/2025-isc2-ai-pulse-survey) (web; weight 0.5; Matteo, giorno 4 12:45)
  > Organizzazioni più piccole (1–99 dipendenti) tra le meno adottanti: solo il 20% usa attivamente strumenti AI per la sicurezza; il 23% non prevede di valutarli. Dato di adozione, non prova diretta del problema dei team piccoli.
- [LLM inference prices have fallen rapidly but unequally across tasks](https://epoch.ai/data-insights/llm-inference-price-trends) (web; weight 0.5; Irene, giorno 4 14:29)
  > Fonte indipendente da vendor (Epoch AI, ricerca). Il calo del prezzo per raggiungere una data soglia di prestazione va da 9x a 900x per anno, a seconda del benchmark; es. GPT-4 su domande PhD-level ~40x/anno. Dato sul calo, ma molto variabile e non applicabile in modo uniforme: i
- [LLM Prompt Injection Prevention - OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html) (web; weight 0.5; Livia, giorno 4 16:03)
  > Lo screening degli input non è un confine di sicurezza; i permessi vanno imposti a parte, con least privilege e approvazione umana per le operazioni privilegiate. Rilevante per il limite «solo triage alert» e per il test richiesto da Dario.

## Audit on-premise delle decisioni AI per settori regolati (`audit-on-premise-delle-decisioni-8st6e`)

Stage proposal, champion Matteo, authors Matteo; 0 pieces; real 0, distinct sources 0, human validations 0; candidacy requirements not met.

None.
