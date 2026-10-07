# Tableau Dashboard Guide: Tayseer Digital Adoption

Follows Lab 4 (required core), then adds two views that carry the capstone evidence. Every number should match `outputs/regional_summary.csv`.

## Required core (Lab 4)

1. **Connect** `data/tayseer_services.csv`. Set the types: `Month` → Date, `Region` → String, `Digital Adoption Pct` → Number (decimal).
2. **Calculated field** `Digital Adoption %`:
   `SUM([Digital Adoption Pct] / 100 * [Unique Users]) / SUM([Unique Users]) * 100`
3. **KPI sheet**: put `Digital Adoption %` on Text and filter Month = 01/12/2025. Text: `NATIONAL DIGITAL ADOPTION` / `<Digital Adoption %>%`, number format `0.0`. **Expected: 66.2%**
4. **Regional Adoption sheet**: Region → Rows, `Digital Adoption %` → Columns, Bar, show labels, sort ascending, Month filter = 01/12/2025. Add a reference line (Table) at 65 labelled `65% Target`.
5. **Region filter**: Multiple Values (dropdown), default All.
6. **Target Status** field: `IF [Digital Adoption %] < 65 THEN "Below Target" ELSE "On/Above Target" END` → Colour (Below = orange `#E4572E`, On/Above = grey `#A0A7B4`).
7. **Dashboard** `Tayseer — Digital Adoption`: KPI on top, Regional Adoption below, Region filter shown.

**Expected Regional Adoption (Dec 2025):** Najran 60.9 · Northern Borders 62.7 · Al-Baha 62.8 · Jazan 63.0 · Asir 64.4 · Tabuk 64.5 · Hail 64.7 · Al-Jouf 64.8 · Qassim 66.1 · Madinah 68.2 · Eastern Province 68.7 · Makkah 70.7 · Riyadh 70.8

## Added views (published, supporting slides 2, 4 and 6)

### National Trend (slide 2)
- `MONTH(Month)` (continuous) → Columns, `Digital Adoption %` → Rows, Line.
- Reference line at 65. Annotate the point at **Aug 2025** ("Target crossed") and **Dec 2025** (66.2%).

### Months to Target (slide 4)
Tableau can't easily fit a per-region trend in one field, so use the year-over-year change as the pace. It gives the same priority ranking:

```
Adoption Dec 2025   = { FIXED [Region] : SUM(IF [Month] = #2025-12-01# THEN [Digital Adoption Pct]/100*[Unique Users] END)
                                         / SUM(IF [Month] = #2025-12-01# THEN [Unique Users] END) * 100 }
Adoption Dec 2024   = (same, with #2024-12-01#)
Monthly Pace        = ([Adoption Dec 2025] - [Adoption Dec 2024]) / 12
Gap to Target       = MAX(65 - [Adoption Dec 2025], 0)
Months to Target    = [Gap to Target] / [Monthly Pace]
Funding Need        = IF [Months to Target] > 6 THEN "Needs funding (> 6 months)" ELSEIF [Months to Target] > 0 THEN "Reaches 65% on its own" ELSE "Already at 65%" END
```

- Region → Rows, `Months to Target` → Columns, `Funding Need` → Colour (exclude "Already at 65%"), constant line at 6.
- `analysis/analysis.py` uses the same year-over-year pace, so the months match slide 4 exactly: Najran 19, Northern Borders 11, Jazan 8, Al-Baha 7.

### Service Gap (slide 4)
```
Adoption % (4 priority regions) = user-weighted adoption, Dec 2025, Region in (Najran, Northern Borders, Al-Baha, Jazan)
National (Dec 2025)             = user-weighted adoption, Dec 2025, all regions
```
- Service Category → Rows, both fields → Columns, show labels. **Expected: Complaints 56.8 vs 62.1.**

### Adoption by Channel (slide 6)
- Channel → Rows, `National (Dec 2025)` → Columns, show labels. **Expected: Branch 53.3, Mobile App 75.3.**

## Step 7: dashboard test
Ask a partner who hasn't seen the dashboard: *"Which regions are below the 65% target?"* Record the time taken, whether the answer was correct, and anything that confused them. Put the result here:

| Tester | Time (s) | Correct? | Confusion noted |
|---|---|---|---|
| | | | |
