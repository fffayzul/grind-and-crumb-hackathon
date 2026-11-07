# Grind & Crumb — Operations Command & Executive Pitch Guide

This README is structured directly around the **Hackathon Marking Criteria** so your colleague can build the pitch slides and deliver a winning presentation with every number backed by the official Drive dataset (`S01`–`S12`, `CS1`–`CS7`, July 2025 – June 2026).

---

## 1. First-Minute Executive Summary (Report & Pitch — 10% Weight)
> **Marking Criterion:** *"Clear, concise, answers the CEO's question in the first minute."*

### CEO Anna Whitfield's Question (`stakeholder_interviews.md`):
> *"Sales are up again (£8.66m), but the profit line doesn't move. I can't tell if it's one or two stores dragging us down or something across the whole chain. By the time I see a problem it's six weeks old."*

### Our 60-Second Answer to the CEO:
1. **Your Starter P&L Overstates Profit by £147k:** `starter_store_monthly_pnl.csv` reports **£1,069,104** in store profit, **but forgets to subtract `waste_cost_gbp` (£133,815)** and an unbooked **£19,442 rota labor gap**. True annual chain net profit is **~£922,000**.
2. **It is BOTH 3 specific problem stores AND 3 chain-wide margin leaks:**
   - **Store Bleed #1 — `S07 Manchester Piccadilly` (Losing -£63,930/yr at -5.8% true margin):** Highest sales in the chain (£1.11m), so manager Ollie thinks it's your most profitable store ("the rent is head office's problem"). In reality, **£30,500/mo rent (£366k/yr)** plus single-coffee delivery orders jamming the 12:00–14:00 commuter queue caused **32 staff leavers** and heavy losses.
   - **Store Bleed #2 — `S12 Leeds Trinity` Cannibalized `S03 Leeds Briggate`:** Opening `S12` (£385k CapEx, Sept 2025) just **0.4 miles from `S03`** cut `S03` sales by **~19% (-£180k/yr)** and slashed `S03` profit from £16.5k/mo to £7.5k/mo — while manager Grace kept last year's central food par levels, creating **£16,649/yr in waste** (highest in chain).
   - **Store Bleed #3 — `S10 Hull Paragon` (3.02% Waste Rate + Broken Equipment):** Highest waste rate in the chain (**3.02% of sales / £16,303/yr**) because manager Marcus Dyer over-orders on purpose (*"I'd rather bin it than disappoint someone"*), plus **£14,000/yr** in emergency boiler/dishwasher repair callouts.
   - **Chain-Wide Leaks:**
     1. **Dashly Commission Hike (27% $\rightarrow$ 33% on 1 Apr 2026) & Sub-£8 Orders:** 28.9% of delivery orders are under £8 (`transactions.csv`). Once 33% commission, £0.45 packaging, and £0.96 pick labor (4 mins @ 1.13x) are deducted, small orders lose money and block in-store queues.
     2. **App v3.0 Launch Bug (2 Mar 2026):** Wiped customer loyalty stamps and froze checkout — crashing monthly App Click & Collect sales by **-33%** (from £95.2k in Feb to £63.7k in Mar).
     3. **40p Oat Milk Surcharge (12 Jan 2026) + April NLW Rise (+6.7%):** Rival *Bean Social* scrapped its plant milk fee two days later (`news_and_market_notes.md`); `customer_survey.csv` proves **53.3% of oat milk drinkers now visit less often** (vs 29.9% of dairy drinkers).

---

## 2. Quantified Root Causes (Insight — 30% Weight)
> **Marking Criterion:** *"Root causes found and quantified, from numbers and qualitative sources, not just symptoms described."*

| Store / Area | Symptom in Numbers | Root Cause (Quantitative + Qualitative Source) | Annual Impact |
| :--- | :--- | :--- | :--- |
| **`S07` Manchester Piccadilly** | £1,110,644 sales (#1), but **-£63,930 true loss (-5.8% margin)** | £30,500/mo rent (£366k/yr) + 3 lunch baristas instead of 5 (`Jordan` interview) + sub-£8 delivery tablets pinging at lunch + 50p/hr lower wage than concourse rivals $\rightarrow$ **32 leavers/yr** (`staff_exit_survey.csv`). | **-£63,930 / yr** |
| **`S03` Leeds Briggate & `S12` Leeds Trinity** | `S03` sales fell from £89k/mo (Jul–Aug) to £72k/mo; `S12` only at 4.0% margin | CEO Anna is proud of `S12`, but `S12` opened **0.4 miles away** (`business_events.csv`), cannibalizing ~6,500 door counts/mo from `S03`. Manager Grace Okafor never lowered central par levels $\rightarrow$ **£16,649/yr waste**. | **-£110,000 / yr** net cannibalization + **£16,649** waste |
| **`S10` Hull Paragon** | 6.3% true margin; **3.02% waste rate** (2.3x chain average) | Manager Marcus Dyer intentionally over-orders (*"I'd rather bin it than disappoint someone"*) + dishwasher broke 3x & old boiler (`store_costs_monthly.csv` repairs). | **£16,303 / yr** waste + **£14,000 / yr** repairs |
| **`S11` Sheffield Uni Campus** | **35.5% annual labor** (**52.0% in June**, -2.8% June margin) | 26,000-student campus kiosk (`store_catchment.csv`) keeps term-time staffing rota in June when students leave for summer. | **-£18,500 / yr** out-of-term over-rostering |
| **`S06` Manchester Spinningfields** | 7.1% true margin (£12,400/mo rent) | Office district (22,500 office workers) is dead on weekends (`Sam Kowalski` interview) and sells out of sandwiches by 1:15 PM on weekdays while queues walk out. | **+£42,000 / yr** opportunity from 5-day rota flex |
| **Delivery Channel** | £1,431,363 sales across 111,487 orders, but **£424.1k commission + £50.2k packaging + £107.0k labor** | Dashly rose from 27% to 33% on 1 Apr 2026 (`delivery_platform_emails.md`); **28.9% of orders are `< £8`**, losing money on every bag. | **+£165,000 / yr** recoverable via £8–£11.50 MOV + RushEats shift |
| **Digital App v3.0 & Oat Milk** | App receipts fell from 17,224 (Feb) to 11,484 (Mar); Oat milk visits down | App v3.0 lost loyalty stamps (`Rohan Mehta` interview); 40p oat surcharge alienated 53.3% of oat customers after *Bean Social* went free. | **-£140,000 / yr** lost high-margin app & oat revenue |

---

## 3. Clear £1.5m Capital Allocation & Risks (Recommendation — 25% Weight)
> **Marking Criterion:** *"Clear £1.5m allocation, numbers behind it, risks acknowledged."*

CEO Anna Whitfield wants to open **Kelham Island in Sheffield (`CS2`)** and **Wellington Place in Leeds (`CS7`)** ("Leeds has been good to us, so another one there feels safe").

### Critical Strategic Warning to the CEO: DO NOT Open `CS7 Leeds Wellington Place` (£350k)
- Opening `S12 Leeds Trinity` (0.4 miles from `S03 Leeds Briggate`) already cannibalized `S03` by ~19%, and `S12` made only **£19k** in its first year. Opening a **third** central Leeds store at `CS7 Wellington Place` will further cannibalize `S03` and `S12`.
- Instead, we recommend **£520k to fix existing leaks (+£176k/yr)**, **£70k for a Piccadilly rent renegotiation & weekly profit tool (+£88k/yr)**, **£450k for one new store outside central Leeds (`CS5 Liverpool Bold Street` or `CS6 Wakefield` = +£91k/yr)**, and **£460k in reserve**. This adds **+£355k a year** to store profit (`£922k` $\rightarrow$ **`£1,277k/yr`**) and pays back the **£1.04m active spend in 2.9 years** (or **3.9 years** without the rent cut).

### Recommended £1,500,000 Capital Allocation Table (Appendix B)

| Item | Budget | Profit per Year | How the Number Is Built |
| :--- | :---: | :---: | :--- |
| **1. Fix the App (v3.0)** | **£200,000** | **+£67,000 / yr** | Win back 50% of ~636 lost weekly app orders $\times$ £5.49 average order $\times$ 74% kept after costs. |
| **2. Manchester Lunch Capacity (`S07` & `S06`)** | **£120,000** | **+£27,000 / yr** | Recover 60% of the lunch conversion gap (29% vs 36% elsewhere) via a lunch barista & pick-up shelf, and halve excess staff turnover (£2,000 per leaver), net of extra wages. |
| **3. Hull Turnaround (`S10`)** | **£90,000** | **+£26,000 / yr** | Repairs from £24k back to the chain norm (~£8k); food waste halved (3.02% $\rightarrow$ 1.5%); lower turnover; net of cleaner cost. |
| **4. Drop the 40p Oat-Milk Charge** | **£100,000** | **+£23,000 / yr** | Give up £104k in fees; win back 75% of lost oat-drinker visits (53.3% visited less often after Jan 2026). |
| **5. Delivery Repricing & Platform Shift** | **£10,000** | **+£33,000 / yr** | £1.50 fee on orders under £8 (15% of those orders lost = +£15k); move 50% of Dashly orders to RushEats (3 points lower commission = +£18k). |
| **6. Piccadilly Rent Renegotiation (`S07`)** | **£30,000** | **+£88,000 / yr** | Bring rent down from 33% to 25% of £1.11m sales. |
| **7. Weekly Store Profit Tool** | **£40,000** | *Enabler* | Problems visible in 1 week instead of 6. |
| **8. One New Store Outside Central Leeds** | **£450,000** | **+£91,000 / yr** | Site model at maturity (`CS5 Liverpool Bold Street` or `CS6 Wakefield`). |
| **9. Piccadilly Exit / Relocation Reserve** | **£460,000** | *Risk Buffer* | Covers leaving or moving `S07 Manchester Piccadilly` if the landlord refuses to cut the rent. |
| **TOTAL ALLOCATION** | **£1,500,000** *(£1.04m spend + £460k reserve)* | **+£355,000 / yr** | Takes Chain Store Profit from **£922k $\rightarrow$ £1,277k/yr (+38.5%)** • **2.9 yrs payback** (**3.9 yrs** without rent cut). |

### Key Risks Acknowledged & Mitigations
1. **Landlord Refuses the Piccadilly (`S07`) Rent Cut:** The +£88k/yr rent saving depends on the landlord agreeing to reduce rent from 33% to 25% of sales. *Mitigation:* We explicitly model payback both **with** the rent cut (**2.9 years**) and **without** it (**3.9 years**), and hold a dedicated **£460k reserve** to fund exiting or relocating Piccadilly if talks fail.
2. **New Store Maturity Ramp-Up:** The +£91k/yr profit is estimated for a mature store, whereas `S12 Leeds Trinity` made only £19k in its first year. *Mitigation:* We open only **one** new store outside central Leeds (`Liverpool` or `Wakefield`), and only after existing store leak fixes are working.
3. **Delivery Fee Order Drop-Off:** Charging £1.50 on orders under £8 may lose ~15% of those small orders. *Mitigation:* Most sub-£8 delivery orders lose money today after 33% commission, £0.45 packaging, and £0.96 pick labor.

---

## 4. Data Rigour: 9 Dataset Traps Spotted & Cleaned (10% Weight)
> **Marking Criterion:** *"Data issues spotted and handled, comparisons fair, assumptions stated."*

Before aggregating our numbers, we ran a programmatic audit across all 19 CSVs in the data pack and cleaned **9 intentional data quality traps**:

1. **Omitted Waste in `starter_store_monthly_pnl.csv`:** `store_profit_gbp` (£1,069,103.62) subtracts food COGS, labor, delivery fees, and fixed OpEx, **but forgets to subtract `waste_cost_gbp` (£133,814.91)**. Furthermore, `staff_rota_weekly.csv` starts on Monday `2025-06-30` and ends on `2026-06-29` (53 weekly entries vs 365 calendar days), creating a £19,442 boundary difference. Deducting waste reconciles true chain net profit to **~£922,000–£935,289**.
2. **Mixed Date Formats (`YYYY-MM-DD` vs `DD/MM/YYYY`):** `waste_log.csv` and `staff_rota_weekly.csv` mix ISO dates with UK `DD/MM/YYYY` dates (e.g., row 93 `01/10/2025`), which breaks standard date parsers unless parsed with mixed/dayfirst handling.
3. **129 Null `units_wasted` Rows in `waste_log.csv`:** Out of 12,876 rows in `waste_log.csv`, **129 rows** have `NaN` for `units_wasted`, while `est_cost_wasted_gbp` has 0 nulls. We aggregate waste financially via `est_cost_wasted_gbp` and impute missing unit counts from SKU cost.
4. **10x Sensor Glitch in `footfall.csv` (6 Dec 2025 at `S09 Harrogate`):** On `2025-12-06`, `S09 Harrogate James Street` recorded `4,014` Morning, `3,150` Lunch, and `3,006` Afternoon door counts (`10,170` in one day vs its `1,130` normal daily count — an exact **10x decimal-shift glitch** adding `9,040` phantom visitors). We corrected `S09`'s Dec 6 footfall to `1,017`, reconciling `footfall.csv` (`3,140,820`) to the exact `3,131,780` total in `starter_store_monthly_pnl.csv`.
5. **7 Decimal-Point Typos (`£35.00` instead of `£3.50`) in `transaction_lines.csv`:** On `2026-03-14` at `S04 York Stonegate` (receipts `R0098122`–`R0098152`), 7 lines have `unit_price_gbp = 35.0` and `line_total_gbp = 35.0` (a `10x` decimal typo for a `£3.50` Flat White/Cappuccino), even though `transactions.csv` recorded the true `gross_gbp = 3.50`.
6. **64 Duplicate Receipts in `transactions.csv` & 106 in `transaction_lines.csv` (+25 in `loyalty_customers.csv`):** We deduplicated all primary keys (`receipt_id`, `customer_id`) and noted the 631 null `age_band` rows in `loyalty_customers.csv` and 1,728 null `payment_method` rows in `transactions.csv`.
7. **570 Refund Receipts (`-RF` suffix) & 25 Negative Discounts in `transactions.csv`:** 570 rows have `receipt_id` ending in `-RF` with `n_lines = 0` and negative `gross_gbp`/`net_gbp`, and 25 rows have negative `discount_gbp` (`-0.40` to `-4.25`). We separate refunds from regular basket-size calculations and use `daily_store_sales.csv` for 100% revenue totals.
8. **Fair Store Comparisons (`S12` Partial Year):** `S12 Leeds Trinity` opened 15 Sept 2025 (288 trading days / 9.5 months vs 364 trading days / 12 months for `S01`–`S11`). We compare stores on weekly/per-trading-day run rates rather than raw annual sums.
9. **Unstandardized `store_name_raw` in `customer_reviews.csv`:** The 3,030 reviews have no `store_id`, 91 null `review_text` rows, 98 strings with leading/trailing whitespace, and **25+ naming variants** (e.g., `"Manc Piccadilly Station"`, `"Piccadilly"`, `"leeds - briggate"`, `"SU kiosk"`), which we entity-mapped to `S01`–`S12`.

---

## 5. How the Live Tool Works (Tool — 25% Weight)
> **Marking Criterion:** *"Solves a real problem the data shows, usable by the client, works live."*

The web app (`http://127.0.0.1:8000/`) is built on **Django** and **Django REST Framework** with four uncluttered tabs:

- **Tab 1 (`1. Store P&L`):** Displays all 12 stores (`S01`–`S12`) with live weekly sales, labor % (`hours × wage × 1.13`), waste cost, and true operating margin. Automatically flags `S07 Manchester Piccadilly` (-5.8% margin), `S10 Hull Paragon` (6.3% margin, 3.02% waste), and `S11 Sheffield Uni Campus` (35.5% labor). Managers can click **+ Add Data** to adjust rota hours (e.g., `-25` hours at `S11`) and watch the breach resolve live.
- **Tab 2 (`2. Delivery Simulator`):** Models per-order delivery economics (`33% Dashly fee`, `£0.45 packaging`, `£0.96 pick labor`). Proves why sub-£8 orders lose money and lets Ops deploy a new MOV (£11.50) and markup (+15%) to the database with one click.
- **Tab 3 (`3. Waste Predictor`):** Targets the £133,815/yr waste bill (`£68.2k Lunch`, `£52.4k Bakery`) across real SKUs (`P26 Ham & Cheese Toastie`, `P16 Butter Croissant`, `P29 Falafel Wrap`). Combines 2:00 PM stock counts with afternoon weather forecasts (`Rain -38%`, `Cloudy -12%`, `Sunny +5%`) and triggers one-click **50% Loyalty App Push** or **Too Good To Go** rescues that write negative waste credits to the database.
- **Tab 4 (`4. Decision Simulator`):** Interactive CEO calculator starting from **£922,000 Chain Annual Net Profit** and **£1.50m Capital Outlay (1.63 yrs payback)**. Includes sliders for **Hull Paragon (`S10`) Write-Off Reduction**, **Dashly Commission Rate**, **Customer Delivery Charge**, and checkboxes for all **7 candidate sites (`CS1`–`CS7`)** from `candidate_sites.csv`.
