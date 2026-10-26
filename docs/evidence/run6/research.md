# Research (run 6)

Counters from `/api/research` about a minute before the stop (the final progress line has 133 refusals).

Web provider: anthropic-native. Web searches 40, page reads 4, cache hits 1, refused 132 plus 16 capped per decision, errors 1. Search quotas `ricerche_web_per_persona_al_giorno` 3, `ricerche_web_totali_al_giorno` 10; read quotas `letture_web_per_persona_al_giorno` 12, `letture_web_totali_al_giorno` 60.

Refusals by tool and cause (`reinloop.webRefusals`):

| tool:cause | n |
|---|---|
| `web_search:total_quota` | 80 |
| `web_search:person_quota` | 27 |
| `web_fetch:not_from_search` | 24 |
| `web_fetch:decision_cap` | 11 |
| `web_search:decision_cap` | 5 |
| `web_fetch:unavailable` | 1 |

Public signal searches 21 (refused 20, errors 1); refusals by tool and cause (`reinloop.signalRefusals`):

| tool:cause | n |
|---|---|
| `cerca_discussioni:decision_cap` | 9 |
| `cerca_paper:decision_cap` | 9 |
| `cerca_progetti:decision_cap` | 1 |
| `intervista_simulata:unavailable` | 1 |

No read was refused by a read quota: reads stopped at the per-decision cap (11) or at `not_from_search` (24, pages that were neither in the person's search results nor the official source of a signal they held). The four reads went to law-firm and vendor pages; neither idea carries the AI Act signal (both carry the three customer signals) and no conversation line mentions an official source, so the EUR-Lex page was most likely on nobody's list (inventories were not captured), while searches ran out on the hub quota (80 refusals).

The log below keeps the 65 calls the server holds. Titles and links only (no page content).

- giorno 1 12:24 **Matteo** web_search «insurance claims unstructured documents manual processing time cost survey 2024»
  - [Manual Processing Is Bleeding Your Margins: The True Cost of Unstructured Insurance Data](https://www.bem.ai/log/manual-processing-is-bleeding-your-margins-the-true-cost-of-unstructured-insurance-data)
  - [Optimize Insurance Claims Processing: AI Solutions](https://www.digiparser.com/blog/insurance-claims-processing)
  - [Insurance Document Processing - The Best Solutions for Carriers, Brokers and MGAs](https://parseur.com/blog/insurance-document-processing)
- giorno 1 12:52 **Dario** web_search «insurance claims unstructured documents manual processing hours survey»
  - [Intelligent Document Processing for Insurance: Use Cases](https://www.cleveroad.com/blog/intelligent-document-processing-for-insurance/)
  - [No Time to Lose: Solving Document Challenges in Insurance](https://www.abbyy.com/blog/solving-document-challenges-in-insurance/)
  - [OCR in Insurance: A Guide to Automating Document Workflows](https://www.infrrd.ai/blog/ocr-in-insurance)
- giorno 1 13:27 **Dario** cerca_discussioni «insurance claims unstructured documents LLM»
  - [Show HN: Epstein-Search – Local, AI-Powered Search Engine for the Epstein Files](https://github.com/simulationship/epstein-search)
- giorno 1 13:31 **Matteo** web_search «insurance claims unstructured documents processing manual review time adjusters survey»
  - [Leveraging LLMs for Unstructured Claims Data Analysis](https://arxiv.org/pdf/2606.06089)
  - [Insurance Document Automation:Cutting Manual Work and Errors](https://www.altexsoft.com/blog/insurance-document-automation/)
  - [Insurance Claims Red Flags: How Claims Teams Find Issues Buried in Long Files](https://www.nomad-data.com/blog/insurance-claims-red-flags)
- giorno 1 13:53 **Dario** web_search «insurance claims processing unstructured documents manual effort survey 2025»
  - [State of AI Adoption in Insurance 2025 Uncover the trends shaping AI adoption](https://www.roots.ai/hubfs/Reports%20and%20Whitepapers/Roots%20-%20State%20of%20AI%20Adoption%20in%20Insurance%202025.pdf)
  - [Insurance's GenAI unstructured data challenge](https://www.collibra.com/blog/insurance-s-genai-unstructured-data-challenge)
  - [Insurance Claims Automation Guide 2026](https://www.sonant.ai/blog/insurance-claims-automation-guide-2025)
- giorno 1 13:59 **Matteo** web_search «bank AI automated decisions audit explainability regulators requirement model risk»
  - [Explainable Graph Neural Networks for Interbank Contagion Surveillance: A Regulatory-Aligned Framework for the U.S. Banking Sector](https://arxiv.org/pdf/2604.14232)
  - [AI Banking Compliance Frameworks: What Banks Need in 2026](https://www.backbase.com/blog/ai-banking-compliance-frameworks)
  - [Explainable AI vs. black-box AI in banking: What examiners expect and what to ask your vendor - Abrigo](https://www.abrigo.com/blog/explainable-ai-vs-black-box-ai-in-banking/)
- giorno 1 16:14 **Enea** cerca_discussioni «insurance claims unstructured documents AI»
  - [Why not tablets for vertical markets?](https://news.ycombinator.com/item?id=4741219)
  - [BCBS blames AI as nearly $1B in questionable hospital charges appear](https://www.cnbc.com/2026/10/01/health-care-costs-insurance-claims-billing-ai.html)
  - [You Know Who Hates AI? Insurance Claims Adjusters](https://www.wired.com/story/insurance-claims-adjusters-really-hate-ai/)
- giorno 1 18:03 **Dario** web_search «annual number of insurance claims processed unstructured documents adjusters statistics»
  - [Mining for Information Gold in Unstructured Claims Data/Articles/CLM Magazine](https://www.theclm.org/Magazine/articles/mining-for-information-gold-in-unstructured-claims-data/112)
  - [Insurance Claims Adjuster Salary Guide 2026](https://www.sonant.ai/blog/insurance-claims-adjuster-salary)
  - [Claims adjusters, appraisers, examiners, & investigators](https://datausa.io/profile/soc/claims-adjusters-appraisers-examiners-investigators)
- giorno 1 18:18 **Irene** web_search «banca audit decisioni automatiche AI numero audit annui regolatore fonte»
  - [Banca d'Italia - N. 927 - L'applicazione dell'intelligenza artificiale in Banca d'Italia a supporto della gestione delle segnalazioni regolamentari](https://www.bancaditalia.it/pubblicazioni/qef/2025-0927/index.html)
  - [Sull'uso dell'intelligenza artificiale nei sistemi di ADR - DB](https://www.dirittobancario.it/art/sulluso-dellintelligenza-artificiale-nei-sistemi-di-adr/)
  - [Banking Insight 2023](https://www.bancaditalia.it/pubblicazioni/interventi-vari/int-var-2023/Siani-MIlano-03.10.2023.pdf)
- giorno 1 19:03 **Enea** web_search «insurance claims unstructured documents annual volume statistics regulator report»
  - [Statistical Handbook of Data Available to Insurance Regulators 2012](https://content.naic.org/sites/default/files/publications-sta-zu-statistical-handbook.pdf)
  - [Insurance Document Automation for Claims & Underwriting](https://www.tungstenautomation.com/blog/insurance-document-automation)
  - [Market Regulation Handbook 2025 Volume I](https://content.naic.org/sites/default/files/publication-market-reg-hb.pdf)
- giorno 1 19:07 **Enea** web_search «bank automated decision AI audit annual number of audits regulator report»
  - [Regulatory Reporting Automation for Swiss and European Banks - S-PRO](https://s-pro.io/blog/regulatory-reporting-automation)
  - [How Regulators Worldwide Are Addressing the Adoption of AI in Financial Services](https://www.skadden.com/insights/publications/2023/12/how-regulators-worldwide-are-addressing-the-adoption-of-ai-in-financial-services)
  - [Agentic AI in Banking With Audit-Ready Control](https://www.sardine.ai/blog/agentic-ai-in-banking)
- giorno 1 20:44 **Irene** web_search «bank AI automated decision audit frequency regulator requirement»
  - [Agentic AI in Banking With Audit-Ready Control](https://www.sardine.ai/blog/agentic-ai-in-banking)
  - [AI governance in banking: complete 2026 guide](https://www.backbase.com/blog/ai-governance-in-banking)
  - [From Transparency to Accountability and Back: A Discussion of Access and Evidence in AI Auditing](https://arxiv.org/pdf/2410.04772)
- giorno 2 04:21 **Matteo** web_search «frequenza audit decisioni automatiche AI banche regolatore volumi annui fonte pubblica»
  - [Il 91% delle banche dichiara l'AI come priorità, ma solo il 23% l'ha portata in produzione - Tom's Hardware](https://www.tomshw.it/business/banche-91-percento-priorita-ai-23-percento-produzione)
  - [AI in finanza: spiegabilità e auditabilità non sono più un’opzione](https://www.bnova.it/intelligenza-artificiale/ai-finanza-spiegabilita/)
  - [Dipartimento di Giurisprudenza Cattedra Diritto Commerciale Progredito](https://tesi.luiss.it/40506/1/161933_DEL%20VECCHIO_VITTORIO.pdf)
- giorno 2 04:46 **Matteo** web_search «insurance claims unstructured documents volume annual claims per insurer statistics source»
  - [Mining for Information Gold in Unstructured Claims Data/Articles/CLM Magazine](https://www.theclm.org/Magazine/articles/mining-for-information-gold-in-unstructured-claims-data/112)
  - [The Other 80%: The Unstructured Data Challenge in P&C Insurance](https://www.guidewire.com/resources/blog/partner-perspective/the-other-80-the-unstructured-data-challenge-in-pc-insurance)
  - [How AI Can Maximize Unstructured Data](https://www.insurancethoughtleadership.com/ai-machine-learning/how-ai-can-maximize-unstructured-data)
- giorno 2 05:47 **Irene** web_search «EU AI Act high-risk credit scoring banking obligations human oversight logging audit»
  - [EU AI Act Credit Scoring High-Risk System Guide (July 2026)](https://www.openlayer.com/blog/credit-scoring-eu-ai-act-compliance-guide)
  - [The Future of Credit Underwriting and Insurance Under the EU AI Act: Implications for Europe and Beyond · Issue 7.3, Summer 2025](https://hdsr.mitpress.mit.edu/pub/19cwd6qx)
  - [Operationalise AI Governance for Financial Services](https://www.modulos.ai/industries/financial-services/)
- giorno 2 06:02 **Irene** web_fetch https://www.openlayer.com/blog/credit-scoring-eu-ai-act-compliance-guide
  - [EU AI Act Credit Scoring High-Risk System Guide (July 2026) | Openlayer](https://www.openlayer.com/blog/credit-scoring-eu-ai-act-compliance-guide)
- giorno 2 06:23 **Dario** web_search «AI Act high-risk creditworthiness banking automated decisions audit number of banks annual volume regulator statistics»
  - [Operationalise AI Governance for Financial Services](https://www.modulos.ai/industries/financial-services/)
  - [1. Introduction](https://www.frontiersin.org/journals/artificial-intelligence/articles/10.3389/frai.2023.1277544/xml)
  - [Explainable Artificial Intelligence in Credit Risk: A Systematic Evidence Map for Regulated Credit Decisions](https://www.mdpi.com/2227-7072/14/11/292)
- giorno 2 08:52 **Matteo** web_search «IVASS numero sinistri annui assicurazione danni dati dati documentali volume»
  - [REGOLAMENTO N. 23 DEL 1° GIUGNO 2016](https://www.ivass.it/normativa/nazionale/secondaria-ivass/regolamenti/2016/n23/Regolamento-IVASS-n.-23-del-1-giugno-2016.pdf)
  - [1 Bollettino Statistico L’attività assicurativa nel comparto salute](https://www.ivass.it/pubblicazioni-e-statistiche/statistiche/bollettino-statistico/2024/n-02-2024/Bollettino_salute_2022.pdf)
  - [I sinistri pagati nel 2023 I dati della Relazione Annuale IVASS - AUA Agenti Unipolsai Associati](https://auaonline.it/2024/07/01/i-sinistri-pagati-nel-2023-i-dati-della-relazione-annuale-ivass/)
- giorno 2 08:55 **Dario** web_search «volume annuo sinistri assicurativi documenti non strutturati statistiche ente di settore»
  - [Pubblicazioni - ANIA - Welcome](https://www.ania.it/pubblicazioni/-/categories/52472)
  - [Statistiche italiane sui sinistri assicurativi:](https://assicurarsicorrettamente.it/statistiche-italiane-sui-sinistri-assicurativi/)
  - [Bollettino Statistico L’attività assicurativa nel comparto auto (2018-2023)](https://www.ivass.it/pubblicazioni-e-statistiche/statistiche/bollettino-statistico/2025/n-01-2025/Bollettino_comparto_auto_(2018_2023).pdf)
- giorno 2 09:22 **Dario** web_search «banche audit decisioni automatiche AI numero di decisioni annue regolatore dati»
  - [Governance dei dati modelli predittivi e AI nelle banche](https://www.aurigaspa.com/news-e-media/blog-ita/governance-dei-dati-modelli-predittivi-e-orchestrazione-omnicanale/)
  - [AI Act e DORA: cosa cambia per le banche dopo agosto 2026](https://www.aurigaspa.com/news-e-media/blog-ita/ai-act-dora-banche-obblighi-2026/)
  - [Il momento della verità per l’AI nel banking: cinque priorità strategiche che definiranno il settore nel 2026](https://www.professionebancario.it/2026/01/25/il-momento-della-verita-per-lai-nel-banking-cinque-priorita-strategiche-che-definiranno-il-settore-nel-2026/)
- giorno 2 12:02 **Irene** web_search «EU banks number of AI credit decision models subject to audit annual volume AI Act high-risk creditworthiness»
  - [Operationalise AI Governance for Financial Services](https://www.modulos.ai/industries/financial-services/)
  - [Beyond Incompatibility: Trade-offs between Mutually Exclusive Fairness Criteria in Machine Learning and Law](https://arxiv.org/pdf/2212.00469)
  - [Bridging AI Risk Frameworks: Reconciling ISO/IEC 42001, the NIST AI Risk Management Framework, and the EU AI Act into a Uni ed Governance Taxonomy](https://arxiv.org/pdf/2608.07515)
- giorno 2 12:26 **Irene** web_search «insurance claims unstructured documents volume per year claims handling AI statistics»
  - [AI in Action: Harnessing unstructured data in insurance claims](https://www.shift-technology.com/resources/case-studies/ai-in-action-property-unstructured-data)
  - [Insurance's GenAI unstructured data challenge](https://www.collibra.com/blog/insurance-s-genai-unstructured-data-challenge)
  - [Insurance claims AI data: why your foundation is broken |...](https://www.ability.ai/blog/insurance-claims-ai-data-governance)
- giorno 2 18:04 **Giulia** cerca_discussioni «AI agents audit trail regulated industries»
  - [Why are we accepting silent data corruption in Vector Search? (x86 vs. ARM)](https://news.ycombinator.com/item?id=46366888)
  - [Show HN: Dapto – AI Prompt and Response Firewall for Enterprises](https://dapto.ai)
- giorno 2 18:15 **Livia** cerca_discussioni «AI audit decisions regulation explainability»
  - [Show HN: I tried coding theology – accidentally built AI accountability](https://github.com/ubunturbo/srta-ai-accountability)
- giorno 2 18:33 **Giulia** web_search «legacy system integration AI agents trend 2025 enterprise»
  - [Day 29: Enterprise Integration & Legacy Systems - by sdr](https://aiamastery.substack.com/p/day-29-enterprise-integration-and)
  - [Connecting Legacy Systems to AI Agents: Integration Architecture Strategies](https://wso2.com/library/blogs/connecting-legacy-systems-ai-agents-integration-architecture-strategies/)
  - [Legacy System Modernization with AI Agents in 2026](https://www.seasiainfotech.com/blog/legacy-system-modernization-with-ai-agents)
- giorno 2 19:12 **Livia** cerca_discussioni «AI audit automated decisions compliance»
  - [Launch HN: Datafruit (YC S25) – AI for DevOps](https://news.ycombinator.com/item?id=45104974)
- giorno 2 20:08 **Giulia** cerca_progetti «AI audit trail automated decisions compliance»
  - [Yogeshsingh123-LAB/-AI-Powered-Integrated-Bid-Compliance-Verification-Platform-for-GeM-Procurement](https://github.com/Yogeshsingh123-LAB/-AI-Powered-Integrated-Bid-Compliance-Verification-Platform-for-GeM-Procurement)
  - [GoldstonianConcordanceBible/402](https://github.com/GoldstonianConcordanceBible/402)
  - [wahabali/agent-audit](https://github.com/wahabali/agent-audit)
- giorno 2 20:19 **Giulia** cerca_discussioni «EU AI Act audit logs automated decisions»
  - [Show HN: I built an open protocol for Agent-to-agent commercial negotiation](https://a2cn.io/)
  - [TamperAudit – Tamper-evident audit logs for AI agents (EU AI Act Article 12)](https://tamperaudit.com)
  - [How to Prepare Your Agentic AI System for an EU AI Act Audit with ZizkaDB](https://medium.com/@MirArshadTalpur/how-to-prepare-your-agentic-ai-system-for-an-eu-ai-act-audit-with-zizkadb-7d7eb9d4c9f0)
- giorno 2 20:19 **Livia** cerca_progetti «AI decision audit trail logging»
  - [ZIZKA-AI-SL/ZizkaDB](https://github.com/ZIZKA-AI-SL/ZizkaDB)
  - [GoldstonianConcordanceBible/402](https://github.com/GoldstonianConcordanceBible/402)
  - [anushamukka9/ai-audit-trail](https://github.com/anushamukka9/ai-audit-trail)
- giorno 3 01:04 **Giulia** web_search «EU AI Act Article 12 record-keeping logging high-risk AI audit trail requirements»
  - [Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/)
  - [EU AI Act Article 12: Record-Keeping](https://www.euaiact.com/article/12)
  - [EU AI Act: AI system logging - VDE](https://www.vde.com/topics-en/artificial-intelligence/blog/eu-ai-act--ai-system-logging)
- giorno 3 01:08 **Dario** web_search «banca audit decisioni automatiche AI regolamentazione volume annuo decisioni credito 2024 fonte»
  - [1. Attività di valutazione del merito creditizio ...](https://www.rivistaoidu.net/wp-content/uploads/2025/12/7_Ciraolo-1.pdf)
  - [La legislazione per il Credit Scoring automatizzato](https://ristrutturazioniaziendali.ilcaso.it/Articolo/580)
  - [Credit scoring AI, obblighi UE al 2027 e tutele in vigore](https://www.pmi.it/finanza/investimenti-pmi/497999/intelligenza-artificiale-valutazione-merito-creditizio.html)
- giorno 3 01:29 **Livia** web_search «EU AI Act article 12 record-keeping logging high-risk AI systems audit trail tools»
  - [Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/)
  - [EU AI Act Article 12: Record-Keeping](https://www.euaiact.com/article/12)
  - [EU AI Act: AI system logging - VDE](https://www.vde.com/topics-en/artificial-intelligence/blog/eu-ai-act--ai-system-logging)
- giorno 3 01:37 **Dario** web_search «assicurazione sinistri documenti non strutturati volume annuo claims documenti 2024 statistica»
  - [Insurance's GenAI unstructured data challenge](https://www.collibra.com/blog/insurance-s-genai-unstructured-data-challenge)
  - [The Cost of Unused Claims Data](https://www.amaise.com/blogs/the-cost-of-unused-claims-data)
  - [Insurance Document Management: A Practical 2026 Guide](https://www.interscanllc.com/blog/insurance-document-management-a-practical-2026-guide)
- giorno 3 01:38 **Livia** cerca_progetti «AI audit trail decision logging»
  - [ZIZKA-AI-SL/ZizkaDB](https://github.com/ZIZKA-AI-SL/ZizkaDB)
  - [GoldstonianConcordanceBible/402](https://github.com/GoldstonianConcordanceBible/402)
  - [anushamukka9/ai-audit-trail](https://github.com/anushamukka9/ai-audit-trail)
- giorno 3 02:10 **Matteo** web_search «banche audit decisioni automatiche AI numero annuo reclami credito 2024 statistiche»
  - [numero 4 Relazione sugli esposti dei clienti delle banche e delle finanziarie](https://www.bancaditalia.it/pubblicazioni/relazione-esposti/2024/relazione-sugli-esposti-sul-2023.pdf)
  - [Banca d'Italia - N. 48 - I tassi di recupero delle sofferenze nel 2024](https://www.bancaditalia.it/pubblicazioni/note-stabilita/2025-0048/index.html)
  - [Rendiconto sull’attività di gestione dei reclami anno 2024](https://www.bibanca.it/swap/trasparenza/Bibanca%20-%20Rendiconto%20reclami%202024.pdf)
- giorno 3 03:02 **Dario** web_search «volume mercato audit decisioni automatiche AI banche 2025 miliardi»
  - [Analisi dei Big Data nel rapporto sulla crescita del mercato bancario nel 2030](https://www.mordorintelligence.it/industry-reports/big-data-in-banking-industry)
  - [AI, Accenture: “Non vinceranno le banche più grandi, ma quelle che cambieranno prima” - FocusRisparmio](https://www.focusrisparmio.com/news/ia-accenture-banche-cambiamento)
  - [Dimensioni del mercato dell'intelligenza artificiale nel Fintech, report e tendenze del settore 2031](https://www.mordorintelligence.it/industry-reports/ai-in-fintech-market)
- giorno 3 03:04 **Irene** web_search «AI Act high-risk obligations 2 August 2026 Annex III creditworthiness Digital Omnibus delay 2 December 2027»
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [The Digital AI Omnibus: Proposed deferral of high risk AI obligations under the AI Act (update) - DLA Piper GENIE](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act)
  - [Digital Omnibus on AI (Regulation 2026/1744): what changes](https://www.globalsuitesolutions.com/digital-omnibus-ai-regulation-2026-1744/)
- giorno 3 03:20 **Irene** web_fetch https://www.joneswalker.com/en/insights/blogs/ai-law-blog/yes-august-2-still-matters-the-eu-approved-a-high-risk-ai-delay-but-most-trans.html
  - [Yes, August 2 Still Matters: The EU Approved a High-Risk AI Delay, but Most Transparency Obligations Remain](https://www.joneswalker.com/en/insights/blogs/ai-law-blog/yes-august-2-still-matters-the-eu-approved-a-high-risk-ai-delay-but-most-trans.html)
- giorno 3 03:24 **Matteo** web_search «AI Act high-risk obligations Annex III date 2 August 2026 digital omnibus delay 2 December 2027»
  - [EU AI Act High-Risk Deadline Pushed to December 2027](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-omnibus-vii-deadline-delay-20260/)
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [EU AI Act Update: Digital Omnibus Finalizes 8 Compliance Changes](https://www.orrick.com/en/Insights/2026/07/EU-AI-Act-Update-Digital-Omnibus-Finalizes-8-Compliance-Changes)
- giorno 3 04:19 **Giulia** web_search «EU AI Act Article 12 record-keeping logging high-risk AI systems»
  - [EU AI Act Article 12 & ISO 42001 Logging for AI Agents](https://www.permit.io/blog/eu-ai-act-article-12-iso-42001-agent-logging)
  - [Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/)
  - [EU AI Act Article 12: Record-Keeping](https://www.euaiact.com/article/12)
- giorno 3 04:21 **Giulia** cerca_discussioni «AI audit trail on-premise compliance»
  - [Show HN: EnforceAuth GA Launch](https://enforceauth.com/contact?inquiry=waitlist)
- giorno 3 05:13 **Matteo** web_search «Regolamento UE 2026/1744 Digital Omnibus AI Annex III 2 dicembre 2027»
  - [EU AI Act High-Risk Deadline Pushed to December 2027](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-omnibus-vii-deadline-delay-20260/)
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [Digital AI Omnibus Delays Key Deadlines, Introduces New Rules - cyber/data/privacy insights](https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/)
- giorno 3 15:43 **Giulia** cerca_discussioni «AI audit trail logging decisions compliance»
  - [Show HN: EnforceAuth GA Launch](https://enforceauth.com/contact?inquiry=waitlist)
  - [Show HN: ContextGraph Cloud – Governance infrastructure for AI agents](https://github.com/akz4ol/contextgraph-cloud)
  - [Show HN: ContextGraph Cloud – Governance infrastructure for AI agents](https://github.com/akz4ol/contextgraph-integrations)
- giorno 3 16:10 **Enea** cerca_discussioni «legacy logistics system AI integration»
  - [AI Orchestration Market Witnesses Surge in Use Across Healthcare and BFSI](https://news.ycombinator.com/item?id=45114189)
- giorno 3 16:13 **Enea** cerca_discussioni «hospital on-premise AI clinical records data sovereignty»
  - [Red Hat Delivers On-Premises Cost Telemetry to Meet Data Sovereignty Demands](https://cloudnativenow.com/features/red-hat-delivers-on-premises-cost-telemetry-to-meet-data-sovereignty-demands/)
  - [APPLY HN: organize and make accessible the world's data on medical devices](https://news.ycombinator.com/item?id=11442703)
  - [IBM CEO says there is 'no way' spending on AI data centers will pay off](https://www.businessinsider.com/ibm-ceo-big-tech-ai-capex-data-center-spending-2025-12)
- giorno 3 18:43 **Giulia** cerca_discussioni «AI audit trail on-premise market»
  - [Show HN: Traceprompt – open-source SDK for tamper-proof LLM audit trails](https://github.com/traceprompt/traceprompt-node)
  - [Show HN: Open-source SDK for AI agent audit trails](https://www.traceprompt.com/)
  - [SAT-CHAIN – Cryptographic compliance for AI systems](https://news.ycombinator.com/item?id=45735588)
- giorno 4 01:34 **Livia** cerca_discussioni «AI audit trail on-premise compliance logging decisions»
  - [Show HN: EnforceAuth GA Launch](https://enforceauth.com/contact?inquiry=waitlist)
- giorno 4 01:59 **Matteo** web_search «AI Act Regulation (EU) 2024/1689 Article 12 record-keeping application date high-risk»
  - [EU AI Act Omnibus Agreement — Postponed High-Risk Deadlines and Other Key Changes - Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [Digital AI Omnibus Delays Key Deadlines, Introduces New Rules - cyber/data/privacy insights](https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/)
- giorno 4 03:05 **Livia** web_search «EU AI Act Article 12 record-keeping application date high-risk 2 December 2027 or August 2026 digital omnibus»
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [EU AI Act Omnibus Agreement — Postponed High-Risk Deadlines and Other Key Changes - Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)
  - [The Digital AI Omnibus: Proposed deferral of high risk AI obligations under the AI Act (update) - DLA Piper GENIE](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act)
- giorno 4 03:26 **Dario** web_search «EUR-Lex AI Act Regulation 2024/1689 Article 12 record-keeping application date high-risk»
  - [The Digital AI Omnibus: Proposed deferral of high risk AI obligations under the AI Act (update) - DLA Piper GENIE](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act)
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [EU AI Act Omnibus Agreement — Postponed High-Risk Deadlines and Other Key Changes - Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)
- giorno 4 03:37 **Dario** web_fetch https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/
  - [Digital AI Omnibus Delays Key Deadlines, Introduces New Rules - cyber/data/privacy insights](https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/)
- giorno 4 04:05 **Matteo** web_search «AI Act Article 12 record-keeping high-risk application date Digital Omnibus postponement»
  - [EU AI Act Omnibus Agreement — Postponed High-Risk Deadlines and Other Key Changes - Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [EU AI Act High-Risk Deadline Pushed to December 2027](https://labs.cloudsecurityalliance.org/research/csa-research-note-eu-ai-act-omnibus-vii-deadline-delay-20260/)
- giorno 4 05:10 **Dario** web_search «Digital AI Omnibus high-risk obligations delay Article 12 AI Act December 2027»
  - [The Digital AI Omnibus: Proposed deferral of high risk AI obligations under the AI Act (update) - DLA Piper GENIE](https://knowledge.dlapiper.com/dlapiperknowledge/globalemploymentlatestdevelopments/2026/The-Digital-AI-Omnibus-Proposed-deferral-of-high-risk-AI-obligations-under-the-AI-Act)
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [Digital AI Omnibus Delays Key Deadlines, Introduces New Rules - cyber/data/privacy insights](https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/)
- giorno 4 05:19 **Dario** web_fetch https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/ (cache)
  - [Digital AI Omnibus Delays Key Deadlines, Introduces New Rules - cyber/data/privacy insights](https://cdp.cooley.com/digital-ai-omnibus-delays-key-deadlines-introduces-new-rules/)
- giorno 4 05:21 **Livia** web_search «EU AI Act Article 12 record-keeping audit trail on-premise AI decision logging market»
  - [EU AI Act Article 12 & ISO 42001 Logging for AI Agents](https://www.permit.io/blog/eu-ai-act-article-12-iso-42001-agent-logging)
  - [EU AI Act Record-Keeping: Article 12 Requirements Explained](https://truescreen.io/insights/ai-act-record-keeping-requirements/)
  - [Is Your AI Logging Article 12-Ready? Avoid EU Compliance Gaps Before It's Too Late](https://www.isms.online/iso-42001/eu-ai-act/article-12/)
- giorno 4 05:23 **Livia** cerca_paper «AI decision audit trail logging regulated industries on-premise»
- giorno 4 06:05 **Giulia** web_search «EUR-Lex AI Act Regulation 2024/1689 Article 12 record-keeping high-risk Annex III application date»
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [Digital Omnibus on AI (Regulation 2026/1744): what changes](https://www.globalsuitesolutions.com/digital-omnibus-ai-regulation-2026-1744/)
  - [New Omnibus Agreement: How the EU AI Act changes](https://www.dastra.eu/en/blog/simpler-safer-stricter-where-it-counts-inside-the-eu-ai-omnibus-deal/60025)
- giorno 4 07:00 **Matteo** web_search «EUR-Lex Regulation (EU) 2024/1689 Article 12 record-keeping high-risk Annex III application date»
  - [EU AI Act Deal: Digital Omnibus Now in Force](https://usercentrics.com/knowledge-hub/eu-ai-act-high-risk-delay-article-50-transparency-consent/)
  - [EU AI Act Omnibus Agreement — Postponed High-Risk Deadlines and Other Key Changes - Gibson Dunn](https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/)
  - [EU legislators agree to delay for high-risk AI rules](https://www.hlc.com/en/publications/eu-legislators-agree-to-delay-for-highrisk-ai-rules)
- giorno 4 07:12 **Irene** web_search «EUR-Lex Regulation (EU) 2024/1689 Artificial Intelligence Act Article 12 record-keeping»
  - [An AI Act Article a Day #12: Record-keeping for High-Risk AI Systems](https://commonlawyer.substack.com/p/an-ai-act-article-a-day-12-record)
  - [Article 12: Record-Keeping](https://aiact.algolia.com/article-12/)
  - [Article 12: Record-Keeping](https://artificialintelligenceact.eu/article/12/)
- giorno 4 07:17 **Dario** web_search «EUR-Lex Regulation (EU) 2024/1689 Article 12 record-keeping high-risk»
  - [An AI Act Article a Day #12: Record-keeping for High-Risk AI Systems](https://commonlawyer.substack.com/p/an-ai-act-article-a-day-12-record)
  - [Article 12: Record-Keeping](https://aiact.algolia.com/article-12/)
  - [EU AI Act Article 12: Record-Keeping](https://www.euaiact.com/article/12)
- giorno 4 10:29 **Enea** cerca_discussioni «on-premise LLM hospital clinical records»
  - [The Economics and Engineering of On-Premises LLMs](https://cacm.acm.org/blogcacm/the-economics-and-engineering-of-on-premises-llms/)
  - [Deep-dive into the deployment of an on-premise low-privileged LLM server](https://www.synacktiv.com/en/publications/deep-dive-into-the-deployment-of-an-on-premise-low-privileged-llm-server)
  - [Show HN: Autonomous AI Agents for Online Stores](https://www.algomo.com/shopify-ai-agents)
- giorno 4 10:30 **Enea** cerca_discussioni «legacy mainframe logistics AI integration»
  - [Why using AI to modernize legacy mainframe hairballs is harder than you think](https://www.sage-tech.ai/blog/zsqdg1dddi33t1iq5gwckh2hdgwu4i)
  - [Launch HN: Hypercubic (YC F25) – AI for COBOL and Mainframes](https://news.ycombinator.com/item?id=45877517)
  - [AI Integration Is Coming to Firefox](https://news.itsfoss.com/firefox-ai-integration/)
- giorno 4 14:08 **Enea** cerca_discussioni «hospital AI on-premise data residency»
  - [Show HN: I graded 83 AI vendors on data residency, training and subprocessors](https://sovereignairegistry.com)
  - [IBM CEO says there is 'no way' spending on AI data centers will pay off](https://www.businessinsider.com/ibm-ceo-big-tech-ai-capex-data-center-spending-2025-12)
  - [Data on AI-related Show HN posts](https://ryanfarley.co/ai-show-hn-data/)
- giorno 4 14:09 **Enea** cerca_discussioni «legacy logistics system integration AI on-premise»
  - [Launch HN: Payflow (YC S21) – Allow workers to access their wages instantly](https://news.ycombinator.com/item?id=27916764)
  - [Introducing AI Integrations on Vercel](https://vercel.com/blog/ai-integrations)
  - [An Illusion of Human Competence Can Hinder Appropriate Reliance on AI Systems](https://arxiv.org/abs/2301.11333)
- giorno 4 16:43 **Irene** cerca_discussioni «AI Act logging audit trail high-risk»
  - [Show HN: Traceprompt – open-source SDK for tamper-proof LLM audit trails](https://github.com/traceprompt/traceprompt-node)
  - [Show HN: Open-source SDK for AI agent audit trails](https://www.traceprompt.com/)
  - [Show HN: Open-Source Article 12 Logging Infrastructure for the EU AI Act](https://news.ycombinator.com/item?id=47230438)
