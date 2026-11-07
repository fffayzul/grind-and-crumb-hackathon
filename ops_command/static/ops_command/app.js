// ============================================================================
// GRIND & CRUMB — MINIMAL FULL-STACK CLIENT
// ============================================================================

let storesData = [];
let wastePredictorSkus = [];
let candidateSitesData = [];
let currentStoreFilter = 'all';
let currentWeather = 'rain';
let deliveryChartInstance = null;
let storeMarginChartInstance = null;
let leedsTrendChartInstance = null;
let ceoBridgeChartInstance = null;
let wasteSurplusChartInstance = null;
let wasteCategoryChartInstance = null;

// CEO Decision Simulator Baseline Constants (from Drive Data Pack: July 2025 – June 2026)
const BASELINE_CHAIN_NET_PROFIT = 922000; // £922k true annual net profit (after deducting £133.8k waste & £19.4k rota gap from £1,069k starter P&L)
const BASELINE_CAPITAL_OUTLAY = 1500000;  // £1.50m CEO expansion & turnaround capital budget
const HULL_ANNUAL_WRITEOFFS = 30300;      // £16,303/yr food waste (3.02% rate) + £14,000/yr boiler/dishwasher breakdown write-offs in Hull Paragon (S10)
const ANNUAL_DELIVERY_REVENUE = 1431363;  // Actual network annual delivery sales (£1,431,363 across 111,487 orders)
const ANNUAL_DELIVERY_ORDERS = 111487;    // Actual 111,487 delivery receipts/yr in starter_store_monthly_pnl.csv

document.addEventListener('DOMContentLoaded', async () => {
  initStoreMarginChart();
  initLeedsTrendChart();
  initDeliveryChart();
  initCeoBridgeChart();
  initWasteCharts();
  await fetchDashboardState();
});

async function fetchDashboardState() {
  try {
    const res = await fetch(`/api/dashboard/?weather=${currentWeather}`);
    const data = await res.json();

    storesData = data.stores;
    wastePredictorSkus = data.wastePredictor.skus;
    candidateSitesData = data.candidateSites || [];

    const storeSelect = document.getElementById('modal-store');
    if (storeSelect && storesData.length) {
      const currentVal = storeSelect.value || 'S11';
      storeSelect.innerHTML = storesData.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
      const hasOption = storesData.some(s => s.id === currentVal);
      storeSelect.value = hasOption ? currentVal : 'S11';
    }

    document.getElementById('kpi-network-rev').textContent = `£${Math.round(data.kpis.networkRevenue).toLocaleString()}`;

    const manMarginEl = document.getElementById('kpi-manchester-margin');
    manMarginEl.textContent = `${data.kpis.manchesterMargin.toFixed(1)}%`;
    manMarginEl.className = data.kpis.manchesterMargin < 10
      ? 'text-2xl font-semibold font-mono mt-1 text-rose-600'
      : 'text-2xl font-semibold font-mono mt-1 text-emerald-600';

    document.getElementById('kpi-annual-waste').textContent = `£${Math.round(data.kpis.annualizedWaste).toLocaleString()}`;

    document.getElementById('slider-mov').value = data.deliveryPolicy.mov;
    document.getElementById('slider-markup').value = data.deliveryPolicy.markupPct;
    document.getElementById('slider-cogs').value = data.deliveryPolicy.cogsPct;

    renderStoreTable();
    renderCandidateSites();
    updateCeoDecisionSim();
    updateDeliverySim();
    renderWasteModule(data.wastePredictor.weatherLabel);
  } catch (err) {
    console.error('Error loading dashboard:', err);
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.classList.remove('active', 'text-zinc-900');
    btn.classList.add('text-zinc-500');
  });

  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'text-zinc-900');
    activeBtn.classList.remove('text-zinc-500');
  }

  if (tabId === 'module1') {
    if (storeMarginChartInstance) storeMarginChartInstance.resize();
    if (leedsTrendChartInstance) leedsTrendChartInstance.resize();
  }
  if (tabId === 'module2' && deliveryChartInstance) {
    deliveryChartInstance.resize();
  }
  if (tabId === 'module3') {
    if (wasteSurplusChartInstance) wasteSurplusChartInstance.resize();
    if (wasteCategoryChartInstance) wasteCategoryChartInstance.resize();
  }
  if (tabId === 'module4' && ceoBridgeChartInstance) {
    ceoBridgeChartInstance.resize();
  }
}

// --- TAB 1: STORE P&L ---
function renderStoreTable() {
  const tbody = document.getElementById('store-pl-tbody');
  const filtered = storesData.filter(s => currentStoreFilter === 'all' ? true : s.status === currentStoreFilter);

  tbody.innerHTML = filtered.map(store => {
    const laborClass = store.laborPct > 35.0 ? 'text-rose-600 font-semibold' : 'text-zinc-700';
    const marginClass = (store.isFlagship && store.opMargin < 10.0) || store.opMargin < 8.0
      ? 'text-rose-600 font-semibold'
      : 'text-emerald-600 font-medium';

    const statusBadge = store.status === 'breach'
      ? `<span class="px-2 py-0.5 text-xs font-mono bg-rose-50 text-rose-700 rounded-md">${store.breachReason}</span>`
      : `<span class="px-2 py-0.5 text-xs font-mono bg-emerald-50 text-emerald-700 rounded-md">Healthy</span>`;

    return `
      <tr class="hover:bg-zinc-50/80 transition-colors">
        <td class="py-3 px-4">
          <div class="font-medium text-zinc-900">
            ${store.name}
            ${store.isFlagship ? '<span class="text-xs text-zinc-400 font-normal ml-1">Flagship</span>' : ''}
          </div>
          ${store.diagnosis ? `<div class="text-xs text-zinc-400 mt-0.5">${store.diagnosis}</div>` : ''}
        </td>
        <td class="py-3 px-4 text-right font-mono text-zinc-700">£${Math.round(store.sales).toLocaleString()}</td>
        <td class="py-3 px-4 text-right font-mono ${laborClass}">${store.laborPct.toFixed(1)}%</td>
        <td class="py-3 px-4 text-right font-mono text-zinc-600">£${Math.round(store.wasteCost).toLocaleString()}</td>
        <td class="py-3 px-4 text-right font-mono ${marginClass}">${store.opMargin.toFixed(1)}%</td>
        <td class="py-3 px-4 text-right">${statusBadge}</td>
      </tr>
    `;
  }).join('');

  if (storeMarginChartInstance && storesData.length) {
    storeMarginChartInstance.data.labels = storesData.map(s => s.id);
    storeMarginChartInstance.data.datasets[0].data = storesData.map(s => s.opMargin);
    storeMarginChartInstance.data.datasets[0].backgroundColor = storesData.map(s =>
      s.status === 'breach' ? '#f43f5e' : '#18181b'
    );
    storeMarginChartInstance.update();
  }
}

function initStoreMarginChart() {
  const canvas = document.getElementById('storeMarginChart');
  if (!canvas) return;
  storeMarginChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 10, family: 'JetBrains Mono' } }, grid: { display: false } },
        y: {
          ticks: { color: '#71717a', font: { size: 10 }, callback: v => `${v}%` },
          grid: { color: '#f4f4f5' }
        }
      }
    }
  });
}

function initLeedsTrendChart() {
  const canvas = document.getElementById('leedsTrendChart');
  if (!canvas) return;
  // Exact monthly sales (£k) from starter_store_monthly_pnl.csv for S03 Leeds Briggate & S12 Leeds Trinity
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const s03Sales = [87.9, 90.5, 76.0, 71.8, 73.2, 74.7, 59.7, 58.3, 70.6, 70.8, 73.5, 73.0];
  const s12Sales = [null, null, 17.6, 38.6, 46.9, 57.1, 49.0, 51.0, 56.6, 57.2, 65.8, 58.8];

  leedsTrendChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: 'S03 Briggate (£k)',
          data: s03Sales,
          borderColor: '#f43f5e',
          backgroundColor: 'rgba(244, 63, 94, 0.08)',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2.5
        },
        {
          label: 'S12 Trinity (£k)',
          data: s12Sales,
          borderColor: '#18181b',
          borderDash: [4, 4],
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2.5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { boxWidth: 10, font: { size: 10 }, color: '#52525b' }
        }
      },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { display: false } },
        y: {
          ticks: { color: '#71717a', font: { size: 10 }, callback: v => `£${v}k` },
          grid: { color: '#f4f4f5' }
        }
      }
    }
  });
}

function filterStores(filter) {
  currentStoreFilter = filter;
  ['all', 'breach'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (btn) {
      btn.className = f === filter
        ? 'px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-900 font-medium cursor-pointer'
        : 'px-2.5 py-1 rounded-md text-zinc-500 hover:text-zinc-900 cursor-pointer';
    }
  });
  renderStoreTable();
}

// --- CEO DECISION SIMULATOR (Inside Store P&L Tab) ---
function renderCandidateSites() {
  const container = document.getElementById('candidate-sites-list');
  if (!container) return;

  container.innerHTML = candidateSitesData.map(site => `
    <label class="flex items-center justify-between p-2.5 rounded-lg border ${site.selected ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:bg-zinc-50/50'} cursor-pointer transition-colors text-xs">
      <div class="flex items-center gap-2.5">
        <input type="checkbox" ${site.selected ? 'checked' : ''} onchange="toggleCandidateSite(${site.id})" class="accent-zinc-900 rounded cursor-pointer">
        <div>
          <span class="font-medium text-zinc-900">${site.cityLocation}</span>
          <span class="text-zinc-400 ml-1">${site.catchmentType}</span>
        </div>
      </div>
      <div class="font-mono text-right shrink-0">
        <span class="text-emerald-600 font-medium">+£${Math.round(site.annualNetProfit / 1000)}k/yr</span>
        <span class="text-zinc-400 ml-1.5">(£${Math.round(site.setupCapex / 1000)}k CapEx)</span>
      </div>
    </label>
  `).join('');
}

async function toggleCandidateSite(siteId) {
  await fetch('/api/candidate-site/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ site_id: siteId })
  });
  await fetchDashboardState();
}

function updateCeoDecisionSim() {
  const hullSlider = document.getElementById('ceo-hull-slider');
  if (!hullSlider) return;

  const hullReductionPct = parseFloat(hullSlider.value) || 0;
  const commRatePct = parseFloat(document.getElementById('ceo-comm-slider').value) || 33;
  const deliveryFee = parseFloat(document.getElementById('ceo-fee-slider').value) || 0;
  const appOatLunchOn = document.getElementById('chk-app-oat-lunch')?.checked ?? true;
  const piccadillyRentOn = document.getElementById('chk-piccadilly-rent')?.checked ?? true;

  // Appendix B exact math:
  // Item 3: Hull turnaround (£90k CapEx -> +£26k/yr at 50% reduction)
  const hullSavings = Math.round(26000 * (hullReductionPct / 50.0));
  const hullCapex = hullReductionPct > 0 ? 90000 : 0;

  // Item 5: Delivery repricing (£1.50 fee on sub-£8 orders + move 50% Dashly to RushEats -> £10k CapEx, +£33k/yr)
  const commSavings = Math.round(18000 * ((33.0 - commRatePct) / 1.5));
  const feeGain = Math.round(15000 * (deliveryFee / 1.50));
  const delivTotal = commSavings + feeGain;
  const delivCapex = (commRatePct < 33.0 || deliveryFee > 0) ? 10000 : 0;

  // Items 1, 2, 4: App Fix (£200k -> +£67k), Manch. Lunch (£120k -> +£27k), Drop 40p Oat Fee (£100k -> +£23k) = £420k CapEx, +£117k/yr
  const appOatLunchGain = appOatLunchOn ? 117000 : 0;
  const appOatLunchCapex = appOatLunchOn ? 420000 : 0;

  // Items 6 & 7: Piccadilly Rent Cut 33%->25% (£30k -> +£88k/yr) + Weekly Profit Tool (£40k) = £70k CapEx, +£88k/yr
  const rentGain = piccadillyRentOn ? 88000 : 0;
  const rentToolCapex = piccadillyRentOn ? 70000 : 40000;

  document.getElementById('ceo-hull-label').textContent = `-${hullReductionPct}% (+£${Math.round(hullSavings / 1000)}k/yr)`;
  document.getElementById('ceo-comm-label').textContent = `${commRatePct.toFixed(1)}% (+£${Math.round(commSavings / 1000)}k)`;
  document.getElementById('ceo-fee-label').textContent = `£${deliveryFee.toFixed(2)} (+£${Math.round(feeGain / 1000)}k)`;

  // Item 8: Selected Candidate Sites Profit & CapEx (Default CS5 Liverpool Bold St: £450k CapEx, +£91k/yr)
  const selectedSites = candidateSitesData.filter(s => s.selected);
  const sitesProfit = selectedSites.reduce((acc, s) => acc + s.annualNetProfit, 0);
  const sitesCapex = selectedSites.reduce((acc, s) => acc + s.setupCapex, 0);

  // Total Uplift (+£355k/yr in Recommended Plan) & Active Spend (£1.04m + £460k Reserve = £1.50m)
  const opsUplift = hullSavings + delivTotal + appOatLunchGain + rentGain;
  const totalUplift = opsUplift + sitesProfit;
  const projectedNetProfit = BASELINE_CHAIN_NET_PROFIT + totalUplift;

  const activeSpend = hullCapex + delivCapex + appOatLunchCapex + rentToolCapex + sitesCapex;
  const reserveLeft = Math.max(0, BASELINE_CAPITAL_OUTLAY - activeSpend);

  const opsBadge = document.getElementById('ceo-ops-uplift-badge');
  if (opsBadge) opsBadge.textContent = `+£${Math.round(opsUplift / 1000)}k/yr`;

  // Payback on Active Spend (Appendix B: £1.04m / £355k = 2.93 yrs -> 2.9 yrs; without £88k rent cut: £1.04m / £267k = 3.90 yrs -> 3.9 yrs)
  const paybackYears = totalUplift > 0 ? (activeSpend / totalUplift) : (BASELINE_CAPITAL_OUTLAY / BASELINE_CHAIN_NET_PROFIT);
  const upliftNoRent = totalUplift - rentGain;
  const paybackNoRent = upliftNoRent > 0 ? (activeSpend / upliftNoRent) : 0;

  document.getElementById('ceo-net-profit').textContent = `£${Math.round(projectedNetProfit).toLocaleString()}`;
  const deltaEl = document.getElementById('ceo-profit-delta');
  const subProfitEl = document.getElementById('ceo-profit-sub');
  if (Math.abs(totalUplift) < 100) {
    deltaEl.textContent = '(Baseline £922k)';
    deltaEl.className = 'text-xs font-mono text-zinc-400';
    if (subProfitEl) subProfitEl.textContent = 'No turnaround levers active';
  } else {
    const sign = totalUplift >= 0 ? '+' : '-';
    deltaEl.textContent = `${sign}£${Math.round(Math.abs(totalUplift) / 1000)}k/yr`;
    deltaEl.className = totalUplift >= 0 ? 'text-xs font-mono text-emerald-600 font-medium' : 'text-xs font-mono text-rose-600 font-medium';
    if (subProfitEl) subProfitEl.textContent = `Baseline £922k + £${Math.round(totalUplift / 1000)}k annual uplift`;
  }

  document.getElementById('ceo-capex-total').textContent = `£${Math.round(activeSpend).toLocaleString()}`;
  document.getElementById('ceo-capex-note').textContent = reserveLeft > 0
    ? `+ £${Math.round(reserveLeft / 1000)}k Reserve`
    : '£0 Reserve (Over £1.5m)';
  const subCapexEl = document.getElementById('ceo-capex-sub');
  if (subCapexEl) {
    subCapexEl.textContent = `£${Math.round((hullCapex + delivCapex + appOatLunchCapex) / 1000)}k Fixes • £${Math.round(rentToolCapex / 1000)}k Rent/Tool • £${Math.round(sitesCapex / 1000)}k New Store`;
  }

  document.getElementById('ceo-payback-years').textContent = totalUplift > 0 ? `${paybackYears.toFixed(1)} yrs` : 'N/A';
  document.getElementById('ceo-payback-months').textContent = (totalUplift > 0 && piccadillyRentOn && paybackNoRent > 0)
    ? `(${paybackNoRent.toFixed(1)} yrs no rent cut)`
    : `(${(paybackYears * 12).toFixed(0)} mos)`;
  const subPaybackEl = document.getElementById('ceo-payback-sub');
  if (subPaybackEl) {
    subPaybackEl.textContent = totalUplift > 0
      ? `£${(activeSpend / 1000000).toFixed(2)}m spend ÷ +£${Math.round(totalUplift / 1000)}k/yr uplift`
      : 'Move sliders or click Apply Recommended £1.5m Plan';
  }

  // Also reflect Hull write-off reduction live in the Store P&L table row for Hull Paragon (S10)!
  const hullStore = storesData.find(s => s.id === 'S10' || s.id === 'HUL-01');
  if (hullStore) {
    const baseHullWeeklyWaste = 313.51;
    hullStore.wasteCost = Math.round(baseHullWeeklyWaste * (1 - hullReductionPct / 100.0));
    const weeklySaved = hullSavings / 52.0;
    hullStore.opMargin = Number((6.1 + (weeklySaved / hullStore.sales) * 100).toFixed(1));
    if (hullStore.opMargin >= 8.0 && hullStore.laborPct <= 35.0) {
      hullStore.status = 'healthy';
      hullStore.breachReason = 'Healthy';
    } else {
      hullStore.status = 'breach';
      hullStore.breachReason = `Low Margin (${hullStore.opMargin.toFixed(1)}%)`;
    }
    renderStoreTable();
  }

  if (ceoBridgeChartInstance) {
    ceoBridgeChartInstance.data.datasets[0].data = [
      Math.round(BASELINE_CHAIN_NET_PROFIT / 1000),
      Math.round(appOatLunchGain / 1000),
      Math.round((hullSavings + delivTotal) / 1000),
      Math.round(rentGain / 1000),
      Math.round(sitesProfit / 1000),
      Math.round(projectedNetProfit / 1000)
    ];
    ceoBridgeChartInstance.update();
  }
}

function initCeoBridgeChart() {
  const canvas = document.getElementById('ceoBridgeChart');
  if (!canvas) return;
  ceoBridgeChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Baseline (£922k)', '+ App/Lunch/Oat', '+ Hull & Deliv', '+ S07 Rent Cut', '+ New Store', 'Projected (£1,277k)'],
      datasets: [{
        data: [922, 117, 59, 88, 91, 1277],
        backgroundColor: ['#71717a', '#10b981', '#10b981', '#10b981', '#10b981', '#18181b'],
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { display: false } },
        y: {
          ticks: { color: '#71717a', font: { size: 10 }, callback: v => `£${v}k` },
          grid: { color: '#f4f4f5' }
        }
      }
    }
  });
}

async function applyRecommendedPlan() {
  document.getElementById('ceo-hull-slider').value = 50;
  document.getElementById('ceo-comm-slider').value = 31.5;
  document.getElementById('ceo-fee-slider').value = 1.5;
  if (document.getElementById('chk-app-oat-lunch')) document.getElementById('chk-app-oat-lunch').checked = true;
  if (document.getElementById('chk-piccadilly-rent')) document.getElementById('chk-piccadilly-rent').checked = true;

  for (const site of candidateSitesData) {
    const shouldSelect = (site.siteCode === 'CS5');
    if (site.selected !== shouldSelect) {
      await fetch('/api/candidate-site/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: site.id })
      });
    }
  }
  await fetchDashboardState();
}

async function resetCeoDecisionSim() {
  document.getElementById('ceo-hull-slider').value = 0;
  document.getElementById('ceo-comm-slider').value = 33;
  document.getElementById('ceo-fee-slider').value = 0;
  if (document.getElementById('chk-app-oat-lunch')) document.getElementById('chk-app-oat-lunch').checked = false;
  if (document.getElementById('chk-piccadilly-rent')) document.getElementById('chk-piccadilly-rent').checked = false;

  for (const site of candidateSitesData) {
    if (site.selected) {
      await fetch('/api/candidate-site/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ site_id: site.id })
      });
    }
  }
  await fetchDashboardState();
}

// --- TAB 2: DELIVERY SIMULATOR ---
function calculateOrderEconomics(baseBasket, markupPct, cogsPct) {
  const grossMenuPrice = baseBasket * (1 + markupPct / 100);
  const cogs = baseBasket * (cogsPct / 100);
  const dashlyFee = grossMenuPrice * 0.33;
  const netProfit = grossMenuPrice - cogs - dashlyFee - 0.45 - 0.96;
  const marginPct = (netProfit / grossMenuPrice) * 100;
  return { grossMenuPrice, netProfit, marginPct };
}

function updateDeliverySim() {
  const mov = parseFloat(document.getElementById('slider-mov').value);
  const markup = parseFloat(document.getElementById('slider-markup').value);
  const cogsPct = parseFloat(document.getElementById('slider-cogs').value);

  document.getElementById('label-mov').textContent = `£${mov.toFixed(2)}`;
  document.getElementById('label-markup').textContent = `+${markup}%`;
  document.getElementById('label-cogs').textContent = `${cogsPct}%`;

  const econ = calculateOrderEconomics(mov, markup, cogsPct);
  const netEl = document.getElementById('wf-net');
  const badge = document.getElementById('sim-verdict-badge');
  const sign = econ.netProfit >= 0 ? '+' : '-';

  netEl.textContent = `${sign}£${Math.abs(econ.netProfit).toFixed(2)}`;
  netEl.className = econ.netProfit >= 0
    ? 'text-xl font-mono font-semibold mt-0.5 text-emerald-600'
    : 'text-xl font-mono font-semibold mt-0.5 text-rose-600';

  badge.textContent = `${econ.marginPct.toFixed(1)}% Margin`;
  badge.className = econ.netProfit >= 0
    ? 'text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700'
    : 'text-xs font-mono px-2.5 py-1 rounded-md bg-rose-50 text-rose-700';

  if (deliveryChartInstance) {
    const baskets = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18];
    const profits = baskets.map(b => Number(calculateOrderEconomics(b, markup, cogsPct).netProfit.toFixed(2)));
    const colors = baskets.map((b, i) => {
      if (b < mov) return '#e4e4e7';
      return profits[i] >= 0 ? '#18181b' : '#f43f5e';
    });
    deliveryChartInstance.data.datasets[0].data = profits;
    deliveryChartInstance.data.datasets[0].backgroundColor = colors;
    deliveryChartInstance.update();
  }
}

function applyPreset(preset) {
  if (preset === 'current') {
    document.getElementById('slider-mov').value = 5.0;
    document.getElementById('slider-markup').value = 0;
    document.getElementById('slider-cogs').value = 28;
  } else {
    document.getElementById('slider-mov').value = 11.5;
    document.getElementById('slider-markup').value = 15;
    document.getElementById('slider-cogs').value = 28;
  }
  updateDeliverySim();
}

async function pushDeliveryPolicyToStores() {
  const payload = {
    mov: parseFloat(document.getElementById('slider-mov').value),
    markup_pct: parseFloat(document.getElementById('slider-markup').value),
    cogs_pct: parseFloat(document.getElementById('slider-cogs').value),
    bundle_only: false
  };
  await fetch('/api/delivery-policy/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await fetchDashboardState();
  showToast('Policy Applied', `Updated stores with £${payload.mov.toFixed(2)} MOV & +${payload.markup_pct}% markup.`);
}

function initDeliveryChart() {
  const ctx = document.getElementById('deliveryChart').getContext('2d');
  const baskets = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18];
  deliveryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: baskets.map(b => `£${b}`),
      datasets: [{
        data: baskets.map(b => Number(calculateOrderEconomics(b, 0, 28).netProfit.toFixed(2))),
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 11 } }, grid: { display: false } },
        y: {
          ticks: { color: '#71717a', font: { size: 11 }, callback: v => (v >= 0 ? '+£' : '-£') + Math.abs(v).toFixed(2) },
          grid: { color: '#f4f4f5' }
        }
      }
    }
  });
}

// --- TAB 3: WASTE PREDICTOR ---
async function setWeatherScenario(weatherKey) {
  currentWeather = weatherKey;
  ['rain', 'cloudy', 'sunny'].forEach(k => {
    const btn = document.getElementById(`weather-${k}`);
    btn.className = k === weatherKey
      ? 'px-3 py-1 rounded-md bg-white text-zinc-900 font-medium shadow-2xs cursor-pointer'
      : 'px-3 py-1 rounded-md text-zinc-600 cursor-pointer';
  });
  await fetchDashboardState();
}

function renderWasteModule(weatherLabel) {
  if (weatherLabel) {
    document.getElementById('waste-banner-weather').textContent = weatherLabel.replace('• ', '');
  }

  const container = document.getElementById('waste-sku-list');
  container.innerHTML = wastePredictorSkus.map(sku => `
    <div class="p-4 rounded-xl border ${sku.rescued ? 'border-emerald-200 bg-emerald-50/20' : 'border-zinc-200'} flex items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2.5">
          <span class="font-medium text-sm text-zinc-900">${sku.name}</span>
          <span class="text-xs font-mono px-2 py-0.5 rounded-md ${sku.rescued ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700'}">
            ${sku.rescued ? 'Rescued' : `${sku.predictedSurplus} surplus predicted`}
          </span>
        </div>
        <p class="text-xs text-zinc-500 mt-1">2PM Stock: ${sku.stockAt2PM} &bull; ${sku.protocol}</p>
      </div>

      <button onclick="toggleSkuRescue(${sku.id})" class="px-3.5 py-2 rounded-lg text-xs font-medium shrink-0 cursor-pointer ${
        sku.rescued ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-900 hover:bg-zinc-800 text-white'
      }">
        ${sku.rescued ? `✓ Saved £${sku.potentialRecovery.toFixed(0)}` : `${sku.channel} (+£${sku.potentialRecovery.toFixed(0)})`}
      </button>
    </div>
  `).join('');

  if (wasteSurplusChartInstance && wastePredictorSkus.length) {
    wasteSurplusChartInstance.data.labels = wastePredictorSkus.map(s => s.storeCode || s.name.slice(0, 12));
    wasteSurplusChartInstance.data.datasets[0].data = wastePredictorSkus.map(s => s.expectedSales);
    wasteSurplusChartInstance.data.datasets[1].data = wastePredictorSkus.map(s => s.rescued ? 0 : s.predictedSurplus);
    wasteSurplusChartInstance.update();
  }
}

function initWasteCharts() {
  const surplusCanvas = document.getElementById('wasteSurplusChart');
  if (surplusCanvas) {
    wasteSurplusChartInstance = new Chart(surplusCanvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Expected Afternoon Sales',
            data: [],
            backgroundColor: '#18181b',
            borderRadius: 4
          },
          {
            label: 'Predicted Unsold Surplus',
            data: [],
            backgroundColor: '#f43f5e',
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: { boxWidth: 10, font: { size: 10 }, color: '#52525b' }
          }
        },
        scales: {
          x: { ticks: { color: '#71717a', font: { size: 10, family: 'JetBrains Mono' } }, grid: { display: false } },
          y: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { color: '#f4f4f5' } }
        }
      }
    });
  }

  const catCanvas = document.getElementById('wasteCategoryChart');
  if (catCanvas) {
    // Exact annual waste by category from waste_log.csv: Lunch £68,162, Bakery £52,367, Breakfast £13,286
    wasteCategoryChartInstance = new Chart(catCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Lunch (£68.2k)', 'Bakery (£52.4k)', 'Breakfast (£13.3k)'],
        datasets: [{
          data: [68162, 52367, 13286],
          backgroundColor: ['#f43f5e', '#18181b', '#a1a1aa'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: { boxWidth: 10, font: { size: 11 }, color: '#3f3f46' }
          }
        }
      }
    });
  }
}

async function toggleSkuRescue(skuId) {
  await fetch('/api/waste-rescue/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku_id: skuId })
  });
  await fetchDashboardState();
}

async function executeAllWasteActions() {
  await fetch('/api/waste-rescue/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rescue_all: true })
  });
  await fetchDashboardState();
  showToast('All Surplus Rescued', '50% Loyalty App & Too Good To Go discounts pushed.');
}

async function submitNewSurplusSku(e) {
  e.preventDefault();
  const payload = {
    new_sku_name: document.getElementById('new-sku-name').value,
    stock_at_2pm: document.getElementById('new-sku-stock').value,
    baseline_sales: document.getElementById('new-sku-sales').value,
    rescue_channel: '50% Loyalty App Push'
  };
  await fetch('/api/waste-rescue/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  document.getElementById('new-sku-name').value = '';
  document.getElementById('new-sku-stock').value = '';
  document.getElementById('new-sku-sales').value = '';
  await fetchDashboardState();
  showToast('2PM Item Added', `Predicted EOD surplus for ${payload.new_sku_name}.`);
}

// --- MODALS & CSV UPLOAD ---
function openStockroomModal() {
  document.getElementById('stockroom-modal').classList.remove('hidden');
}

function closeStockroomModal() {
  document.getElementById('stockroom-modal').classList.add('hidden');
}

function openCsvModal() {
  document.getElementById('csv-modal').classList.remove('hidden');
}

function closeCsvModal() {
  document.getElementById('csv-modal').classList.add('hidden');
}

async function submitStockroomLog() {
  const payload = {
    store_code: document.getElementById('modal-store').value,
    added_sales: document.getElementById('modal-sales').value || 0,
    rota_hours_delta: document.getElementById('modal-labor').value || 0,
    waste_units: document.getElementById('modal-waste').value || 0,
    panini_stock_2pm: document.getElementById('modal-panini').value
  };
  await fetch('/api/store-log/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  closeStockroomModal();
  await fetchDashboardState();
  showToast('Data Saved', `Updated ${payload.store_code} in database.`);
}

async function submitCsvUpload() {
  const fileInput = document.getElementById('csv-file-input');
  const mode = document.getElementById('csv-import-mode').value;
  if (!fileInput.files || fileInput.files.length === 0) return;

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('mode', mode);

  const res = await fetch('/api/upload-csv/', { method: 'POST', body: formData });
  const result = await res.json();
  if (res.ok) {
    closeCsvModal();
    fileInput.value = '';
    await fetchDashboardState();
    switchTab(result.type === 'waste_predictor' ? 'module3' : 'module1');
    showToast('CSV Uploaded', `Imported ${result.rowsProcessed} rows from ${result.filename}.`);
  }
}

async function resetDemoDatabase() {
  await fetch('/api/reset/', { method: 'POST' });
  await fetchDashboardState();
  showToast('Reset Complete', 'Restored default store data.');
}

function showToast(title, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'p-3.5 rounded-xl bg-zinc-900 text-white shadow-lg text-xs pointer-events-auto';
  toast.innerHTML = `<div class="font-medium">${title}</div><div class="text-zinc-400 mt-0.5">${message}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
