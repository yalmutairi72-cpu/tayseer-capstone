"""Generates tableau/Tayseer_Digital_Adoption.twb (opens in Tableau Public Desktop).

Sheets: KPI, Regional Adoption, National Trend, Months to Target
Dashboard: "Tayseer — Digital Adoption" with Region filter.
"""
from pathlib import Path
from xml.sax.saxutils import quoteattr

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
OUT = ROOT / "tableau" / "Tayseer_Digital_Adoption.twb"
DS = "federated.tayseer0data"
ORANGE, GREY, NAVY = "#e4572e", "#a0a7b4", "#1b2a41"


def q(s):
    return quoteattr(s)


CSV_COLS = [
    ("month", "date"), ("region", "string"), ("service_category", "string"), ("channel", "string"),
    ("transactions", "integer"), ("unique_users", "integer"), ("digital_adoption_pct", "real"),
    ("csat", "real"), ("avg_completion_min", "real"), ("first_time_resolution_pct", "real"),
    ("cost_per_txn_sar", "real"), ("sla_breach_pct", "real"),
]


def adoption_at(date):
    return (f"{{ FIXED [region] : SUM(IF [month] = #{date}# THEN [digital_adoption_pct] / 100 * [unique_users] END)"
            f" / SUM(IF [month] = #{date}# THEN [unique_users] END) * 100 }}")


# name -> (caption, datatype, role, type, formula)
CALCS = {
    "Calc_DA": ("Digital Adoption %", "real", "measure", "quantitative",
                "ROUND(SUM([digital_adoption_pct] / 100 * [unique_users]) / SUM([unique_users]) * 100, 1)"),
    "Calc_Status": ("Target Status", "string", "dimension", "nominal",
                    'IF [Calc_DA] < 65 THEN "Below Target" ELSE "On/Above Target" END'),
    "Calc_Latest": ("Latest Month", "boolean", "dimension", "nominal", "[month] = #2025-12-01#"),
    "Calc_A25": ("Adoption Dec 2025", "real", "measure", "quantitative", adoption_at("2025-12-01")),
    "Calc_A24": ("Adoption Dec 2024", "real", "measure", "quantitative", adoption_at("2024-12-01")),
    "Calc_Pace": ("Monthly Pace", "real", "measure", "quantitative", "([Calc_A25] - [Calc_A24]) / 12"),
    "Calc_Gap": ("Gap to Target", "real", "measure", "quantitative", "MAX(65 - [Calc_A25], 0)"),
    "Calc_MTT": ("Months to Target", "real", "measure", "quantitative", "ROUND([Calc_Gap] / [Calc_Pace], 0)"),
    "Calc_Below": ("Below Target Region", "boolean", "dimension", "nominal", "[Calc_Gap] > 0"),
    "Calc_Priority": ("Priority", "string", "dimension", "nominal",
                      'IF [Calc_MTT] > 6 THEN "Priority (needs > 6 months)" ELSE "Near target (self-closing)" END'),
}
# calcs each calc depends on (so worksheet dependencies are complete)
DEPS = {
    "Calc_Status": ["Calc_DA"], "Calc_Pace": ["Calc_A25", "Calc_A24"], "Calc_Gap": ["Calc_A25"],
    "Calc_MTT": ["Calc_Gap", "Calc_Pace"], "Calc_Below": ["Calc_Gap"], "Calc_Priority": ["Calc_MTT"],
}


def all_deps(names):
    out, stack = [], list(names)
    while stack:
        n = stack.pop()
        if n in out:
            continue
        out.append(n)
        stack += DEPS.get(n, [])
    return out


def calc_xml(name):
    cap, dt, role, typ, f = CALCS[name]
    fmt = " default-format='n#,##0.0;-#,##0.0'" if dt == "real" else ""
    return (f"<column caption={q(cap)} datatype='{dt}'{fmt} name='[{name}]' role='{role}' type='{typ}'>"
            f"<calculation class='tableau' formula={q(f)} /></column>")


def base_col(name):
    dt = dict(CSV_COLS)[name]
    role = "dimension" if dt in ("string", "date") else "measure"
    typ = "nominal" if dt == "string" else ("ordinal" if dt == "date" else "quantitative")
    return f"<column datatype='{dt}' name='[{name}]' role='{role}' type='{typ}' />"


def inst(col, deriv, short, typ):
    return f"<column-instance column='[{col}]' derivation='{deriv}' name='[{short}:{col}:{typ[0]}k]' pivot='key' type='{typ}' />"


def ref(short, col, t):
    return f"[{DS}].[{short}:{col}:{t}k]"


def bool_filter(col):
    return (f"<filter class='categorical' column='{ref('none', col, 'n')}'>"
            f"<groupfilter function='member' level='[none:{col}:nk]' member='true' "
            f"user:ui-domain='database' user:ui-enumeration='inclusive' user:ui-marker='enumerate' /></filter>")


REGION_FILTER = (f"<filter class='categorical' column='{ref('none', 'region', 'n')}'>"
                 f"<groupfilter function='level-members' level='[none:region:nk]' "
                 f"user:ui-enumeration='all' user:ui-marker='enumerate' /></filter>")


def worksheet(name, title, base_cols, calcs, instances, filters, slices, mark, encodings, rows, cols,
              extra_view="", pane_extra="", style="", reflines=""):
    deps = "".join(base_col(c) for c in base_cols) + "".join(calc_xml(c) for c in all_deps(calcs)) + "".join(instances)
    return f"""
    <worksheet name={q(name)}>
      <layout-options><title><formatted-text><run bold='true' fontcolor='{NAVY}' fontsize='13'>{title}</run></formatted-text></title></layout-options>
      <table>
        <view>
          <datasources><datasource caption='tayseer_services' name='{DS}' /></datasources>
          <datasource-dependencies datasource='{DS}'>{deps}</datasource-dependencies>
          {''.join(filters)}
          {extra_view}
          <slices>{''.join(f'<column>{s}</column>' for s in slices)}</slices>
          <aggregation value='true' />
        </view>
        <style>{style}</style>
        <panes>
          <pane selection-relaxation-option='selection-relaxation-allow'>
            <view><breakdown value='auto' /></view>
            <mark class='{mark}' />
            <encodings>{encodings}</encodings>
            {reflines}
            {pane_extra}
          </pane>
        </panes>
        <rows>{rows}</rows>
        <cols>{cols}</cols>
      </table>
    </worksheet>"""


DA = ref("usr", "Calc_DA", "q")
REGION = ref("none", "region", "n")
STATUS = ref("none", "Calc_Status", "n")
LATEST = ref("none", "Calc_Latest", "n")
DA_INST = inst("Calc_DA", "User", "usr", "quantitative")
REGION_INST = inst("region", "None", "none", "nominal")
LATEST_INST = inst("Calc_Latest", "None", "none", "nominal")


def target_line(axis):
    return (f"<reference-line axis-column='{axis}' enable-instant-analytics='false' formula='constant' "
            f"id='refline0' label='65% Target' label-type='custom' scope='per-table' value='65' "
            f"value-column='{axis}' z-order='1' />")


def ref_line_style(axis):
    return (f"<style-rule element='refline'><format attr='stroke-color' id='refline0' value='{NAVY}' />"
            f"<format attr='stroke-size' id='refline0' value='2' /><format attr='line-pattern-only' id='refline0' value='dashed' /></style-rule>")


status_colors = (f"<style-rule element='mark'><encoding attr='color' field='{STATUS}' type='palette'>"
                 f"<map to='{ORANGE}'><bucket>&quot;Below Target&quot;</bucket></map>"
                 f"<map to='{GREY}'><bucket>&quot;On/Above Target&quot;</bucket></map></encoding></style-rule>")

kpi = worksheet(
    "KPI", "KPI", ["month", "digital_adoption_pct", "unique_users"], ["Calc_DA", "Calc_Latest"],
    [DA_INST, LATEST_INST], [bool_filter("Calc_Latest")], [LATEST], "Text",
    f"<text column='{DA}' />", "", "",
    pane_extra=(f"<customized-label><formatted-text>"
                f"<run fontcolor='{NAVY}' fontsize='14' bold='true'>NATIONAL DIGITAL ADOPTION · DEC 2025</run><run>Æ&#10;</run>"
                f"<run fontcolor='{NAVY}' fontsize='44' bold='true'>&lt;{DA}&gt;%</run><run>Æ&#10;</run>"
                f"<run fontcolor='{GREY}' fontsize='12'>Target: 65%</run></formatted-text></customized-label>"))

regional = worksheet(
    "Regional Adoption", "Digital adoption by region, Dec 2025: orange = below the 65% target",
    ["month", "region", "digital_adoption_pct", "unique_users"], ["Calc_DA", "Calc_Status", "Calc_Latest"],
    [DA_INST, REGION_INST, LATEST_INST, inst("Calc_Status", "User", "usr", "nominal").replace("usr:Calc_Status:nk", "none:Calc_Status:nk").replace("derivation='User'", "derivation='None'")],
    [bool_filter("Calc_Latest"), REGION_FILTER], [LATEST, REGION], "Bar",
    f"<color column='{STATUS}' /><text column='{DA}' />", REGION, DA,
    extra_view=f"<computed-sort column='{REGION}' direction='ASC' using='{DA}' />",
    style=status_colors + ref_line_style(DA) +
    f"<style-rule element='mark'><format attr='mark-labels-show' value='true' /></style-rule>",
    reflines=target_line(DA))

trend = worksheet(
    "National Trend", "National digital adoption by month: above 65% since Aug 2025",
    ["month", "digital_adoption_pct", "unique_users"], ["Calc_DA"],
    [DA_INST, inst("month", "Month-Trunc", "tmn", "quantitative")], [], [], "Line",
    "", DA, ref("tmn", "month", "q"), style=ref_line_style(DA) +
    f"<style-rule element='mark'><encoding attr='color' type='custom' /><format attr='mark-color' value='{NAVY}' /></style-rule>",
    reflines=target_line(DA))

MTT = ref("avg", "Calc_MTT", "q")
PRIO = ref("none", "Calc_Priority", "n")
BELOW = ref("none", "Calc_Below", "n")
months = worksheet(
    "Months to Target", "Months to reach 65% at the 2025 pace: orange = needs more than 6 months",
    ["month", "region", "digital_adoption_pct", "unique_users"], ["Calc_MTT", "Calc_Priority", "Calc_Below"],
    [REGION_INST, inst("Calc_MTT", "Avg", "avg", "quantitative"), inst("Calc_Priority", "None", "none", "nominal"),
     inst("Calc_Below", "None", "none", "nominal")],
    [bool_filter("Calc_Below")], [BELOW], "Bar",
    f"<color column='{PRIO}' /><text column='{MTT}' />", REGION, MTT,
    extra_view=f"<computed-sort column='{REGION}' direction='DESC' using='{MTT}' />",
    style=(f"<style-rule element='mark'><encoding attr='color' field='{PRIO}' type='palette'>"
           f"<map to='{ORANGE}'><bucket>&quot;Priority (needs &gt; 6 months)&quot;</bucket></map>"
           f"<map to='{GREY}'><bucket>&quot;Near target (self-closing)&quot;</bucket></map></encoding>"
           f"<format attr='mark-labels-show' value='true' /></style-rule>"))


def zone(id_, name, x, y, w, h, extra=""):
    return f"<zone h='{h}' id='{id_}' name={q(name)} w='{w}' x='{x}' y='{y}' {extra}><zone-style><format attr='border-style' value='none' /><format attr='margin' value='4' /></zone-style></zone>"


dashboard = f"""
    <dashboard name='Tayseer — Digital Adoption'>
      <style />
      <size maxheight='900' maxwidth='1400' minheight='900' minwidth='1400' />
      <zones>
        <zone h='100000' id='1' type-v2='layout-basic' w='100000' x='0' y='0'>
          <zone h='6000' id='2' type-v2='text' w='100000' x='0' y='0'>
            <formatted-text><run bold='true' fontcolor='{NAVY}' fontsize='20'>Tayseer — Digital Adoption</run><run fontcolor='{GREY}' fontsize='12'>   National target met; 8 of 13 regions still below 65%</run></formatted-text>
          </zone>
          {zone(3, 'KPI', 0, 6000, 30000, 30000)}
          {zone(4, 'National Trend', 30000, 6000, 70000, 30000)}
          {zone(5, 'Regional Adoption', 0, 36000, 55000, 64000)}
          {zone(6, 'Months to Target', 55000, 36000, 45000, 54000)}
          <zone h='10000' id='7' mode='checkdropdown' name='Regional Adoption' param='{REGION}' type-v2='filter' w='45000' x='55000' y='90000' />
        </zone>
      </zones>
    </dashboard>"""

relation_cols = "".join(f"<column datatype='{dt}' name='{n}' ordinal='{i}' />" for i, (n, dt) in enumerate(CSV_COLS))
ds_cols = "".join(calc_xml(c) for c in CALCS)

xml = f"""<?xml version='1.0' encoding='utf-8' ?>
<workbook original-version='18.1' source-build='2026.2.3' source-platform='mac' version='18.1' xmlns:user='http://www.tableausoftware.com/xml/user'>
  <preferences><preference name='ui.encoding.shelf.height' value='24' /><preference name='ui.shelf.height' value='26' /></preferences>
  <datasources>
    <datasource caption='tayseer_services' inline='true' name='{DS}' version='18.1'>
      <connection class='federated'>
        <named-connections>
          <named-connection caption='tayseer_services' name='textscan.tayseer0csv'>
            <connection class='textscan' directory={q(str(DATA_DIR))} filename='tayseer_services.csv' password='' server='' />
          </named-connection>
        </named-connections>
        <relation connection='textscan.tayseer0csv' name='tayseer_services.csv' table='[tayseer_services#csv]' type='table'>
          <columns character-set='UTF-8' header='yes' locale='en_US' separator=','>{relation_cols}</columns>
        </relation>
      </connection>
      {ds_cols}
    </datasource>
  </datasources>
  <worksheets>{kpi}{regional}{trend}{months}
  </worksheets>
  <dashboards>{dashboard}
  </dashboards>
  <windows>
    <window class='dashboard' maximized='true' name='Tayseer — Digital Adoption' />
    <window class='worksheet' name='KPI' />
    <window class='worksheet' name='Regional Adoption' />
    <window class='worksheet' name='National Trend' />
    <window class='worksheet' name='Months to Target' />
  </windows>
</workbook>
"""
OUT.write_text(xml, encoding="utf-8")
print(f"wrote {OUT}")
