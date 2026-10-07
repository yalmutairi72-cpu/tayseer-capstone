"""Tayseer digital-adoption analysis: reproduces the Tableau evidence and exports
summary tables + chart images used in the executive deck.

Adoption is user-weighted, matching the Tableau calculated field:
    SUM([Digital Adoption Pct] / 100 * [Unique Users]) / SUM([Unique Users]) * 100
"""
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.dates
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "tayseer_services.csv"
OUT = ROOT / "outputs"
CHARTS = OUT / "charts"
CHARTS.mkdir(parents=True, exist_ok=True)

TARGET = 65.0
BUDGET_M = 40
PRIORITY_THRESHOLD_MONTHS = 6  # regions needing longer than this to reach 65% = priority

NAVY, ORANGE, GREY, LIGHT, GREEN = "#1B2A41", "#E4572E", "#A0A7B4", "#E6E9EE", "#2E8B57"
plt.rcParams.update({
    "font.family": "Helvetica Neue", "font.size": 12, "axes.spines.top": False,
    "axes.spines.right": False, "axes.edgecolor": GREY, "axes.labelcolor": NAVY,
    "xtick.color": NAVY, "ytick.color": NAVY, "figure.dpi": 200,
})


def adoption(g):
    return (g.digital_adoption_pct / 100 * g.unique_users).sum() / g.unique_users.sum() * 100


def wavg(g, col):
    return (g[col] * g.transactions).sum() / g.transactions.sum()


df = pd.read_csv(DATA, parse_dates=["month"])
latest = df.month.max()
last = df[df.month == latest]

# ---------- National trend ----------
national = df.groupby("month").apply(adoption)
crossed = national[national >= TARGET].index.min()

# ---------- Regional status (latest month) ----------
monthly = df.groupby(["month", "region"]).apply(adoption).unstack()
recent = monthly[monthly.index >= latest - pd.DateOffset(months=11)]
x = np.arange(len(recent))
slope = recent.apply(lambda s: np.polyfit(x, s.values, 1)[0])

reg = last.groupby("region").apply(lambda g: pd.Series({
    "adoption_pct": adoption(g),
    "unique_users": g.unique_users.sum(),
    "transactions": g.transactions.sum(),
    "csat": wavg(g, "csat"),
    "cost_per_txn_sar": wavg(g, "cost_per_txn_sar"),
    "sla_breach_pct": wavg(g, "sla_breach_pct"),
}))
reg["adoption_dec_2024"] = df[df.month == latest - pd.DateOffset(months=12)].groupby("region").apply(adoption)
reg["yoy_change_pts"] = reg.adoption_pct - reg.adoption_dec_2024
reg["monthly_pace_pts"] = slope
reg["gap_pts"] = (TARGET - reg.adoption_pct).clip(lower=0)
reg["users_to_convert"] = reg.gap_pts / 100 * reg.unique_users
reg["months_to_target"] = np.where(reg.gap_pts > 0, reg.gap_pts / reg.monthly_pace_pts, 0)
reg["status"] = np.select(
    [reg.gap_pts == 0, reg.months_to_target > PRIORITY_THRESHOLD_MONTHS],
    ["On/Above Target", "Priority (structural gap)"], "Near target (self-closing)")
reg = reg.sort_values("adoption_pct")

prio = reg[reg.status == "Priority (structural gap)"].copy()
share = prio.users_to_convert / prio.users_to_convert.sum() * BUDGET_M
alloc = share.round().astype(int)
alloc[alloc.idxmax()] += BUDGET_M - alloc.sum()  # keep total exactly SAR 40M
prio["allocation_sar_m"] = alloc
prio["pace_needed_6m"] = prio.gap_pts / 6
prio["pace_needed_12m"] = prio.gap_pts / 12
reg = reg.join(prio[["allocation_sar_m"]]).fillna({"allocation_sar_m": 0})

# ---------- Supporting cuts ----------
channel = last.groupby("channel").apply(lambda g: pd.Series({
    "adoption_pct": adoption(g), "cost_per_txn_sar": wavg(g, "cost_per_txn_sar"),
    "csat": wavg(g, "csat"), "transactions": g.transactions.sum()})).sort_values("cost_per_txn_sar")
lag = last[last.region.isin(prio.index)]
category = pd.DataFrame({
    "priority_regions": lag.groupby("service_category").apply(adoption),
    "national": last.groupby("service_category").apply(adoption),
}).sort_values("priority_regions")

reg.round(2).to_csv(OUT / "regional_summary.csv")
national.round(2).rename("national_adoption_pct").to_csv(OUT / "national_trend.csv")
channel.round(2).to_csv(OUT / "channel_summary.csv")
category.round(2).to_csv(OUT / "category_priority_regions.csv")
prio.round(2).to_csv(OUT / "allocation.csv")


# ---------- Charts ----------
def save(fig, name):
    fig.savefig(CHARTS / name, bbox_inches="tight", transparent=False, facecolor="white")
    plt.close(fig)


# 1. National trend
fig, ax = plt.subplots(figsize=(11, 4.6))
ax.plot(national.index, national.values, color=NAVY, lw=2.6)
ax.axhline(TARGET, color=ORANGE, ls="--", lw=1.6)
ax.text(national.index[0], TARGET + 0.35, "65% target", color=ORANGE, fontsize=12, weight="bold")
ax.scatter([latest], [national.iloc[-1]], color=NAVY, s=60, zorder=3)
ax.annotate(f"Dec 2025: {national.iloc[-1]:.1f}%", (latest, national.iloc[-1]),
            xytext=(-150, 18), textcoords="offset points", fontsize=13, weight="bold", color=NAVY)
ax.annotate(f"Target crossed {crossed:%b %Y}", (crossed, national[crossed]),
            xytext=(20, -70), textcoords="offset points", fontsize=11, color=NAVY,
            arrowprops=dict(arrowstyle="-", color=GREY))
ax.xaxis.set_major_formatter(matplotlib.dates.DateFormatter("%b %Y"))
ax.set_ylabel("National digital adoption (%)")
ax.set_ylim(52, 68)
ax.grid(axis="y", color=LIGHT)
save(fig, "01_national_trend.png")

# 2. Regional bar (mirrors Tableau Regional Adoption sheet)
fig, ax = plt.subplots(figsize=(11, 6))
colors = [ORANGE if g > 0 else GREY for g in reg.gap_pts]
ax.barh(reg.index, reg.adoption_pct, color=colors, height=0.7)
ax.axvline(TARGET, color=NAVY, ls="--", lw=1.6)
ax.text(TARGET + 0.1, len(reg) - 0.4, "65% target", color=NAVY, fontsize=11, weight="bold")
for i, v in enumerate(reg.adoption_pct):
    ax.text(v + 0.15, i, f"{v:.1f}%", va="center", fontsize=11, color=NAVY)
ax.set_xlim(55, 73)
ax.set_xlabel("Digital adoption, Dec 2025 (%)")
ax.legend(handles=[plt.Rectangle((0, 0), 1, 1, color=ORANGE), plt.Rectangle((0, 0), 1, 1, color=GREY)],
          labels=["Below target", "On/above target"], loc="lower right", frameon=False)
save(fig, "02_regional_adoption.png")

# 3. Evidence: gap vs months to reach target at current pace
below = reg[reg.gap_pts > 0].sort_values("months_to_target")
fig, ax = plt.subplots(figsize=(11, 5.4))
c = [ORANGE if s.startswith("Priority") else GREY for s in below.status]
ax.barh(below.index, below.months_to_target, color=c, height=0.65)
ax.axvline(PRIORITY_THRESHOLD_MONTHS, color=NAVY, ls=":", lw=1.4)
ax.text(PRIORITY_THRESHOLD_MONTHS + 0.2, -0.75, "6-month line", color=NAVY, fontsize=10)
for i, (r, row) in enumerate(below.iterrows()):
    ax.text(row.months_to_target + 0.3, i,
            f"{row.months_to_target:.0f} mo  |  gap {row.gap_pts:.1f} pts  |  +{row.monthly_pace_pts:.2f} pts/mo",
            va="center", fontsize=10.5, color=NAVY,
            bbox=dict(facecolor="white", edgecolor="none", pad=1.5))
ax.set_xlim(0, 34)
ax.set_xlabel("Months to reach 65% at the 2025 pace")
ax.invert_yaxis()
save(fig, "03_months_to_target.png")

# 4. Service categories in priority regions
fig, ax = plt.subplots(figsize=(11, 5))
yy = np.arange(len(category))
ax.barh(yy, category.priority_regions, color=[ORANGE if v < 60 else GREY for v in category.priority_regions], height=0.6)
ax.scatter(category.national, yy, color=NAVY, zorder=3, label="National average")
ax.axvline(TARGET, color=NAVY, ls="--", lw=1.2)
ax.set_yticks(yy, category.index)
for i, v in enumerate(category.priority_regions):
    ax.text(54.2, i, f"{v:.1f}%", va="center", color="white", fontsize=10.5, weight="bold")
ax.set_xlim(54, 71)
ax.set_xlabel("Digital adoption in the 4 priority regions, Dec 2025 (%)")
ax.legend(frameon=False, loc="lower right")
save(fig, "04_category_gap.png")

# 5. Allocation
fig, ax = plt.subplots(figsize=(8, 4.2))
p = prio.sort_values("allocation_sar_m")
ax.barh(p.index, p.allocation_sar_m, color=ORANGE, height=0.6)
for i, (r, row) in enumerate(p.iterrows()):
    ax.text(row.allocation_sar_m + 0.2, i, f"SAR {row.allocation_sar_m:.0f}M", va="center", fontsize=12, weight="bold", color=NAVY)
ax.set_xlim(0, 19)
ax.set_xlabel("Allocation (SAR million), weighted by users to convert")
save(fig, "05_allocation.png")

print(f"National Dec 2025: {national.iloc[-1]:.2f}% (crossed 65% in {crossed:%b %Y})")
print(reg[["adoption_pct", "gap_pts", "monthly_pace_pts", "months_to_target", "status", "allocation_sar_m"]].round(2))
print(category.round(2))
print(channel.round(2))
print(prio[["gap_pts", "monthly_pace_pts", "pace_needed_6m", "pace_needed_12m", "allocation_sar_m"]].round(2))
