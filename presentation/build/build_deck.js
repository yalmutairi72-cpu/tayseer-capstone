// Builds the seven-slide executive deck with native PowerPoint charts.
// Data comes from ../../outputs (run analysis/analysis.py first).
const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const ROOT = path.resolve(__dirname, "../..");
const OUT = path.join(ROOT, "outputs");
const DECK = path.join(ROOT, "presentation", "Tayseer_Capstone_Executive_Story.pptx");

function csv(file) {
  const [head, ...rows] = fs.readFileSync(path.join(OUT, file), "utf8").trim().split("\n");
  const cols = head.split(",");
  return rows.map(r => {
    const v = r.split(",");
    return Object.fromEntries(cols.map((c, i) => [c || "key", isNaN(+v[i]) || v[i] === "" ? v[i] : +v[i]]));
  });
}
const nat = csv("national_trend.csv");
const reg = csv("regional_summary.csv");            // sorted ascending by adoption
const alloc = csv("allocation.csv");
const cat = csv("category_priority_regions.csv");
const chan = csv("channel_summary.csv");
const by = (rows, k) => Object.fromEntries(rows.map(r => [r[k], r]));
const R = by(reg, "region"), A = by(alloc, "region"), CAT = by(cat, "service_category"), CH = by(chan, "channel");

const natNow = nat[nat.length - 1].national_adoption_pct;
const natPrev = nat[nat.length - 13].national_adoption_pct;
const below = reg.filter(r => r.gap_pts > 0);
const prio = [...alloc].sort((a, b) => b.allocation_sar_m - a.allocation_sar_m);
const f1 = x => x.toFixed(1);

// ---------- Palette & type ----------
const NAVY = "0B2545", NAVY2 = "13315C", INK = "1B2A41", MUTED = "6B7686", LINE = "D9DEE5",
      TINT = "F3F5F8", ORANGE = "E8692B", ORANGE_T = "FDEEE6", GREY = "B7BEC8", GREEN = "1F9D6B", WHITE = "FFFFFF",
      ICE = "C9D6E8";
const FONT = "Calibri";
const STEPS = ["Ask", "Situation", "Complication", "Evidence", "Options", "Recommendation", "Next step"];

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";                         // 13.33 x 7.5 in
pres.title = "Tayseer Digital Adoption: Where the next SAR 40M should go";
pres.author = "Yousef Almutairi, Abdulwahab Alnassar, Firas Alnasser";
pres.theme = { headFontFace: FONT, bodyFontFace: FONT };

const FOOT = "Tayseer Digital Adoption  ·  SDAIA Academy SDA-DSC-112  ·  Source: Tayseer services data, Jan 2022 – Dec 2025";
pres.defineSlideMaster({
  title: "LIGHT", background: { color: WHITE },
  objects: [{ text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 10, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, margin: 0 } } }],
  slideNumber: { x: 12.23, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 9, color: MUTED, align: "right" },
});
pres.defineSlideMaster({
  title: "DARK", background: { color: NAVY },
  objects: [{ text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 10, h: 0.3, fontFace: FONT, fontSize: 9, color: "8FA3BF", margin: 0 } } }],
  slideNumber: { x: 12.23, y: 7.0, w: 0.5, h: 0.3, fontFace: FONT, fontSize: 9, color: "8FA3BF", align: "right" },
});

// Story tracker: the deck's motif (one pill per story beat, current one filled)
function tracker(s, idx, dark) {
  const w = 1.02, gap = 0.06, x0 = 13.33 - 0.6 - (STEPS.length * w + (STEPS.length - 1) * gap);
  STEPS.forEach((t, i) => {
    const on = i === idx;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: x0 + i * (w + gap), y: 0.38, w, h: 0.26, rectRadius: 0.13,
      fill: { color: on ? ORANGE : (dark ? NAVY2 : TINT) }, line: { color: on ? ORANGE : (dark ? NAVY2 : TINT) },
      objectName: `Tracker ${t}`,
    });
    s.addText(t, {
      x: x0 + i * (w + gap), y: 0.38, w, h: 0.26, align: "center", valign: "middle", margin: 0, isTextBox: true,
      fontFace: FONT, fontSize: 8.5, bold: on, color: on ? WHITE : (dark ? "8FA3BF" : MUTED),
    });
  });
}

function header(s, idx, kicker, title, dark = false) {
  tracker(s, idx, dark);
  s.addText(kicker.toUpperCase(), {
    x: 0.6, y: 0.36, w: 4.5, h: 0.3, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 11, bold: true,
    color: ORANGE, charSpacing: 2,
  });
  s.addText(title, {
    x: 0.6, y: 0.82, w: 12.1, h: 1.05, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, fontSize: 28,
    bold: true, color: dark ? WHITE : INK,
  });
}

function stat(s, x, y, w, h, value, label, color = INK, bg = TINT) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08, fill: { color: bg }, line: { color: bg } });
  s.addText(value, { x: x + 0.25, y: y + 0.18, w: w - 0.5, h: 0.75, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 34, bold: true, color });
  s.addText(label, { x: x + 0.25, y: y + 0.92, w: w - 0.5, h: h - 1.05, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, fontSize: 13, color: MUTED });
}

const AXIS = { catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, catAxisLabelFontFace: FONT, valAxisLabelFontFace: FONT,
  catAxisLabelFontSize: 11, valAxisLabelFontSize: 11, catAxisLineShow: false, valAxisLineShow: false,
  valGridLine: { color: "E6E9EE", size: 0.75 }, catGridLine: { style: "none" } };

// Vertical reference line on a horizontal bar chart drawn with a fixed inner plot layout
function refLine(s, chart, value, min, max, label, color) {
  const x = chart.x + chart.w * (chart.layout.x + chart.layout.w * (value - min) / (max - min));
  const y0 = chart.y + chart.h * chart.layout.y, y1 = y0 + chart.h * chart.layout.h;
  s.addShape(pres.shapes.LINE, { x, y: y0 - 0.12, w: 0, h: y1 - y0 + 0.12, line: { color, width: 1.75, dashType: "dash" }, objectName: label });
  s.addText(label, { x: x - 1.0, y: y0 - 0.42, w: 2.0, h: 0.28, align: "center", margin: 0, isTextBox: true, fontFace: FONT, fontSize: 11, bold: true, color });
}

function legend(s, x, y, items) {
  let cx = x;
  items.forEach(([label, color]) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: cx, y: y + 0.07, w: 0.2, h: 0.2, rectRadius: 0.03, fill: { color }, line: { color } });
    s.addText(label, { x: cx + 0.28, y, w: 2.6, h: 0.34, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 11, color: MUTED });
    cx += 0.28 + label.length * 0.075 + 0.35;
  });
}

// ============ 1. BLUF / ASK ============
{
  const s = pres.addSlide({ masterName: "DARK" });
  tracker(s, 0, true);
  s.addText("THE ASK  ·  DECISION REQUESTED", { x: 0.6, y: 0.36, w: 5, h: 0.3, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 2 });
  s.addText("Approve SAR 40M for four regions to close the last gap to 65% digital adoption", {
    x: 0.6, y: 0.95, w: 11.2, h: 1.55, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, fontSize: 38, bold: true, color: WHITE });
  s.addText([
    { text: "Big idea  ", options: { bold: true, color: ORANGE } },
    { text: "Tayseer has met the 65% target nationally, but four regions are stuck below it. Putting the full SAR 40M there brings all four to 65% by Dec 2027 instead of as late as 2028.", options: { color: ICE } },
  ], { x: 0.6, y: 2.6, w: 11.4, h: 0.8, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 16, valign: "top" });

  const cw = 2.86, gap = 0.22;
  prio.forEach((p, i) => {
    const x = 0.6 + i * (cw + gap), y = 3.65;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: cw, h: 2.55, rectRadius: 0.1, fill: { color: NAVY2 }, line: { color: NAVY2 }, objectName: `Card ${p.region}` });
    s.addText(p.region, { x: x + 0.25, y: y + 0.22, w: cw - 0.5, h: 0.35, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 15, bold: true, color: WHITE });
    s.addText(`SAR ${p.allocation_sar_m}M`, { x: x + 0.25, y: y + 0.62, w: cw - 0.5, h: 0.8, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 40, bold: true, color: ORANGE });
    s.addText([
      { text: `${f1(p.adoption_pct)}% today · gap ${f1(p.gap_pts)} pts`, options: { breakLine: true } },
      { text: `${Math.round(p.months_to_target)} months to reach 65% on current pace` },
    ], { x: x + 0.25, y: y + 1.55, w: cw - 0.5, h: 0.8, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 12.5, color: "AFC0D6", paraSpaceAfter: 4, valign: "top" });
  });
  s.addText([
    { text: "Release  ", options: { bold: true, color: ORANGE } },
    { text: "SAR 20M now  ·  SAR 20M after a June 2027 checkpoint", options: { color: WHITE } },
  ], { x: 0.6, y: 6.38, w: 8, h: 0.4, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 15 });
  s.addText("Yousef Almutairi  ·  Abdulwahab Alnassar  ·  Firas Alnasser", { x: 7.7, y: 6.38, w: 5.03, h: 0.4, margin: 0, align: "right", isTextBox: true, fontFace: FONT, fontSize: 12, color: "8FA3BF" });
  s.addNotes("PRESENTER: Yousef (0:00–0:30)\nState the ask in the first 30 seconds: approve SAR 40M for Najran, Northern Borders, Al-Baha and Jazan. National is above 65%, these four are stuck; Najran would need almost two years. Money released in two tranches with a June 2027 checkpoint.");
}

// ============ 2. SITUATION ============
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  header(s, 1, "Situation  ·  national status", `Nationally, Tayseer is on track: ${f1(natNow)}% digital adoption, above the 65% target since August 2025`);
  const labels = nat.map(r => { const d = new Date(r.month); return d.getUTCMonth() === 0 ? String(d.getUTCFullYear()) : ""; });
  const natChart = { x: 0.45, y: 2.1, w: 8.75, h: 4.7, layout: { x: 0.08, y: 0.06, w: 0.9, h: 0.82 } };
  const lbls = nat.map(r => { const d = new Date(r.month); return d.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }); });
  s.addChart(pres.charts.LINE, [
    { name: "National adoption", labels: lbls, values: nat.map(r => r.national_adoption_pct) },
  ], {
    ...natChart, ...AXIS, chartColors: [NAVY], lineSize: 3, lineDataSymbol: "none",
    valAxisMinVal: 52, valAxisMaxVal: 68, valAxisMajorUnit: 4, valAxisLabelFormatCode: "0\"%\"",
    catAxisLabelFrequency: 12, catAxisLabelRotate: 0,
    showLegend: false, showValue: false, objectName: "National trend chart",
  });
  { // dashed 65% target across the plot, plus end-point callout
    const L = natChart.layout, px = natChart.x + natChart.w * L.x, pw = natChart.w * L.w;
    const yv = v => natChart.y + natChart.h * (L.y + L.h * (68 - v) / (68 - 52));
    s.addShape(pres.shapes.LINE, { x: px, y: yv(65), w: pw, h: 0, line: { color: ORANGE, width: 2, dashType: "dash" }, objectName: "65% target line" });
    s.addText("65% target", { x: px + 0.1, y: yv(65) - 0.34, w: 1.6, h: 0.28, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 12, bold: true, color: ORANGE });
    s.addText(`Dec 2025: ${f1(natNow)}%`, { x: px + pw - 2.05, y: yv(natNow) - 0.42, w: 2.0, h: 0.3, margin: 0, align: "right", isTextBox: true, fontFace: FONT, fontSize: 12, bold: true, color: NAVY });
  }
  stat(s, 9.55, 2.1, 3.18, 1.45, `${f1(natNow)}%`, "National adoption, Dec 2025", NAVY);
  stat(s, 9.55, 3.75, 3.18, 1.45, `+${f1(natNow - natPrev)} pts`, "Change vs Dec 2024", GREEN);
  stat(s, 9.55, 5.4, 3.18, 1.45, "Aug 2025", "Month the 65% target was crossed", NAVY);
  s.addNotes("PRESENTER: Yousef (0:30–1:15)\nOrient first: the line is national digital adoption by month, 2022–2025; dashed orange is the 65% target.\nMessage: steady rise from ~54% to 66.2%, crossed 65% in August 2025. Transition: the average hides something; hand over to Abdulwahab.");
}

// ============ 3. COMPLICATION ============
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  header(s, 2, "Complication  ·  regional gap", `But ${below.length} of 13 regions are still below 65%, and the national average hides them`);
  const names = reg.map(r => r.region);
  const chart = { x: 0.45, y: 2.2, w: 8.9, h: 4.35, layout: { x: 0.2, y: 0.03, w: 0.72, h: 0.88 } };
  refLine(s, chart, 65, 55, 72, "65% target", INK);
  s.addChart(pres.charts.BAR, [{ name: "Digital adoption", labels: names, values: reg.map(r => r.adoption_pct) }], {
    ...chart, barDir: "bar", barGapWidthPct: 45, chartColors: reg.map(r => r.gap_pts > 0 ? ORANGE : GREY), ...AXIS,
    valAxisMinVal: 55, valAxisMaxVal: 72, valAxisMajorUnit: 5, valAxisLabelFormatCode: "0\"%\"",
    showValue: true, dataLabelPosition: "inEnd", dataLabelFormatCode: "0.0\"%\"", dataLabelColor: WHITE, dataLabelFontFace: FONT, dataLabelFontSize: 11, dataLabelFontBold: true,
    showLegend: false, objectName: "Regional adoption chart",
  });
  legend(s, 0.6, 6.62, [["Below target", ORANGE], ["On / above target", GREY]]);
  const x = 9.75, w = 2.98;
  stat(s, x, 2.25, w, 1.45, `${below.length} regions`, "below the 65% target in Dec 2025", ORANGE, ORANGE_T);
  stat(s, x, 3.85, w, 1.45, `${f1(R.Najran.adoption_pct)}%`, `Najran, the lowest region, ${f1(R.Najran.gap_pts)} pts short`, ORANGE, ORANGE_T);
  stat(s, x, 5.45, w, 1.4, "5 regions", "large regions carry the national average", NAVY);
  s.addNotes("PRESENTER: Abdulwahab (1:15–2:00)\nOrient: each bar is a region's adoption in Dec 2025, lowest at the bottom; orange = below target, grey = on/above; dashed line = 65%.\nMessage: 8 of 13 regions below target; five large regions pull the average up; Najran lowest at 60.9%.");
}

// ============ 4. EVIDENCE ============
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  header(s, 3, "Evidence  ·  which gaps matter", "Four regions will reach 65% on their own within 3 months; four will not, and Najran needs 21");
  const b = [...below].sort((p, q) => q.months_to_target - p.months_to_target);  // bars draw bottom-up
  const names = b.map(r => r.region);
  const isP = r => r.status.startsWith("Priority");
  const chart = { x: 0.45, y: 2.2, w: 8.9, h: 4.35, layout: { x: 0.2, y: 0.03, w: 0.72, h: 0.88 } };
  refLine(s, chart, 6, 0, 24, "6-month line", INK);
  s.addChart(pres.charts.BAR, [{ name: "Months to 65%", labels: names, values: b.map(r => Math.max(1, Math.round(r.months_to_target))) }], {
    ...chart, barDir: "bar", barGapWidthPct: 45, chartColors: b.map(r => isP(r) ? ORANGE : GREY), ...AXIS,
    valAxisMinVal: 0, valAxisMaxVal: 24, valAxisMajorUnit: 6, valAxisLabelFormatCode: "0\" mo\"",
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0\" mo\"", dataLabelColor: INK, dataLabelFontFace: FONT, dataLabelFontSize: 11, dataLabelFontBold: true,
    showLegend: false, objectName: "Months to target chart",
  });
  legend(s, 0.6, 6.62, [["Needs funding: more than 6 months", ORANGE], ["Reaches 65% on its own", GREY]]);
  // Right panel: where the gap sits
  const x = 9.75, w = 2.98, c = CAT.Complaints;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y: 2.25, w, h: 4.6, rectRadius: 0.08, fill: { color: TINT }, line: { color: TINT } });
  s.addText("Where the gap sits", { x: x + 0.25, y: 2.45, w: w - 0.5, h: 0.35, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 15, bold: true, color: INK });
  s.addText(`${f1(c.priority_regions)}%`, { x: x + 0.25, y: 2.9, w: w - 0.5, h: 0.75, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 40, bold: true, color: ORANGE });
  s.addText(`Complaints digital adoption in the four priority regions, vs ${f1(c.national)}% nationally`, { x: x + 0.25, y: 3.65, w: w - 0.5, h: 0.8, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, fontSize: 13, color: MUTED });
  s.addShape(pres.shapes.LINE, { x: x + 0.25, y: 4.6, w: w - 0.5, h: 0, line: { color: LINE, width: 1 } });
  s.addText([
    { text: `+${A.Najran.monthly_pace_pts.toFixed(2)} pts / month`, options: { bold: true, color: INK, fontSize: 20, breakLine: true } },
    { text: "Najran's pace: the slowest of any region, with the biggest gap", options: { color: MUTED, fontSize: 13 } },
  ], { x: x + 0.25, y: 4.8, w: w - 0.5, h: 1.6, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, paraSpaceAfter: 4 });
  s.addNotes("PRESENTER: Abdulwahab (2:00–4:00)\nOrient: only the 8 below-target regions; bar = months to reach 65% at the 2025 pace.\nGrey four (Al-Jouf, Hail, Tabuk, Asir) cross within ~3 months on their own. Orange four need 7–21 months; Najran has the biggest gap and slowest pace.\nRight panel: Complaints is the weakest journey (56.8% vs 62.1% nationally).\nMethod: pace = linear trend of 2025; adoption is user-weighted, same as the Tableau field.");
}

// ============ 5. OPTIONS ============
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  header(s, 4, "Options  ·  how to use SAR 40M", "We compared three ways to spend SAR 40M; only one aims every riyal at a gap that won't close by itself");
  const opts = [
    { k: "A", name: "Spread evenly", what: "SAR 5M to each of the 8 regions below 65%",
      rows: [["✗", "Half the budget (SAR 20M) goes to regions closing in ≤ 3 months"], ["✗", "Najran gets only SAR 5M"], ["✗", "Too thin to change pace anywhere"]] },
    { k: "B", name: "Focus on the 4 laggards", what: "SAR 40M split across Najran, Northern Borders, Al-Baha, Jazan by gap size", rec: true,
      rows: [["✓", "100% of the budget reaches regions needing 7–21 months"], ["✓", `Najran gets SAR ${A.Najran.allocation_sar_m}M, sized to its gap`], ["!", "Depends on local delivery, so staged with a checkpoint"]] },
    { k: "C", name: "National campaign", what: "One national push to move branch & call-centre users to app / web",
      rows: [["✗", "National is already 66%; reach lands in on-target regions"], ["✗", "Lifts the average again, leaves the gaps"], ["✓", "Simple to run"]] },
  ];
  const w = 3.88, gap = 0.23, y = 2.2, h = 4.6;
  opts.forEach((o, i) => {
    const x = 0.6 + i * (w + gap);
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1,
      fill: { color: o.rec ? ORANGE_T : TINT }, line: { color: o.rec ? ORANGE : TINT, width: o.rec ? 2 : 0.5 },
      shadow: o.rec ? { type: "outer", color: "000000", opacity: 0.12, blur: 8, offset: 2, angle: 90 } : undefined, objectName: `Option ${o.k}` });
    s.addShape(pres.shapes.OVAL, { x: x + 0.3, y: y + 0.3, w: 0.6, h: 0.6, fill: { color: o.rec ? ORANGE : NAVY }, line: { color: o.rec ? ORANGE : NAVY } });
    s.addText(o.k, { x: x + 0.3, y: y + 0.3, w: 0.6, h: 0.6, align: "center", valign: "middle", margin: 0, isTextBox: true, fontFace: FONT, fontSize: 20, bold: true, color: WHITE });
    if (o.rec) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + w - 1.75, y: y + 0.42, w: 1.45, h: 0.34, rectRadius: 0.17, fill: { color: ORANGE }, line: { color: ORANGE } });
      s.addText("RECOMMENDED", { x: x + w - 1.75, y: y + 0.42, w: 1.45, h: 0.34, align: "center", valign: "middle", margin: 0, isTextBox: true, fontFace: FONT, fontSize: 10, bold: true, color: WHITE, charSpacing: 1 });
    }
    s.addText(o.name, { x: x + 0.3, y: y + 1.08, w: w - 0.6, h: 0.42, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 19, bold: true, color: INK });
    s.addText(o.what, { x: x + 0.3, y: y + 1.52, w: w - 0.6, h: 0.75, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, fontSize: 13, color: MUTED });
    s.addShape(pres.shapes.LINE, { x: x + 0.3, y: y + 2.35, w: w - 0.6, h: 0, line: { color: o.rec ? "F5C3A8" : LINE, width: 1 } });
    o.rows.forEach(([m, t], j) => {
      const ry = y + 2.55 + j * 0.65;
      const col = m === "✓" ? GREEN : m === "!" ? ORANGE : "C0392B";
      s.addText(m, { x: x + 0.3, y: ry, w: 0.3, h: 0.3, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 15, bold: true, color: col });
      s.addText(t, { x: x + 0.65, y: ry, w: w - 0.95, h: 0.6, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, fontSize: 13, color: INK });
    });
  });
  s.addNotes("PRESENTER: Firas (4:00–5:00)\nSame question for each option: does the money reach a gap that won't close by itself?\nA spreads SAR 5M x 8: half goes to regions closing in 3 months, Najran only 5M. B focuses on the 4 laggards by gap size. C national campaign: national already 66%, reach lands in on-target regions. Transition: we recommend B.");
}

// ============ 6. RECOMMENDATION ============
{
  const s = pres.addSlide({ masterName: "LIGHT" });
  header(s, 5, "Recommendation  ·  option B", "Weight the SAR 40M by gap size and bring all four regions to 65% by December 2027");
  s.addChart(pres.charts.DOUGHNUT, [{ name: "Allocation", labels: prio.map(p => p.region), values: prio.map(p => p.allocation_sar_m) }], {
    x: 0.45, y: 2.1, w: 4.6, h: 4.6, holeSize: 62, chartColors: [ORANGE, "F0915E", "F5B48E", "F9D2BB"],
    showPercent: false, showValue: false, showLegend: false, dataBorder: { pt: 2, color: WHITE }, objectName: "Allocation doughnut",
  });
  s.addText([{ text: "SAR 40M", options: { fontSize: 30, bold: true, color: INK, breakLine: true } }, { text: "weighted by users to convert", options: { fontSize: 11, color: MUTED } }],
    { x: 1.45, y: 3.95, w: 2.6, h: 0.9, align: "center", valign: "middle", margin: 0, isTextBox: true, fontFace: FONT });
  // allocation legend
  const legCols = [ORANGE, "F0915E", "F5B48E", "F9D2BB"];
  prio.forEach((p, i) => {
    const y = 2.35 + i * 0.52;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: y + 0.08, w: 0.22, h: 0.22, rectRadius: 0.04, fill: { color: legCols[i] }, line: { color: legCols[i] } });
    s.addText([{ text: p.region, options: { color: INK } }, { text: `   SAR ${p.allocation_sar_m}M`, options: { bold: true, color: INK } }],
      { x: 5.55, y, w: 2.6, h: 0.38, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 14 });
  });
  s.addText("What the money buys", { x: 8.45, y: 2.1, w: 4.3, h: 0.4, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 17, bold: true, color: INK });
  const buys = [
    ["Digitise the weakest journeys", "Complaints and Permits first"],
    ["Assisted-digital desks in branches", `Branch adoption ${CH.Branch.adoption_pct.toFixed(0)}% vs app ${CH["Mobile App"].adoption_pct.toFixed(0)}%`],
    ["Local awareness & onboarding", "Targeted at the four regions"],
  ];
  buys.forEach(([t, d], i) => {
    const y = 2.62 + i * 0.82;
    s.addShape(pres.shapes.OVAL, { x: 8.45, y, w: 0.46, h: 0.46, fill: { color: NAVY }, line: { color: NAVY } });
    s.addText(String(i + 1), { x: 8.45, y, w: 0.46, h: 0.46, align: "center", valign: "middle", margin: 0, isTextBox: true, fontFace: FONT, fontSize: 14, bold: true, color: WHITE });
    s.addText([{ text: t, options: { bold: true, color: INK, breakLine: true } }, { text: d, options: { color: MUTED, fontSize: 12 } }],
      { x: 9.1, y: y - 0.04, w: 3.65, h: 0.72, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, fontSize: 14 });
  });
  // Expected effect band
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 5.2, y: 5.15, w: 7.53, h: 1.55, rectRadius: 0.08, fill: { color: TINT }, line: { color: TINT } });
  s.addText("EXPECTED EFFECT", { x: 5.45, y: 5.3, w: 3, h: 0.28, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 10, bold: true, color: ORANGE, charSpacing: 2 });
  s.addText([{ text: "Dec 2027", options: { fontSize: 26, bold: true, color: GREEN, breakLine: true } }, { text: "all four regions ≥ 65%", options: { fontSize: 12, color: MUTED } }],
    { x: 5.45, y: 5.6, w: 2.3, h: 1.0, margin: 0, isTextBox: true, fontFace: FONT, valign: "top" });
  s.addText([{ text: "Sep 2028", options: { fontSize: 26, bold: true, color: MUTED, breakLine: true } }, { text: "Najran at today's pace", options: { fontSize: 12, color: MUTED } }],
    { x: 7.85, y: 5.6, w: 2.2, h: 1.0, margin: 0, isTextBox: true, fontFace: FONT, valign: "top" });
  s.addText([{ text: `${A.Najran.monthly_pace_pts.toFixed(2)} → ${A.Najran.pace_needed_12m.toFixed(2)}`, options: { fontSize: 26, bold: true, color: INK, breakLine: true } }, { text: "Najran pts / month needed", options: { fontSize: 12, color: MUTED } }],
    { x: 10.15, y: 5.6, w: 2.5, h: 1.0, margin: 0, isTextBox: true, fontFace: FONT, valign: "top" });
  s.addNotes("PRESENTER: Firas (5:00–6:15)\nSplit follows users still to convert: Najran 15, Northern Borders 9, Al-Baha 8, Jazan 8.\nThe money buys: digitise Complaints & Permits; assisted-digital desks in branches (53% vs 75% app); local onboarding.\nEffect: all four at 65% by Dec 2027; Najran must roughly double its pace (0.19 → 0.34 pts/month), otherwise ~Sep 2028.\nUncertainty: data shows where the gap is, not points per million, hence staged release.");
}

// ============ 7. ASK + NEXT STEP ============
{
  const s = pres.addSlide({ masterName: "DARK" });
  header(s, 6, "The ask  ·  next step", "Approve SAR 40M today, released in two tranches with a June 2027 checkpoint", true);
  // Timeline
  const pts = [
    ["Today", "Approve SAR 40M", "Release tranche 1: SAR 20M"],
    ["Q1 – Q2 2027", "Deliver", "Complaints & Permits fixes, branch desks"],
    ["June 2027", "Checkpoint", "Each region ≥ halfway to 65% → tranche 2"],
    ["Dec 2027", "Target", "All four regions ≥ 65%"],
  ];
  const x0 = 0.9, x1 = 12.4, ty = 2.75, step = (x1 - x0) / (pts.length - 1);
  s.addShape(pres.shapes.LINE, { x: x0, y: ty, w: x1 - x0, h: 0, line: { color: "3A5A85", width: 2 } });
  pts.forEach(([when, what, d], i) => {
    const cx = x0 + i * step, hi = i === 2;
    s.addShape(pres.shapes.OVAL, { x: cx - 0.17, y: ty - 0.17, w: 0.34, h: 0.34, fill: { color: hi || i === 0 ? ORANGE : WHITE }, line: { color: hi || i === 0 ? ORANGE : WHITE } });
    const tw = 2.7, tx = Math.min(Math.max(cx - tw / 2, 0.6), 12.73 - tw);
    const al = i === 0 ? "left" : i === pts.length - 1 ? "right" : "center";
    s.addText(when.toUpperCase(), { x: tx, y: ty - 0.68, w: tw, h: 0.3, align: al, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 11, bold: true, color: ORANGE, charSpacing: 1 });
    s.addText([{ text: what, options: { bold: true, color: WHITE, fontSize: 16, breakLine: true } }, { text: d, options: { color: "AFC0D6", fontSize: 12 } }],
      { x: tx, y: ty + 0.3, w: tw, h: 0.95, align: al, margin: 0, isTextBox: true, valign: "top", fontFace: FONT });
  });
  // Checkpoint table
  s.addText("June 2027 checkpoint: halfway to 65%", { x: 0.6, y: 4.3, w: 6, h: 0.35, margin: 0, isTextBox: true, fontFace: FONT, fontSize: 15, bold: true, color: WHITE });
  const rows = [[
    { text: "Region", options: { bold: true, color: "8FA3BF" } }, { text: "Dec 2025", options: { bold: true, color: "8FA3BF", align: "right" } },
    { text: "Must reach by Jun 2027", options: { bold: true, color: "8FA3BF", align: "right" } }, { text: "Tranche 2", options: { bold: true, color: "8FA3BF", align: "right" } }]];
  [...alloc].sort((a, b) => a.adoption_pct - b.adoption_pct).forEach(p => rows.push([
    { text: p.region, options: { color: WHITE } }, { text: `${f1(p.adoption_pct)}%`, options: { color: "AFC0D6", align: "right" } },
    { text: `≥ ${f1(p.adoption_pct + p.gap_pts / 2)}%`, options: { color: ORANGE, bold: true, align: "right" } },
    { text: `SAR ${(p.allocation_sar_m / 2).toFixed(1)}M`, options: { color: WHITE, align: "right" } }]));
  s.addTable(rows, { x: 0.6, y: 4.72, w: 7.4, colW: [2.5, 1.4, 2.1, 1.4], rowH: 0.37, fontFace: FONT, fontSize: 13,
    border: { type: "solid", pt: 0.75, color: "2A4A75" }, fill: { color: NAVY }, margin: [0, 0.1, 0, 0.1], valign: "middle" });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 8.45, y: 4.3, w: 4.28, h: 2.35, rectRadius: 0.1, fill: { color: ORANGE }, line: { color: ORANGE } });
  s.addText([
    { text: "Decision today", options: { fontSize: 13, bold: true, color: WHITE, breakLine: true } },
    { text: "Approve SAR 40M", options: { fontSize: 30, bold: true, color: WHITE, breakLine: true } },
    { text: "Nationally we hit 65%. This makes sure every region does.", options: { fontSize: 14, color: WHITE } },
  ], { x: 8.75, y: 4.48, w: 3.7, h: 2.0, margin: 0, isTextBox: true, valign: "top", fontFace: FONT, paraSpaceAfter: 6 });
  s.addNotes("PRESENTER: Firas (6:15–7:00)\nRestate the ask: approve SAR 40M for Najran, Northern Borders, Al-Baha and Jazan; SAR 20M now, SAR 20M in June 2027 if each region is at least halfway to 65%. Tracked monthly on the Tableau dashboard; a missed checkpoint re-targets that region's tranche.\nClose: Nationally we hit 65%. This decision makes sure every region does.");
}

pres.writeFile({ fileName: DECK }).then(f => console.log("saved", f));
