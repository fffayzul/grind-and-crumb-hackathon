// ============================================================================
// GRIND & CRUMB — CLEAN TAILWIND UI OPERATIONS DASHBOARD
// ============================================================================

const storesData = [
  {
    id: 'MAN-01',
    name: 'Manchester Piccadilly',
    isFlagship: true,
    sales: 34200,
    laborPct: 33.4,
    wasteCost: 490,
    proRataFixed: 6850,
    opMargin: 8.4,
    status: 'breach',
    breachReason: 'Margin < 10%',
    diagnosis: 'High Dashly sub-£8 order volume (£6,420 WTD at -14% net margin) + £490 afternoon panini waste.'
  },
  {
    id: 'LON-02',
    name: 'Camden High Street',
    isFlagship: false,
    sales: 18900,
    laborPct: 38.2,
    wasteCost: 340,
    proRataFixed: 4100,
    opMargin: 6.1,
    status: 'breach',
    breachReason: 'Labor > 35%',
    diagnosis: 'Over-rostered afternoon baristas (+28 hrs vs footfall) + 1.13x employer on-cost pushing labor to 38.2%.'
  },
  {
    id: 'LON-03',
    name: 'Shoreditch Boxpark',
    isFlagship: false,
    sales: 21400,
    laborPct: 36.4,
    wasteCost: 385,
    proRataFixed: 4350,
    opMargin: 9.2,
    status: 'breach',
    breachReason: 'Labor > 35%',
    diagnosis: 'Mid-week rainstorm cut afternoon walk-ins by 29% while full 6-person shift remained clocked in.'
  },
  {
    id: 'LON-01',
    name: 'London Soho',
    isFlagship: true,
    sales: 38900,
    laborPct: 29.8,
    wasteCost: 310,
    proRataFixed: 7400,
    opMargin: 16.4,
    status: 'healthy',
    breachReason: 'Healthy',
    diagnosis: 'Enforced £11 Dashly bundle-only rule in pilot; 2:00 PM waste AI rescued 82% of afternoon surplus.'
  },
  {
    id: 'BIR-01',
    name: 'Birmingham New St',
    isFlagship: true,
    sales: 26800,
    laborPct: 31.2,
    wasteCost: 295,
    proRataFixed: 5100,
    opMargin: 13.8,
    status: 'healthy',
    breachReason: 'Healthy',
    diagnosis: 'Strong commuter velocity. Afternoon pastry surplus routed to Too Good To Go at 14:30.'
  },
  {
    id: 'LDS-01',
    name: 'Leeds Trinity',
    isFlagship: false,
    sales: 19600,
    laborPct: 30.5,
    wasteCost: 240,
    proRataFixed: 3800,
    opMargin: 14.2,
    status: 'healthy',
    breachReason: 'Healthy',
    diagnosis: 'Strong lunch panini attach rate; labor rota tightly aligned to hourly POS transactions.'
  },
  {
    id: 'EDI-01',
    name: 'Edinburgh Waverley',
    isFlagship: false,
    sales: 18450,
    laborPct: 28.9,
    wasteCost: 265,
    proRataFixed: 3650,
    opMargin: 15.1,
    status: 'healthy',
    breachReason: 'Healthy',
    diagnosis: 'Low waste footprint; tourist + commuter mix sustains afternoon tea/cake sales.'
  },
  {
    id: 'BRI-01',
    name: 'Bristol Harbourside',
    isFlagship: false,
    sales: 16400,
    laborPct: 32.1,
    wasteCost: 240,
    proRataFixed: 3200,
    opMargin: 12.6,
    status: 'healthy',
    breachReason: 'Healthy',
    diagnosis: 'Within all guardrails. Labor at 32.1% (2.9% buffer below 35% threshold).'
  }
];

let currentStoreFilter = 'all';
let selectedStoreId = 'MAN-01';

const wsAlerts = [
  {
    time: '14:29',
    type: 'critical',
    store: 'Manchester Piccadilly',
    msg: 'Op Margin dropped to 8.4% (<10% rule). Sub-£8 Dashly orders losing -£0.68/bag.'
  },
  {
    time: '14:15',
    type: 'warning',
    store: 'Camden High Street',
    msg: 'WTD Labor reached 38.2% of revenue (>35% rule).'
  },
  {
    time: '14:00',
    type: 'info',
    store: 'Celery Beat (2:00 PM)',
    msg: 'Rain radar detected. 40 Paninis & 28 Croissants flagged for 2:30 PM push.'
  }
];

const weatherScenarios = {
  rain: {
    label: '• Heavy Rain 15:00–18:00 (-38% Footfall)',
    headline: '40 Unsold Artisan Paninis & 28 Croissants Predicted at 20:00 Close',
    subheadline: 'Lunch velocity slowed 19% at 13:45. Heavy rain cuts commuter footfall by 38%. Trigger one-click rescue protocols before 20:00 legal waste logging.',
    hourlyActual: [42, 118, 164, 145, 198, 230, 175, 92],
    hourlyBaseline: [40, 115, 160, 140, 205, 240, 210, 130, 115, 105, 95, 78, 45],
    hourlyPredicted: [null, null, null, null, null, null, null, 92, 68, 54, 48, 39, 22],
    hourlyRescued: [null, null, null, null, null, null, null, 92, 108, 98, 88, 72, 42],
    skus: [
      {
        id: 'sku-panini',
        name: 'Mozzarella, Pesto & Tomato Panini',
        category: 'Hot Savory • Discard 20:00',
        stockAt2PM: 62,
        predictedSurplus: 40,
        unitCogs: 1.95,
        protocol: '50% Off Flash Deal on Loyalty App',
        channel: '50% Loyalty App Push',
        recoveredPerUnit: 2.98,
        rescued: false
      },
      {
        id: 'sku-croissant',
        name: 'All-Butter Almond Croissants',
        category: 'Bakery • Discard 20:00',
        stockAt2PM: 45,
        predictedSurplus: 28,
        unitCogs: 0.92,
        protocol: 'Release 7x Too Good To Go Magic Bags',
        channel: 'Too Good To Go API',
        recoveredPerUnit: 1.00,
        rescued: false
      },
      {
        id: 'sku-wrap',
        name: 'Chipotle Chicken & Avocado Wrap',
        category: 'Chilled • Use-by Midnight',
        stockAt2PM: 29,
        predictedSurplus: 18,
        unitCogs: 1.80,
        protocol: 'In-Store POS "+£2.00 Bundle Add-on"',
        channel: 'POS Till Prompt',
        recoveredPerUnit: 2.00,
        rescued: false
      }
    ]
  },
  cloudy: {
    label: '• Overcast 15:00–18:00 (-12% Footfall)',
    headline: '18 Unsold Paninis & 14 Pastries Predicted at 20:00 Close',
    subheadline: 'Afternoon walk-ins tracking 12% below 4-week rolling average. Proactive bundle upsell recommended.',
    hourlyActual: [42, 118, 164, 145, 198, 230, 195, 115],
    hourlyBaseline: [40, 115, 160, 140, 205, 240, 210, 130, 115, 105, 95, 78, 45],
    hourlyPredicted: [null, null, null, null, null, null, null, 115, 98, 88, 79, 64, 36],
    hourlyRescued: [null, null, null, null, null, null, null, 115, 112, 102, 92, 75, 43],
    skus: [
      {
        id: 'sku-panini',
        name: 'Mozzarella, Pesto & Tomato Panini',
        category: 'Hot Savory • Discard 20:00',
        stockAt2PM: 54,
        predictedSurplus: 18,
        unitCogs: 1.95,
        protocol: '40% Off Afternoon Treat on Loyalty App',
        channel: 'Loyalty App Push',
        recoveredPerUnit: 3.57,
        rescued: false
      },
      {
        id: 'sku-croissant',
        name: 'All-Butter Almond Croissants',
        category: 'Bakery • Discard 20:00',
        stockAt2PM: 38,
        predictedSurplus: 14,
        unitCogs: 0.92,
        protocol: 'Release 4x Too Good To Go Magic Bags',
        channel: 'Too Good To Go API',
        recoveredPerUnit: 1.00,
        rescued: false
      }
    ]
  },
  sunny: {
    label: '• Clear Sunny Afternoon (+5% Footfall)',
    headline: 'Low Risk: Only 4 Paninis Flagged for Evening Rotation',
    subheadline: 'Sunny afternoon weather boosting walk-in iced drinks and grab-and-go sales by +5% above baseline.',
    hourlyActual: [44, 122, 168, 152, 210, 245, 218, 136],
    hourlyBaseline: [40, 115, 160, 140, 205, 240, 210, 130, 115, 105, 95, 78, 45],
    hourlyPredicted: [null, null, null, null, null, null, null, 136, 122, 112, 100, 82, 48],
    hourlyRescued: [null, null, null, null, null, null, null, 136, 126, 116, 104, 85, 50],
    skus: [
      {
        id: 'sku-panini',
        name: 'Mozzarella, Pesto & Tomato Panini',
        category: 'Hot Savory • Discard 20:00',
        stockAt2PM: 48,
        predictedSurplus: 4,
        unitCogs: 1.95,
        protocol: 'Standard Barista Upsell at 18:00',
        channel: 'In-Store Upsell',
        recoveredPerUnit: 4.50,
        rescued: false
      }
    ]
  }
};

let currentWeather = 'rain';
let plChartInstance = null;
let deliveryChartInstance = null;
let wasteChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  renderStoreTable();
  renderWsFeed();
  initPlChart();
  initDeliveryChart();
  updateDeliverySim();
  renderWasteModule();
  initWasteChart();
});

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-tab').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.add('text-zinc-500');
  });

  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.remove('text-zinc-500');
  }

  if (tabId === 'module1' && plChartInstance) plChartInstance.resize();
  if (tabId === 'module2' && deliveryChartInstance) deliveryChartInstance.resize();
  if (tabId === 'module3' && wasteChartInstance) wasteChartInstance.resize();
}

function setPersona(persona) {
  const ceoBtn = document.getElementById('persona-ceo');
  const mgrBtn = document.getElementById('persona-manager');

  if (persona === 'ceo') {
    ceoBtn.className = 'px-2.5 py-1 rounded bg-white text-zinc-900 shadow-xs font-medium transition-all';
    mgrBtn.className = 'px-2.5 py-1 rounded text-zinc-500 hover:text-zinc-900 font-medium transition-all';
    switchTab('module1');
    showToast('CEO Mobile View', 'Showing Executive P&L and real-time threshold breaches.');
  } else {
    mgrBtn.className = 'px-2.5 py-1 rounded bg-white text-zinc-900 shadow-xs font-medium transition-all';
    ceoBtn.className = 'px-2.5 py-1 rounded text-zinc-500 hover:text-zinc-900 font-medium transition-all';
    switchTab('module3');
    showToast('Store Manager iPad View', 'Switched to 2:30 PM Dynamic Waste Predictor.');
  }
}

// --- MODULE 1 ---
function renderStoreTable() {
  const tbody = document.getElementById('store-pl-tbody');
  const filtered = storesData.filter(s => currentStoreFilter === 'all' ? true : s.status === currentStoreFilter);

  tbody.innerHTML = filtered.map(store => {
    const isSelected = store.id === selectedStoreId;
    const laborClass = store.laborPct > 35.0 ? 'text-rose-600 font-semibold' : 'text-zinc-700';
    const marginClass = (store.isFlagship && store.opMargin < 10.0) || store.opMargin < 8.0
      ? 'text-rose-600 font-semibold'
      : 'text-emerald-600 font-medium';

    const statusBadge = store.status === 'breach'
      ? `<span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-medium bg-rose-50 text-rose-700 border border-rose-200 rounded">${store.breachReason}</span>`
      : `<span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">OK</span>`;

    return `
      <tr onclick="selectStore('${store.id}')" class="store-row ${isSelected ? 'selected-row' : ''}">
        <td class="py-2.5 px-4">
          <div class="flex items-center gap-1.5">
            <span class="font-medium text-zinc-900">${store.name}</span>
            ${store.isFlagship ? '<span class="text-[10px] font-mono text-zinc-400">(Flagship)</span>' : ''}
          </div>
        </td>
        <td class="py-2.5 px-3 text-right font-mono text-zinc-700">£${store.sales.toLocaleString()}</td>
        <td class="py-2.5 px-3 text-right font-mono ${laborClass}">${store.laborPct.toFixed(1)}%</td>
        <td class="py-2.5 px-3 text-right font-mono text-zinc-600">£${store.wasteCost}</td>
        <td class="py-2.5 px-3 text-right font-mono text-zinc-500">£${store.proRataFixed.toLocaleString()}</td>
        <td class="py-2.5 px-3 text-right font-mono ${marginClass}">${store.opMargin.toFixed(1)}%</td>
        <td class="py-2.5 px-4 text-right">${statusBadge}</td>
      </tr>
    `;
  }).join('');

  const store = storesData.find(s => s.id === selectedStoreId) || storesData[0];
  document.getElementById('drill-store-name').textContent = store.name;
  const badge = document.getElementById('drill-store-badge');
  badge.textContent = store.breachReason;
  badge.className = store.status === 'breach'
    ? 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-700'
    : 'text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700';
  document.getElementById('drill-store-diagnosis').textContent = store.diagnosis;
}

function selectStore(id) {
  selectedStoreId = id;
  renderStoreTable();
}

function filterStores(filter) {
  currentStoreFilter = filter;
  ['all', 'breach', 'healthy'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    btn.className = f === filter
      ? 'px-2 py-0.5 rounded bg-white text-zinc-900 font-medium shadow-2xs'
      : 'px-2 py-0.5 rounded text-zinc-600 hover:text-zinc-900';
  });
  renderStoreTable();
}

function renderWsFeed() {
  const list = document.getElementById('ws-feed-list');
  list.innerHTML = wsAlerts.map(item => `
    <div class="p-2.5 rounded-md bg-zinc-50 border border-zinc-200/70 text-xs">
      <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-0.5">
        <span class="font-medium text-zinc-700">${item.store}</span>
        <span>${item.time}</span>
      </div>
      <p class="text-zinc-600 leading-snug">${item.msg}</p>
    </div>
  `).join('');
}

function triggerWebSocketAlert() {
  const now = new Date().toTimeString().slice(0, 5);
  const msg = 'Margin dipped to 8.1% after 14 solo-latte Dashly orders.';
  wsAlerts.unshift({ time: now, type: 'critical', store: 'Manchester Piccadilly', msg });
  renderWsFeed();
  showToast('WebSocket Alert Received', `Manchester Piccadilly: ${msg}`);
}

function runCeleryAggregation() {
  const icon = document.getElementById('celery-spin-icon');
  const status = document.getElementById('sidebar-celery-status');
  icon.classList.add('animate-spin');
  status.textContent = 'Running...';

  setTimeout(() => {
    icon.classList.remove('animate-spin');
    status.textContent = 'Synced 138ms';
    showToast('Celery P&L Aggregation Complete', 'Joined 214,892 PostgreSQL rows across sales, rota, waste & monthly fixed costs.');
  }, 700);
}

function initPlChart() {
  const ctx = document.getElementById('plChart').getContext('2d');
  plChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: storesData.map(s => s.name.split(' ')[0]),
      datasets: [
        {
          label: 'Labor %',
          data: storesData.map(s => s.laborPct),
          backgroundColor: storesData.map(s => s.laborPct > 35 ? '#f43f5e' : '#d4d4d8'),
          borderRadius: 3
        },
        {
          label: 'Op Margin %',
          data: storesData.map(s => s.opMargin),
          backgroundColor: storesData.map(s => s.opMargin < 10 ? '#fda4af' : '#18181b'),
          borderRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#71717a', boxWidth: 10, font: { family: 'Inter', size: 10 } } }
      },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#71717a', font: { size: 10 }, callback: v => v + '%' }, grid: { color: '#f4f4f5' } }
      }
    }
  });
}

// --- MODULE 2: DELIVERY SIMULATOR ---
const DASHLY_COMMISSION_RATE = 0.33;
const FIXED_PACKAGING_COST = 0.45;
const FIXED_LABOR_COST = 0.96;

function calculateOrderEconomics(baseBasket, markupPct, cogsPct) {
  const grossMenuPrice = baseBasket * (1 + markupPct / 100);
  const cogs = baseBasket * (cogsPct / 100);
  const dashlyFee = grossMenuPrice * DASHLY_COMMISSION_RATE;
  const netProfit = grossMenuPrice - cogs - dashlyFee - FIXED_PACKAGING_COST - FIXED_LABOR_COST;
  const marginPct = (netProfit / grossMenuPrice) * 100;
  return { grossMenuPrice, cogs, dashlyFee, netProfit, marginPct };
}

function updateDeliverySim() {
  const mov = parseFloat(document.getElementById('slider-mov').value);
  const markup = parseFloat(document.getElementById('slider-markup').value);
  const cogsPct = parseFloat(document.getElementById('slider-cogs').value);

  document.getElementById('label-mov').textContent = `£${mov.toFixed(2)}`;
  document.getElementById('label-markup').textContent = `+${markup}%`;
  document.getElementById('label-cogs').textContent = `${cogsPct}%`;

  const econ = calculateOrderEconomics(mov, markup, cogsPct);

  document.getElementById('wf-gross').textContent = `£${econ.grossMenuPrice.toFixed(2)}`;
  document.getElementById('wf-markup-note').textContent = markup > 0 ? `+${markup}% markup` : 'In-store parity';
  document.getElementById('wf-cogs').textContent = `-£${econ.cogs.toFixed(2)}`;
  document.getElementById('wf-dashly').textContent = `-£${econ.dashlyFee.toFixed(2)}`;

  const netEl = document.getElementById('wf-net');
  const marginEl = document.getElementById('wf-margin-pct');
  const netCard = document.getElementById('wf-net-card');
  const verdictBadge = document.getElementById('sim-verdict-badge');

  const sign = econ.netProfit >= 0 ? '+' : '-';
  netEl.textContent = `${sign}£${Math.abs(econ.netProfit).toFixed(2)}`;
  marginEl.textContent = `${econ.marginPct.toFixed(1)}% margin`;

  if (econ.netProfit < 0) {
    netCard.className = 'p-2.5 rounded-md bg-rose-50 border border-rose-200';
    netEl.className = 'text-sm font-mono font-semibold text-rose-600 mt-0.5';
    marginEl.className = 'text-[10px] font-mono text-rose-600';
    verdictBadge.textContent = `NET LOSS ON £${mov.toFixed(2)} ORDERS`;
    verdictBadge.className = 'text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200';
  } else {
    netCard.className = 'p-2.5 rounded-md bg-emerald-50 border border-emerald-200';
    netEl.className = 'text-sm font-mono font-semibold text-emerald-700 mt-0.5';
    marginEl.className = 'text-[10px] font-mono text-emerald-600';
    verdictBadge.textContent = `PROFITABLE (+${econ.marginPct.toFixed(1)}%)`;
    verdictBadge.className = 'text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200';
  }

  const sub8Econ = calculateOrderEconomics(6.50, 0, cogsPct);
  const annualDelta = Math.round((econ.netProfit - sub8Econ.netProfit) * 4200 * 52);
  document.getElementById('sim-annual-impact').innerHTML =
    `Orders at £6.50 with 0% markup lose <strong class="text-rose-600 font-mono">-£${Math.abs(sub8Econ.netProfit).toFixed(2)}</strong> per order. ` +
    `At <strong class="text-zinc-900 font-mono">£${mov.toFixed(2)} MOV &amp; +${markup}% markup</strong>, net profit is <strong class="${econ.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} font-mono">${sign}£${Math.abs(econ.netProfit).toFixed(2)}/order</strong> ` +
    `(Network impact: <strong class="text-zinc-900 font-mono">+£${Math.max(0, annualDelta).toLocaleString()}/yr</strong>).`;

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
    document.getElementById('toggle-bundle').checked = false;
  } else {
    document.getElementById('slider-mov').value = 11.5;
    document.getElementById('slider-markup').value = 15;
    document.getElementById('slider-cogs').value = 28;
    document.getElementById('toggle-bundle').checked = true;
  }
  updateDeliverySim();
}

function toggleBundleStrategy() {
  if (document.getElementById('toggle-bundle').checked) {
    document.getElementById('slider-mov').value = 12.0;
    document.getElementById('slider-markup').value = 15;
    updateDeliverySim();
  }
}

function pushDeliveryPolicyToStores() {
  const mov = parseFloat(document.getElementById('slider-mov').value);
  const markup = parseFloat(document.getElementById('slider-markup').value);

  if (mov >= 10) {
    const manchester = storesData.find(s => s.id === 'MAN-01');
    manchester.opMargin = 13.6;
    manchester.status = 'healthy';
    manchester.breachReason = 'Healthy';
    manchester.diagnosis = `Deployed £${mov.toFixed(2)} MOV & +${markup}% markup. Operating margin recovered from 8.4% to 13.6%.`;
    document.getElementById('kpi-manchester-margin').textContent = '13.6%';
    document.getElementById('kpi-manchester-margin').className = 'text-xl font-semibold font-mono text-emerald-600';
    renderStoreTable();
    if (plChartInstance) {
      plChartInstance.data.datasets[1].data = storesData.map(s => s.opMargin);
      plChartInstance.update();
    }
  }
  showToast('Policy Deployed to Dashly', `Updated 8 stores with £${mov.toFixed(2)} MOV & +${markup}% delivery markup.`);
}

function initDeliveryChart() {
  const ctx = document.getElementById('deliveryChart').getContext('2d');
  const baskets = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18];
  deliveryChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: baskets.map(b => `£${b}`),
      datasets: [{
        label: 'Net Profit (£)',
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

// --- MODULE 3: WASTE PREDICTOR ---
function setWeatherScenario(weatherKey) {
  currentWeather = weatherKey;
  ['rain', 'cloudy', 'sunny'].forEach(k => {
    const btn = document.getElementById(`weather-${k}`);
    btn.className = k === weatherKey
      ? 'px-2.5 py-1 rounded bg-white text-zinc-900 font-medium shadow-2xs cursor-pointer'
      : 'px-2.5 py-1 rounded text-zinc-600 hover:text-zinc-900 cursor-pointer';
  });
  renderWasteModule();
  updateWasteChart();
}

function renderWasteModule() {
  const scenario = weatherScenarios[currentWeather];
  document.getElementById('waste-banner-weather').textContent = scenario.label;
  document.getElementById('waste-headline').textContent = scenario.headline;
  document.getElementById('waste-subheadline').textContent = scenario.subheadline;

  const container = document.getElementById('waste-sku-list');
  const rescuedCount = scenario.skus.filter(s => s.rescued).length;
  document.getElementById('rescued-counter-badge').textContent = `${rescuedCount} / ${scenario.skus.length} Rescued`;

  let deadLossTotal = 0;
  let recoveredTotal = 0;

  container.innerHTML = scenario.skus.map(sku => {
    const deadCogs = sku.predictedSurplus * sku.unitCogs;
    const potentialRecovery = sku.predictedSurplus * sku.recoveredPerUnit;

    if (sku.rescued) recoveredTotal += potentialRecovery;
    else deadLossTotal += deadCogs;

    return `
      <div class="p-4 rounded-lg bg-white border ${sku.rescued ? 'border-emerald-300 bg-emerald-50/20' : 'border-zinc-200/90'} shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-zinc-900">${sku.name}</span>
            <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${sku.rescued ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
              ${sku.rescued ? 'Rescued' : `${sku.predictedSurplus} surplus`}
            </span>
          </div>
          <p class="text-xs text-zinc-500">${sku.protocol}</p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right font-mono text-xs">
            <div class="text-[10px] text-zinc-400">2PM Stock: ${sku.stockAt2PM}</div>
            <div class="${sku.rescued ? 'text-emerald-600 font-medium' : 'text-rose-600'}">
              ${sku.rescued ? `+£${potentialRecovery.toFixed(2)} saved` : `-£${deadCogs.toFixed(2)} risk`}
            </div>
          </div>
          <button onclick="toggleSkuRescue('${sku.id}')" class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            sku.rescued
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-zinc-900 hover:bg-zinc-800 text-white'
          }">
            ${sku.rescued ? '✓ Active' : sku.channel}
          </button>
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('waste-stat-dead').textContent = `-£${deadLossTotal.toFixed(2)}`;
  document.getElementById('waste-stat-recovered').textContent = `+£${recoveredTotal.toFixed(2)}`;
}

function toggleSkuRescue(skuId) {
  const scenario = weatherScenarios[currentWeather];
  const sku = scenario.skus.find(s => s.id === skuId);
  if (!sku) return;
  sku.rescued = !sku.rescued;
  renderWasteModule();
  updateWasteChart();
}

function executeAllWasteActions() {
  const scenario = weatherScenarios[currentWeather];
  scenario.skus.forEach(s => { s.rescued = true; });
  renderWasteModule();
  updateWasteChart();
  document.getElementById('kpi-annual-waste').textContent = '£49,320';
  document.getElementById('kpi-waste-saved-badge').textContent = '-63% Saved';
  showToast('Rescue Protocols Activated', 'Pushed 50% Loyalty App discount & Too Good To Go surplus bags.');
}

function initWasteChart() {
  const ctx = document.getElementById('wasteChart').getContext('2d');
  const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  const sc = weatherScenarios[currentWeather];

  wasteChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        {
          label: 'Baseline',
          data: sc.hourlyBaseline,
          borderColor: '#d4d4d8',
          borderDash: [4, 4],
          borderWidth: 1.5,
          tension: 0.3,
          pointRadius: 0
        },
        {
          label: 'Actual (to 14:00)',
          data: sc.hourlyActual,
          borderColor: '#18181b',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: 'Rain Forecast',
          data: sc.hourlyPredicted,
          borderColor: '#f43f5e',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2
        },
        {
          label: 'Recovered',
          data: sc.hourlyRescued,
          borderColor: '#10b981',
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
          hidden: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#71717a', boxWidth: 10, font: { size: 10 } } }
      },
      scales: {
        x: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { display: false } },
        y: { ticks: { color: '#71717a', font: { size: 10 } }, grid: { color: '#f4f4f5' } }
      }
    }
  });
}

function updateWasteChart() {
  if (!wasteChartInstance) return;
  const sc = weatherScenarios[currentWeather];
  const anyRescued = sc.skus.some(s => s.rescued);
  wasteChartInstance.data.datasets[0].data = sc.hourlyBaseline;
  wasteChartInstance.data.datasets[1].data = sc.hourlyActual;
  wasteChartInstance.data.datasets[2].data = sc.hourlyPredicted;
  wasteChartInstance.data.datasets[3].data = sc.hourlyRescued;
  wasteChartInstance.data.datasets[3].hidden = !anyRescued;
  wasteChartInstance.update();
}

function showToast(title, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'p-3 rounded-lg bg-zinc-900 text-white shadow-lg border border-zinc-800 text-xs pointer-events-auto transition-opacity duration-200';
  toast.innerHTML = `
    <div class="font-medium">${title}</div>
    <div class="text-zinc-400 text-[11px] mt-0.5">${message}</div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

function openStockroomModal() {
  document.getElementById('stockroom-modal').classList.remove('hidden');
}

function closeStockroomModal() {
  document.getElementById('stockroom-modal').classList.add('hidden');
}

function submitStockroomLog() {
  const storeId = document.getElementById('modal-store').value;
  const paniniCount = parseInt(document.getElementById('modal-panini').value, 10) || 62;
  const pastryCount = parseInt(document.getElementById('modal-pastry').value, 10) || 45;
  const laborAdj = parseFloat(document.getElementById('modal-labor').value) || 0;

  const store = storesData.find(s => s.id === storeId);
  if (store && laborAdj < 0) {
    store.laborPct = Math.max(28.0, Number((store.laborPct + laborAdj * 0.45).toFixed(1)));
    if (store.laborPct <= 35.0 && store.opMargin >= 10.0) {
      store.status = 'healthy';
      store.breachReason = 'Healthy';
    }
    renderStoreTable();
    if (plChartInstance) {
      plChartInstance.data.datasets[0].data = storesData.map(s => s.laborPct);
      plChartInstance.update();
    }
  }

  weatherScenarios[currentWeather].skus[0].stockAt2PM = paniniCount;
  if (weatherScenarios[currentWeather].skus[1]) {
    weatherScenarios[currentWeather].skus[1].stockAt2PM = pastryCount;
  }
  renderWasteModule();
  closeStockroomModal();
  showToast('Stockroom iPad Log Synced', `Updated ${store ? store.name : storeId} inventory & rota hours via Django REST API.`);
}
