# Tayseer Digital Adoption: Where Should the Next SAR 40M Go?

**SDAIA Academy · SDA-DSC-112 · Data Visualization & Storytelling Capstone**

> **Big idea:** The national 65% digital-adoption target is met, but four regions are stuck below it. Put the full SAR 40M into Najran, Northern Borders, Al-Baha and Jazan so all four reach 65% by Dec 2027 instead of as late as 2028.

📊 **Presentation:** [`presentation/Tayseer_Capstone_Executive_Story.pdf`](presentation/Tayseer_Capstone_Executive_Story.pdf) (editable: [`.pptx`](presentation/Tayseer_Capstone_Executive_Story.pptx))
📈 **Tableau Public dashboard:** [Tayseer — Digital Adoption](https://public.tableau.com/app/profile/yousef.almutairi6140/viz/TayseerDigitalAdoption_17913014386410/TayseerDigitalAdoption)

---

## What we did

We used Tayseer's monthly service data (Jan 2022 to Dec 2025, 13 regions, 8 service categories, 5 channels) to answer the capstone decision: **where should the next SAR 40 million go to lift lagging regions toward the 65% digital-adoption target?**

| # | Question | Finding |
|---|----------|---------|
| Q1 | Is Tayseer on track nationally? | **Yes.** National adoption is **66.2%** (Dec 2025), up 2.9 pts in a year, and has been above 65% since **Aug 2025**. |
| Q2 | Which regions are below 65%? | **8 of 13**: Najran (60.9%), Northern Borders (62.7%), Al-Baha (62.8%), Jazan (63.0%), Asir (64.4%), Tabuk (64.5%), Hail (64.7%), Al-Jouf (64.8%). |
| Q3 | Where should the SAR 40M go? | At the 2025 pace, Asir, Tabuk, Hail and Al-Jouf reach 65% within about 3 months on their own. **Najran (19 months), Northern Borders (11), Jazan (8) and Al-Baha (7)** do not, so they get the money, weighted by gap: **SAR 15M / 9M / 8M / 8M**. |

**The ask:** approve SAR 40M, release SAR 20M now and SAR 20M at a **June 2027 checkpoint**, where each region must be at least halfway to 65%.

### Seven-slide executive story

| Slide | Story beat | Takeaway title | Presenter | Time |
|---|---|---|---|---|
| 1 | BLUF / Ask | Approve SAR 40M for four regions to close the last gap to 65% | Yousef Almutairi | 0:00–0:30 |
| 2 | Situation | Nationally on track: 66.2%, above 65% since Aug 2025 | Yousef Almutairi | 0:30–1:15 |
| 3 | Complication | 8 of 13 regions are still below 65%; the national average hides them | Abdulwahab Alnassar | 1:15–2:00 |
| 4 | Evidence | Four regions self-close within 3 months; four don't, and Najran needs 19 | Abdulwahab Alnassar | 2:00–4:00 |
| 5 | Options | Three ways to spend SAR 40M; only one aims every riyal at a gap that won't close by itself | Feras Alnasser | 4:00–5:00 |
| 6 | Recommendation | Option B: weight by gap, bring all four to 65% by Dec 2027 | Feras Alnasser | 5:00–6:15 |
| 7 | Ask + Next step | Approve SAR 40M in two tranches with a June 2027 checkpoint | Feras Alnasser | 6:15–7:00 |

The speaker script for each slide is in the PowerPoint **speaker notes**. Q&A preparation is in [`docs/qa_prep.md`](docs/qa_prep.md).

## The dashboard

**Tayseer: Digital Adoption** (Tableau Public) is the main evidence source:

- **KPI**: national digital adoption for the latest month (Dec 2025): **66.2%**
- **National Trend**: monthly adoption Jan 2022 – Dec 2025, with the 65% line and a marker at **Aug 2025**, when the target was crossed (slide 2)
- **Months to 65%**: the 8 below-target regions, months to reach 65% at the 2025 pace, with a 6-month line. Orange = needs funding (slide 4)
- **Regional Adoption**: regions sorted lowest to highest, with a **65% target reference line**. Regions below target are coloured orange (slide 3)
- **Service Gap**: adoption by service category in the 4 priority regions vs national, Dec 2025. Complaints is the weakest (56.8% vs 62.1%) (slide 4)
- **Adoption by Channel**: Dec 2025. Branch 53.3% vs Mobile App 75.3% (slide 6)
- **Region filter**: multiple-values dropdown, default = All

Every number on the slides can be found on the dashboard.

Key calculated fields:

```
Digital Adoption %  = SUM([Digital Adoption Pct] / 100 * [Unique Users]) / SUM([Unique Users]) * 100
Target Status       = IF [Digital Adoption %] < 65 THEN "Below Target" ELSE "On/Above Target" END
Adoption Dec 2025   = { FIXED [Region] : user-weighted adoption where [Month] = #2025-12-01# }   (same for Dec 2024)
Months to Target    = MAX(65 - [Adoption Dec 2025], 0) / (([Adoption Dec 2025] - [Adoption Dec 2024]) / 12)
Funding Need        = IF [Months to Target] > 6 THEN "Needs funding (> 6 months)" ELSEIF [Months to Target] > 0 THEN "Reaches 65% on its own" ELSE "Already at 65%" END
```

Build steps for every view are in [`docs/tableau_dashboard_guide.md`](docs/tableau_dashboard_guide.md).

## Method

- **Adoption is user-weighted**, the same formula as the Tableau field, so slide numbers match the dashboard exactly.
- **Pace** = each region's change from Dec 2024 to Dec 2025 ÷ 12 (the Tableau `Monthly Pace` field).
- **Months to target** = gap ÷ monthly pace. A region that needs more than 6 months is a **priority**.
- **Allocation** is proportional to the *users still to convert* (gap × unique users) in the priority regions, rounded to SAR 1M.
- **Timeline:** the data ends Dec 2025. The plan runs from approval (Q4 2026) to Dec 2027 and assumes each region starts from its latest measured level.
- **Limitation:** the data shows *where* the gap is, not *how many points SAR 1M buys*. That is why the recommendation is staged with a checkpoint.

## Repository structure

```
├── data/tayseer_services.csv                       # source dataset
├── analysis/analysis.py                            # reproduces every number and chart
├── outputs/
│   ├── charts/*.png                                # charts used in the deck
│   └── *.csv                                       # regional summary, allocation, trend, channel & category cuts
├── presentation/
│   ├── Tayseer_Capstone_Executive_Story.pptx       # 7-slide deck with speaker notes
│   ├── Tayseer_Capstone_Executive_Story.pdf
│   └── build/build_deck.js                         # generates the deck (native charts) from outputs/
└── docs/
    ├── tableau_dashboard_guide.md
    └── qa_prep.md
```

Reproduce:

```bash
python3 -m venv .venv && .venv/bin/pip install pandas matplotlib python-pptx
.venv/bin/python analysis/analysis.py
(cd presentation/build && npm install pptxgenjs && node build_deck.js)
```

## Tools

- **Tableau Public**: interactive dashboard (main evidence)
- **Python** (pandas, matplotlib): validation of the Tableau numbers, trend/pace analysis, charts
- **PptxGenJS / PowerPoint**: the executive deck (native, editable charts)
- **Git & GitHub**: version control and submission

## Team

| Member | Role | GitHub |
|---|---|---|
| Yousef Almutairi  | BLUF + Situation (slides 1–2) | [@yalmutairi72-cpu](https://github.com/yalmutairi72-cpu) |
| Abdulwahab Alnassar  | Complication + Evidence (slides 3–4) | [@Abdulwahab-Alnassar](https://github.com/Abdulwahab-Alnassar) |
| Feras Alnasser  | Options, Recommendation, Ask (slides 5–7) | [@FerasNasser1](https://github.com/FerasNasser1) |

## Acknowledgements

Built for the [SDAIA Academy]([https://github.com/SDAIA-Academy](https://github.com/SDAIAAcademy)) Data Visualization & Storytelling program (SDA-DSC-112).
