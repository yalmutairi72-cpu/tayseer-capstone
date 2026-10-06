# Tayseer Digital Adoption: Where Should the Next SAR 40M Go?

**SDAIA Academy · SDA-DSC-112 · Data Visualization & Storytelling Capstone**

> **Big idea:** The national 65% digital-adoption target is met, but four regions are stuck below it. Put the full SAR 40M into Najran, Northern Borders, Al-Baha and Jazan so all four reach 65% by Dec 2026 instead of as late as 2027.

📊 **Presentation:** [`presentation/Tayseer_Capstone_Executive_Story.pdf`](presentation/Tayseer_Capstone_Executive_Story.pdf) (editable: [`.pptx`](presentation/Tayseer_Capstone_Executive_Story.pptx))
📈 **Tableau Public dashboard:** [Tayseer — Digital Adoption](https://public.tableau.com/app/profile/yousef.almutairi6140/viz/TayseerDigitalAdoption_17913014386410/TayseerDigitalAdoption)

---

## What we did

We used Tayseer's monthly service data (Jan 2022 to Dec 2025, 13 regions, 8 service categories, 5 channels) to answer the capstone decision: **where should the next SAR 40 million go to lift lagging regions toward the 65% digital-adoption target?**

| # | Question | Finding |
|---|----------|---------|
| Q1 | Is Tayseer on track nationally? | **Yes.** National adoption is **66.2%** (Dec 2025), up 2.9 pts in a year, and has been above 65% since **Aug 2025**. |
| Q2 | Which regions are below 65%? | **8 of 13**: Najran (60.9%), Northern Borders (62.7%), Al-Baha (62.8%), Jazan (63.0%), Asir (64.4%), Tabuk (64.5%), Hail (64.7%), Al-Jouf (64.8%). |
| Q3 | Where should the SAR 40M go? | At the 2025 pace, Asir, Tabuk, Hail and Al-Jouf reach 65% within about 3 months on their own. **Najran (21 months), Northern Borders (10), Al-Baha (9) and Jazan (7)** do not, so they get the money, weighted by gap: **SAR 15M / 9M / 8M / 8M**. |

**The ask:** approve SAR 40M, release SAR 20M now and SAR 20M at a **June 2026 checkpoint**, where each region must be at least halfway to 65%.

### Seven-slide executive story

| Slide | Story beat | Takeaway title | Presenter | Time |
|---|---|---|---|---|
| 1 | BLUF / Ask | Approve SAR 40M for four regions to close the last gap to 65% | Yousef Almutairi | 0:00–0:30 |
| 2 | Situation | Nationally on track: 66.2%, above 65% since Aug 2025 | Yousef Almutairi | 0:30–1:15 |
| 3 | Complication | 8 of 13 regions are still below 65%; the national average hides them | Abdulwahab Alnassar | 1:15–2:00 |
| 4 | Evidence | Four regions self-close within 3 months; four don't, and Najran needs 21 | Abdulwahab Alnassar | 2:00–4:00 |
| 5 | Options | Three ways to spend SAR 40M; only one aims every riyal at a gap that won't close by itself | Firas Alnasser | 4:00–5:00 |
| 6 | Recommendation | Option B: weight by gap, bring all four to 65% by Dec 2026 | Firas Alnasser | 5:00–6:15 |
| 7 | Ask + Next step | Approve SAR 40M in two tranches with a June 2026 checkpoint | Firas Alnasser | 6:15–7:00 |

The speaker script for each slide is in the PowerPoint **speaker notes**. Q&A preparation is in [`docs/qa_prep.md`](docs/qa_prep.md).

## The dashboard

**Tayseer: Digital Adoption** (Tableau Public) is the main evidence source:

- **KPI**: national digital adoption for the latest month (Dec 2025): **66.2%**
- **Regional Adoption**: regions sorted lowest to highest, with a **65% target reference line**. Regions below target are coloured orange.
- **Region filter**: multiple-values dropdown, default = All
- **Added views**: national trend line, and months-to-target for below-target regions

Key calculated fields:

```
Digital Adoption %  = SUM([Digital Adoption Pct] / 100 * [Unique Users]) / SUM([Unique Users]) * 100
Target Status       = IF [Digital Adoption %] < 65 THEN "Below Target" ELSE "On/Above Target" END
```

Build steps and the extra views are in [`docs/tableau_dashboard_guide.md`](docs/tableau_dashboard_guide.md).

## Method

- **Adoption is user-weighted**, the same formula as the Tableau field, so slide numbers match the dashboard exactly.
- **Pace** is the slope of a linear trend over each region's last 12 months (2025).
- **Months to target** = gap ÷ monthly pace. A region that needs more than 6 months is a **priority**.
- **Allocation** is proportional to the *users still to convert* (gap × unique users) in the priority regions, rounded to SAR 1M.
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

Built for the [SDAIA Academy](https://github.com/SDAIA-Academy) Data Visualization & Storytelling program (SDA-DSC-112).
