# Handoff brief: grant form question bank

## What this is
A normalised corpus of **1971 questions** drawn from **27 grant funds** (282 English form files). Each question carries its grant, section, page, answer format, answer options, and whether it is optional. Presentational text and "check your answers" pages have been stripped.

## Files
- `question_bank.md` — readable, grouped by grant > section > page.
- `question_bank.jsonl` — one question per line; best for programmatic clustering. Fields: `question`, `hint`, `answer_format`, `raw_type`, `options`, `required`, `within_table`, `grant_family`, `grant_name`, `section`, `page`, `source_file`.

## Size / cost
The question + hint text is roughly **37,724 tokens** — small enough to fit the whole corpus in a single context window.

## Suggested analysis for the downstream task
1. **Cluster** the questions into recurring themes (e.g. organisation details, eligibility, finances, project plan, outcomes, risk, declarations).
2. **Find duplicates / near-duplicates** asked across different funds — candidates for a single shared question.
3. **Note phrasing drift**: same intent, different wording — propose one canonical phrasing.
4. **Map answer formats**: where the same question uses different formats (e.g. free text vs multiple choice) across funds, flag the inconsistency.
5. Output a **de-duplicated, themed question bank** as the starting point for unified templates.

## Questions per grant fund
- Payment Profile and Indicative Spend Forecast (`pfn_rp`): 214
- National Wraparound Programme (`nwp_r1`): 196
- Apply for funding to save an asset in your community (`cof`): 167
- Apply for funding to save an asset in your community (`cof25`): 167
- Apply for funding to transform your night shelter services in England (`night_shelter`): 145
- Apply for funding to save an asset in your community (`cof_r2`): 137
- Apply for funding to save an asset in your community (`cof_r3`): 133
- Apply for funding to save an asset in your community (`cof_r3w2`): 129
- Apply for funding to support children and young people on pathways to the UK from Ukraine, Hong Kong and Afghanistan (`cyp_r1`): 81
- Energy & Hardship Community Fund (`ehcf_r1`): 68
- Apply for grant funding to be a Principal Sponsor for the Communities for Afghans scheme (`cfa_r1`): 58
- Crash Test Dummy Fund Round 2 - Project Details (`ctdf_r2`): 53
- Supported Housing Improvement Fund (`shif_apply`): 51
- Apply for funding to begin your digital planning improvement journey (`dpif_r4`): 43
- Apply for funding to monitor and report anti-Muslim hate to better support victims (`cham_apply`): 42
- Apply for Apply for funding to begin your digital planning improvement journey (`dpif_r3`): 41
- Local Authority Housing Fund (`lahf_lahftu`): 39
- Apply for funding to begin your digital planning improvement journey (`dpif_r2`): 36
- Apply for Funding to cover the cost of delivering a High Street Rental Auction (`hsra_rp`): 29
- Apply for local plan funding (`lpdf_r1`): 28
- Apply for funding to monitor and report anti-Muslim hate to better support victims (`cham_reg`): 25
- Apply for local plan funding (Regulation 18) (`lpdf_r2`): 25
- Apply for Funding to cover the cost of delivering a High Street Rental Auction (`hsra_vr`): 21
- Apply for green belt funding (`gbrf_r1`): 20
- Apply for Sample Fund (`sf_r1`): 14
- Apply for Sample Fund (`uf1_r1`): 8
- Apply for funding to begin your digital planning improvement journey (`generic`): 1

## Questions by answer format
- Long free text: 435
- Short text: 396
- Yes / No: 336
- Number: 234
- Multiple choice (select all that apply): 120
- Single choice: 88
- Repeating table: 83
- File upload: 62
- Date: 56
- Email address: 41
- UK address: 40
- Phone number: 35
- Website / URL: 29
- Single choice (dropdown): 12
- Month / year: 4