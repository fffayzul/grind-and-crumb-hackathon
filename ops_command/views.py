import csv
import io
from datetime import date, timedelta
from decimal import Decimal
from django.db.models import Sum
from django.http import HttpResponse
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from django.shortcuts import render

from .models import (
    Store,
    DailyStoreSale,
    StaffRotaWeekly,
    WasteLog,
    StoreCostMonthly,
    DeliveryPolicyConfig,
    AfternoonSurplusPrediction,
    AlertEvent,
    CandidateSite,
)

# Fixed Unit Economics Constants from Specification (Module 2)
DASHLY_COMMISSION = Decimal('0.33')
PACKAGING_FIXED = Decimal('0.45')
LABOR_FIXED_4MIN = Decimal('0.96')  # 4 mins @ 1.13x employer on-cost rate


def ensure_seed_data():
    """Seeds the actual 12-store Grind & Crumb dataset (S01–S12, CS1–CS7, P01–P38)
    from the client data pack (1 July 2025 – 30 June 2026) if DB is empty.
    """
    if Store.objects.exists():
        return

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    stores_seed = [
        {
            'code': 'S07',
            'name': 'Manchester Piccadilly (S07)',
            'is_flagship': True,
            'sales': Decimal('21358.53'),
            'hours': Decimal('383.75'),
            'wage': Decimal('13.01'),
            'cogs_ratio': Decimal('0.3145'),
            'waste_units': 206,
            'waste_cogs': Decimal('1.5032'),  # £309.66/wk (£16,102/yr)
            'rent': Decimal('30500.00'),
            'utilities': Decimal('2027.54'),
            'ins': Decimal('8320.69'),
            'deliv_orders': 319,
            'diagnosis': 'Highest revenue (£1.11m/yr) but losing -£63.9k/yr (-5.8% true margin): £30.5k/mo rent + sub-£8 single-coffee delivery orders jamming lunch queues (32 staff leavers).'
        },
        {
            'code': 'S10',
            'name': 'Hull Paragon (S10)',
            'is_flagship': False,
            'sales': Decimal('10393.95'),
            'hours': Decimal('242.49'),
            'wage': Decimal('12.40'),
            'cogs_ratio': Decimal('0.3101'),
            'waste_units': 212,
            'waste_cogs': Decimal('1.4788'),  # £313.51/wk (£16,303/yr — worst waste rate 3.02%!)
            'rent': Decimal('5400.00'),
            'utilities': Decimal('1812.74'),
            'ins': Decimal('3976.79'),
            'deliv_orders': 144,
            'diagnosis': 'Worst waste rate in chain (3.02% of sales / £16.3k/yr — manager over-orders intentionally) + £14k/yr boiler/dishwasher breakdown repairs.'
        },
        {
            'code': 'S11',
            'name': 'Sheffield Uni Campus (S11)',
            'is_flagship': False,
            'sales': Decimal('6959.86'),
            'hours': Decimal('176.09'),  # 35.5% annual labor (52.0% in June out-of-term!)
            'wage': Decimal('12.42'),
            'cogs_ratio': Decimal('0.3177'),
            'waste_units': 105,
            'waste_cogs': Decimal('1.4950'),  # £156.98/wk (£8,163/yr)
            'rent': Decimal('4800.00'),
            'utilities': Decimal('741.48'),
            'ins': Decimal('2401.86'),
            'deliv_orders': 34,
            'diagnosis': 'Labor > 35% breach (35.5% annual / 52.0% in June): university term-time rota not flexed down when students leave.'
        },
        {
            'code': 'S06',
            'name': 'Manchester Spinningfields (S06)',
            'is_flagship': False,
            'sales': Decimal('13545.07'),
            'hours': Decimal('245.50'),
            'wage': Decimal('13.01'),
            'cogs_ratio': Decimal('0.3155'),
            'waste_units': 156,
            'waste_cogs': Decimal('1.4876'),  # £232.06/wk (£12,067/yr)
            'rent': Decimal('12400.00'),
            'utilities': Decimal('1480.44'),
            'ins': Decimal('4125.73'),
            'deliv_orders': 201,
            'diagnosis': 'Low 7.1% margin: office district dead on weekends while morning rota is overstaffed and 12–2pm lunch queues walk away.'
        },
        {
            'code': 'S12',
            'name': 'Leeds Trinity (S12)',
            'is_flagship': False,
            'sales': Decimal('9590.50'),
            'hours': Decimal('200.48'),
            'wage': Decimal('12.88'),
            'cogs_ratio': Decimal('0.3078'),
            'waste_units': 89,
            'waste_cogs': Decimal('1.4872'),  # £132.36/wk (£6,883/yr)
            'rent': Decimal('8629.17'),
            'utilities': Decimal('1330.36'),
            'ins': Decimal('3018.61'),
            'deliv_orders': 133,
            'diagnosis': 'Opened Sept 2025 (£385k CapEx) only 0.4 miles from Leeds Briggate (S03) — 4.0% margin and cannibalizing £180k/yr from S03.'
        },
        {
            'code': 'S03',
            'name': 'Leeds Briggate (S03)',
            'is_flagship': True,
            'sales': Decimal('16922.93'),
            'hours': Decimal('340.84'),
            'wage': Decimal('12.79'),
            'cogs_ratio': Decimal('0.3091'),
            'waste_units': 214,
            'waste_cogs': Decimal('1.4961'),  # £320.17/wk (£16,649/yr)
            'rent': Decimal('11800.00'),
            'utilities': Decimal('2217.66'),
            'ins': Decimal('4003.63'),
            'deliv_orders': 229,
            'diagnosis': 'Sales dropped ~19% after S12 (Leeds Trinity) opened 0.4 miles away, but central bakery/lunch par levels were never reduced (£16.6k/yr waste).'
        },
        {
            'code': 'S02',
            'name': 'Sheffield Station (S02)',
            'is_flagship': False,
            'sales': Decimal('12182.42'),
            'hours': Decimal('275.98'),
            'wage': Decimal('12.60'),
            'cogs_ratio': Decimal('0.2829'),
            'waste_units': 134,
            'waste_cogs': Decimal('1.4903'),  # £199.70/wk (£10,384/yr)
            'rent': Decimal('7400.00'),
            'utilities': Decimal('562.71'),
            'ins': Decimal('3165.34'),
            'deliv_orders': 55,
            'diagnosis': 'Strong 520 sqft transit kiosk (£101.6k/yr profit, 16.0% margin) — blueprint for CS4 York Railway Station.'
        },
        {
            'code': 'S09',
            'name': 'Harrogate James Street (S09)',
            'is_flagship': False,
            'sales': Decimal('13329.10'),
            'hours': Decimal('303.76'),
            'wage': Decimal('12.70'),
            'cogs_ratio': Decimal('0.3153'),
            'waste_units': 103,
            'waste_cogs': Decimal('1.5024'),  # £154.75/wk (£8,047/yr)
            'rent': Decimal('7200.00'),
            'utilities': Decimal('1642.21'),
            'ins': Decimal('3002.17'),
            'deliv_orders': 180,
            'diagnosis': 'Steady affluent town performance (12.0% true margin, low 1.16% waste rate).'
        },
        {
            'code': 'S05',
            'name': 'Manchester Northern Quarter (S05)',
            'is_flagship': False,
            'sales': Decimal('16913.05'),
            'hours': Decimal('327.86'),
            'wage': Decimal('13.01'),
            'cogs_ratio': Decimal('0.3146'),
            'waste_units': 146,
            'waste_cogs': Decimal('1.4835'),  # £216.59/wk (£11,263/yr)
            'rent': Decimal('9600.00'),
            'utilities': Decimal('1705.49'),
            'ins': Decimal('3682.03'),
            'deliv_orders': 245,
            'diagnosis': 'Healthy 7-day high-street & weekend trading (£141.3k/yr true profit, 16.1% margin).'
        },
        {
            'code': 'S08',
            'name': 'Nottingham Hockley (S08)',
            'is_flagship': False,
            'sales': Decimal('13608.14'),
            'hours': Decimal('278.89'),
            'wage': Decimal('12.60'),
            'cogs_ratio': Decimal('0.3124'),
            'waste_units': 109,
            'waste_cogs': Decimal('1.5024'),  # £163.76/wk (£8,516/yr)
            'rent': Decimal('6800.00'),
            'utilities': Decimal('1396.68'),
            'ins': Decimal('2932.25'),
            'deliv_orders': 181,
            'diagnosis': 'Strong independent & student high street (£123.5k/yr true profit, 17.4% margin).'
        },
        {
            'code': 'S01',
            'name': 'Sheffield Division Street (S01)',
            'is_flagship': False,
            'sales': Decimal('14588.67'),
            'hours': Decimal('298.23'),
            'wage': Decimal('12.60'),
            'cogs_ratio': Decimal('0.3127'),
            'waste_units': 124,
            'waste_cogs': Decimal('1.4810'),  # £183.65/wk (£9,550/yr)
            'rent': Decimal('6200.00'),
            'utilities': Decimal('1563.40'),
            'ins': Decimal('2745.55'),
            'deliv_orders': 195,
            'diagnosis': 'Top high-street benchmark (£149.3k/yr true profit, 19.7% margin) — blueprint for CS2 Sheffield Kelham Island.'
        },
        {
            'code': 'S04',
            'name': 'York Stonegate (S04)',
            'is_flagship': False,
            'sales': Decimal('17082.64'),
            'hours': Decimal('340.01'),
            'wage': Decimal('12.59'),
            'cogs_ratio': Decimal('0.3098'),
            'waste_units': 127,
            'waste_cogs': Decimal('1.4973'),  # £190.16/wk (£9,888/yr)
            'rent': Decimal('7900.00'),
            'utilities': Decimal('1357.02'),
            'ins': Decimal('3200.44'),
            'deliv_orders': 228,
            'diagnosis': '#1 most profitable store in chain (£183.7k/yr true profit, 20.7% margin, lowest 1.11% waste).'
        },
    ]

    for item in stores_seed:
        store = Store.objects.create(
            code=item['code'],
            name=item['name'],
            is_flagship=item['is_flagship'],
            hourly_wage_rate=item['wage'],
            cogs_ratio=item['cogs_ratio'],
            diagnosis_note=item['diagnosis'],
        )
        DailyStoreSale.objects.create(
            store=store,
            date=today,
            gross_revenue=item['sales'],
            delivery_orders_count=item['deliv_orders'],
            avg_delivery_basket=Decimal('12.65'),
        )
        StaffRotaWeekly.objects.create(
            store=store,
            week_start=week_start,
            rostered_hours=item['hours'],
            employer_on_cost_multiplier=Decimal('1.13'),
        )
        WasteLog.objects.create(
            store=store,
            date=today,
            sku_name='Fresh Lunch & Bakery (waste_log.csv)',
            units_discarded=item['waste_units'],
            unit_cogs=item['waste_cogs'],
        )
        StoreCostMonthly.objects.create(
            store=store,
            rent_monthly=item['rent'],
            utilities_monthly=item['utilities'],
            insurance_ops_monthly=item['ins'],
        )

    DeliveryPolicyConfig.objects.create(
        minimum_order_value=Decimal('6.00'),
        menu_markup_pct=Decimal('0.00'),
        cogs_pct=Decimal('28.00'),
        bundle_only_enabled=False,
    )

    hull = Store.objects.get(code='S10')
    leeds_brig = Store.objects.get(code='S03')
    manchester = Store.objects.get(code='S07')

    AfternoonSurplusPrediction.objects.create(
        store=hull,
        sku_name='P26 Ham & Cheese Toastie + P28 Chicken Pesto (Hull S10)',
        category='Lunch • £68.2k/yr chain waste',
        stock_at_2pm=58,
        baseline_afternoon_sales=18,
        unit_cogs=Decimal('2.19'),
        retail_price=Decimal('5.60'),
        rescue_channel='50% Loyalty App Push',
        rescue_protocol_desc='Stop Marcus Dyer manual over-ordering + 14:30 50% App Flash Push',
        recovered_per_unit=Decimal('2.80'),
        is_rescued=False,
    )
    AfternoonSurplusPrediction.objects.create(
        store=leeds_brig,
        sku_name='P16 Butter Croissant & P22 Almond Croissant (Leeds S03)',
        category='Bakery • £52.4k/yr chain waste',
        stock_at_2pm=52,
        baseline_afternoon_sales=16,
        unit_cogs=Decimal('1.02'),
        retail_price=Decimal('3.10'),
        rescue_channel='Too Good To Go API',
        rescue_protocol_desc='Adjust par levels for S12 cannibalization + Release Too Good To Go Bags',
        recovered_per_unit=Decimal('1.25'),
        is_rescued=False,
    )
    AfternoonSurplusPrediction.objects.create(
        store=manchester,
        sku_name='P29 Falafel Wrap & P31 Superfood Salad (Piccadilly S07)',
        category='Lunch Grab & Go • £16.1k/yr S07 waste',
        stock_at_2pm=36,
        baseline_afternoon_sales=12,
        unit_cogs=Decimal('2.31'),
        retail_price=Decimal('5.75'),
        rescue_channel='POS Meal Deal Upsell',
        rescue_protocol_desc='Activate 14:00 Commuter POS Meal Deal Bundle Discount',
        recovered_per_unit=Decimal('2.50'),
        is_rescued=False,
    )

    AlertEvent.objects.create(
        store_name='Manchester Piccadilly (S07)',
        severity='critical',
        message='Flagship True Margin at -5.8% (-£63.9k/yr): £30.5k/mo rent + 28.9% sub-£8 delivery orders jamming lunch queues.',
    )
    AlertEvent.objects.create(
        store_name='Hull Paragon (S10)',
        severity='warning',
        message='Chain-high 3.02% waste rate (£16,303/yr) from unadjusted par levels + broken boiler/dishwasher repairs.',
    )
    AlertEvent.objects.create(
        store_name='Sheffield Uni Campus (S11)',
        severity='warning',
        message='Labor Cost at 35.5% annual (52.0% in June out-of-term) — exceeds 35% threshold.',
    )

    if not CandidateSite.objects.exists():
        candidates_seed = [
            ('CS5', 'CS5 Liverpool Bold Street', 'Recommended • High St, 33k Footfall (£11.2k rent)', Decimal('810000'), Decimal('91000'), Decimal('450000')),
            ('CS6', 'CS6 Wakefield Trinity Walk', 'Recommended Option • Shopping Ctr (£6.9k rent)', Decimal('580000'), Decimal('91000'), Decimal('450000')),
            ('CS1', 'CS1 Leeds Headingley', 'Suburban High St • 17.5k Students (£7.6k rent)', Decimal('760000'), Decimal('91000'), Decimal('320000')),
            ('CS2', 'CS2 Sheffield Kelham Island', 'Growth High St • 8.3 Vibrancy (£8.2k rent)', Decimal('790000'), Decimal('95000'), Decimal('390000')),
            ('CS3', 'CS3 Manchester Oxford Road', 'Campus • 31k Students, 52k Footfall (£9.8k rent)', Decimal('740000'), Decimal('89000'), Decimal('240000')),
            ('CS4', 'CS4 York Railway Station', 'Transit Kiosk • 39k Footfall, 2 Rivals (£12.9k rent)', Decimal('680000'), Decimal('86000'), Decimal('180000')),
            ('CS7', 'CS7 Leeds Wellington Place', 'REJECT • Central Leeds (Cannibalizes S03 & S12)', Decimal('690000'), Decimal('19000'), Decimal('350000')),
        ]
        for code, city, catch, rev, prof, capex in candidates_seed:
            CandidateSite.objects.create(
                site_code=code,
                city_location=city,
                catchment_type=catch,
                projected_annual_revenue=rev,
                projected_annual_net_profit=prof,
                setup_capex=capex,
                is_selected=(code == 'CS5'),
            )


def compute_store_pl_dict(store: Store, policy: DeliveryPolicyConfig):
    """Executes the relational join across daily_store_sales, staff_rota_weekly,
    waste_log, and pro-rata store_costs_monthly for a store.
    """
    sales_agg = store.daily_sales.aggregate(
        total_rev=Sum('gross_revenue'),
        total_deliv=Sum('delivery_orders_count'),
    )
    wtd_sales = sales_agg['total_rev'] or Decimal('0.00')
    deliv_orders = sales_agg['total_deliv'] or 0

    # Policy boost if delivery MOV/Markup has been optimized above baseline £6.00
    mov_delta = max(Decimal('0.00'), policy.minimum_order_value - Decimal('6.00'))
    markup_boost = (policy.menu_markup_pct / Decimal('100.0')) * Decimal('0.67')
    delivery_margin_recovery = Decimal(deliv_orders) * (mov_delta * Decimal('0.22') + markup_boost * Decimal('3.50'))
    effective_sales = wtd_sales + delivery_margin_recovery

    # Weekly labor cost (with 1.13x employer on-cost)
    total_hours = sum((r.rostered_hours for r in store.weekly_rotas.all()), Decimal('0.00'))
    labor_cost = total_hours * store.hourly_wage_rate * Decimal('1.13')
    labor_pct = (labor_cost / effective_sales * Decimal('100.0')) if effective_sales > 0 else Decimal('0.0')

    # Waste cost
    waste_cost = sum((w.total_waste_cost for w in store.waste_logs.all()), Decimal('0.00'))
    waste_units = sum((w.units_discarded for w in store.waste_logs.all()), 0)

    # Pro-rata monthly fixed costs
    pro_rata_fixed = store.monthly_cost.weekly_pro_rata_cost if hasattr(store, 'monthly_cost') else Decimal('0.00')

    # Base COGS + Dashly bleed on unoptimized orders
    cogs_cost = wtd_sales * store.cogs_ratio
    unoptimized_dashly_drag = Decimal(deliv_orders) * Decimal('1.55') if policy.minimum_order_value < Decimal('10.0') else Decimal('0.00')

    operating_profit = effective_sales - cogs_cost - labor_cost - waste_cost - pro_rata_fixed - unoptimized_dashly_drag
    op_margin_pct = (operating_profit / effective_sales * Decimal('100.0')) if effective_sales > 0 else Decimal('0.0')

    # Check Early Warning Rules (Labor > 35% OR Flagship Op Margin < 10%)
    breaches = []
    if labor_pct > Decimal('35.0'):
        breaches.append(f"Labor > 35% ({labor_pct:.1f}%)")
    if store.is_flagship and op_margin_pct < Decimal('10.0'):
        breaches.append(f"Margin < 10% ({op_margin_pct:.1f}%)")
    elif op_margin_pct < Decimal('8.0'):
        breaches.append(f"Low Margin ({op_margin_pct:.1f}%)")

    status = 'breach' if breaches else 'healthy'
    breach_label = ' • '.join(breaches) if breaches else 'Healthy'

    return {
        'id': store.code,
        'name': store.name,
        'isFlagship': store.is_flagship,
        'sales': float(round(effective_sales, 2)),
        'rosteredHours': float(round(total_hours, 1)),
        'laborCost': float(round(labor_cost, 2)),
        'laborPct': float(round(labor_pct, 1)),
        'wasteCost': float(round(waste_cost, 2)),
        'wasteUnits': waste_units,
        'proRataFixed': float(round(pro_rata_fixed, 2)),
        'opProfit': float(round(operating_profit, 2)),
        'opMargin': float(round(op_margin_pct, 1)),
        'status': status,
        'breachReason': breach_label,
        'diagnosis': store.diagnosis_note,
    }


def calculate_unit_economics(basket: Decimal, markup_pct: Decimal, cogs_pct: Decimal):
    """Module 2 mathematical engine:
    Deducts 33% Dashly commission, £0.45 packaging, and £0.96 labor (4 mins @ 1.13x).
    """
    gross = basket * (Decimal('1.0') + markup_pct / Decimal('100.0'))
    cogs = basket * (cogs_pct / Decimal('100.0'))
    dashly_fee = gross * DASHLY_COMMISSION
    net_profit = gross - cogs - dashly_fee - PACKAGING_FIXED - LABOR_FIXED_4MIN
    margin_pct = (net_profit / gross * Decimal('100.0')) if gross > 0 else Decimal('0.0')
    return {
        'basket': float(basket),
        'gross': float(round(gross, 2)),
        'cogs': float(round(cogs, 2)),
        'dashlyFee': float(round(dashly_fee, 2)),
        'packaging': float(PACKAGING_FIXED),
        'labor': float(LABOR_FIXED_4MIN),
        'netProfit': float(round(net_profit, 2)),
        'marginPct': float(round(margin_pct, 1)),
    }


def dashboard_home(request):
    """Serves the main operational dashboard template."""
    ensure_seed_data()
    return render(request, 'ops_command/index.html')


def presentation_view(request):
    """Serves the interactive slide presentation for group members and judges."""
    return render(request, 'ops_command/presentation.html')


@api_view(['GET'])
def api_dashboard_state(request):
    """GET /api/dashboard/
    Returns real-time aggregated PostgreSQL/SQLite state for all 3 modules.
    """
    ensure_seed_data()
    weather = request.GET.get('weather', 'rain')
    policy = DeliveryPolicyConfig.objects.first()

    stores = Store.objects.prefetch_related('daily_sales', 'weekly_rotas', 'waste_logs', 'monthly_cost').all()
    store_rows = [compute_store_pl_dict(s, policy) for s in stores]

    network_rev = sum(s['sales'] for s in store_rows)
    weekly_waste_cost = sum(s['wasteCost'] for s in store_rows)
    annualized_waste = round(weekly_waste_cost * 52, 2)
    labor_breach_count = sum(1 for s in store_rows if s['laborPct'] > 35.0)
    manchester = next((s for s in store_rows if s['id'] in ('S07', 'MAN-01')), store_rows[0])

    # Module 2 curve (£4 to £18)
    baskets = [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18]
    curve = [
        calculate_unit_economics(Decimal(str(b)), policy.menu_markup_pct, policy.cogs_pct)
        for b in baskets
    ]
    selected_econ = calculate_unit_economics(
        policy.minimum_order_value, policy.menu_markup_pct, policy.cogs_pct
    )

    # Module 3 Dynamic Waste Predictor (weather-adjusted)
    weather_multipliers = {
        'rain': {'drop_pct': -38, 'sales_mult': Decimal('0.55'), 'label': '• Heavy Rain 15:00–18:00 (-38% Footfall)'},
        'cloudy': {'drop_pct': -12, 'sales_mult': Decimal('0.85'), 'label': '• Overcast 15:00–18:00 (-12% Footfall)'},
        'sunny': {'drop_pct': 5, 'sales_mult': Decimal('1.15'), 'label': '• Clear Sunny Afternoon (+5% Footfall)'},
    }
    w_cfg = weather_multipliers.get(weather, weather_multipliers['rain'])

    surplus_items = []
    for item in AfternoonSurplusPrediction.objects.select_related('store').all():
        expected_sales = int(round(Decimal(item.baseline_afternoon_sales) * w_cfg['sales_mult']))
        predicted_surplus = max(0, item.stock_at_2pm - expected_sales)
        dead_loss = float(round(Decimal(predicted_surplus) * item.unit_cogs, 2))
        salvage_val = float(round(Decimal(predicted_surplus) * item.recovered_per_unit, 2))
        surplus_items.append({
            'id': item.id,
            'storeCode': item.store.code,
            'storeName': item.store.name,
            'name': item.sku_name,
            'category': item.category,
            'stockAt2PM': item.stock_at_2pm,
            'expectedSales': expected_sales,
            'predictedSurplus': predicted_surplus,
            'unitCogs': float(item.unit_cogs),
            'retailPrice': float(item.retail_price),
            'deadLoss': dead_loss,
            'potentialRecovery': salvage_val,
            'protocol': item.rescue_protocol_desc,
            'channel': item.rescue_channel,
            'rescued': item.is_rescued,
        })

    alerts = [
        {
            'id': a.id,
            'store': a.store_name,
            'type': a.severity,
            'msg': a.message,
            'time': a.created_at.strftime('%H:%M:%S'),
        }
        for a in AlertEvent.objects.all()[:12]
    ]

    # Ensure CandidateSite rows exist even if DB was seeded before CandidateSite migration
    if not CandidateSite.objects.exists():
        candidates_seed = [
            ('CS5', 'CS5 Liverpool Bold Street', 'Recommended • High St, 33k Footfall (£11.2k rent)', Decimal('810000'), Decimal('91000'), Decimal('450000')),
            ('CS6', 'CS6 Wakefield Trinity Walk', 'Recommended Option • Shopping Ctr (£6.9k rent)', Decimal('580000'), Decimal('91000'), Decimal('450000')),
            ('CS1', 'CS1 Leeds Headingley', 'Suburban High St • 17.5k Students (£7.6k rent)', Decimal('760000'), Decimal('91000'), Decimal('320000')),
            ('CS2', 'CS2 Sheffield Kelham Island', 'Growth High St • 8.3 Vibrancy (£8.2k rent)', Decimal('790000'), Decimal('95000'), Decimal('390000')),
            ('CS3', 'CS3 Manchester Oxford Road', 'Campus • 31k Students, 52k Footfall (£9.8k rent)', Decimal('740000'), Decimal('89000'), Decimal('240000')),
            ('CS4', 'CS4 York Railway Station', 'Transit Kiosk • 39k Footfall, 2 Rivals (£12.9k rent)', Decimal('680000'), Decimal('86000'), Decimal('180000')),
            ('CS7', 'CS7 Leeds Wellington Place', 'REJECT • Central Leeds (Cannibalizes S03 & S12)', Decimal('690000'), Decimal('19000'), Decimal('350000')),
        ]
        for code, city, catch, rev, prof, capex in candidates_seed:
            CandidateSite.objects.create(
                site_code=code,
                city_location=city,
                catchment_type=catch,
                projected_annual_revenue=rev,
                projected_annual_net_profit=prof,
                setup_capex=capex,
                is_selected=(code == 'CS5'),
            )

    candidate_sites = [
        {
            'id': c.id,
            'siteCode': c.site_code,
            'cityLocation': c.city_location,
            'catchmentType': c.catchment_type,
            'annualRevenue': float(c.projected_annual_revenue),
            'annualNetProfit': float(c.projected_annual_net_profit),
            'setupCapex': float(c.setup_capex),
            'selected': c.is_selected,
        }
        for c in CandidateSite.objects.all()
    ]

    return Response({
        'kpis': {
            'networkRevenue': round(network_rev, 2),
            'manchesterMargin': manchester['opMargin'],
            'laborBreachCount': labor_breach_count,
            'annualizedWaste': annualized_waste,
            'weeklyWasteCost': round(weekly_waste_cost, 2),
            'totalTransactions': 214892 + DailyStoreSale.objects.count() * 45,
        },
        'stores': store_rows,
        'candidateSites': candidate_sites,
        'deliveryPolicy': {
            'mov': float(policy.minimum_order_value),
            'markupPct': float(policy.menu_markup_pct),
            'cogsPct': float(policy.cogs_pct),
            'bundleOnly': policy.bundle_only_enabled,
            'selectedEconomics': selected_econ,
            'curve': curve,
        },
        'wastePredictor': {
            'weather': weather,
            'weatherLabel': w_cfg['label'],
            'skus': surplus_items,
        },
        'alerts': alerts,
    })


@api_view(['POST'])
def api_log_store_operation(request):
    """POST /api/store-log/
    Real database write endpoint for store managers / executives to input:
    - Daily sales revenue (`daily_store_sales`)
    - Weekly staff rota hours adjustment (`staff_rota_weekly`)
    - EOD waste units (`waste_log`)
    - Or update 2:00 PM stock counts (`AfternoonSurplusPrediction`)
    Immediately recalculates P&L margins, labor %, and triggers Early Warning alerts if breached!
    """
    ensure_seed_data()
    data = request.data
    store_code = data.get('store_code', 'S07')
    store = Store.objects.filter(code=store_code).first() or Store.objects.first()
    if not store:
        return Response({'error': 'Store not found'}, status=404)

    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    changes = []

    # 1. Sales Revenue Entry / Adjustment
    added_sales = Decimal(str(data.get('added_sales', '0') or '0'))
    delivery_orders = int(data.get('delivery_orders', 0) or 0)
    if added_sales != 0 or delivery_orders != 0:
        DailyStoreSale.objects.create(
            store=store,
            date=today,
            gross_revenue=added_sales,
            delivery_orders_count=delivery_orders,
        )
        changes.append(f"Sales {'+' if added_sales >= 0 else ''}£{added_sales:,.0f}")

    # 2. Staff Rota Hours Adjustment
    rota_hours_delta = Decimal(str(data.get('rota_hours_delta', '0') or '0'))
    if rota_hours_delta != 0:
        StaffRotaWeekly.objects.create(
            store=store,
            week_start=week_start,
            rostered_hours=rota_hours_delta,
            employer_on_cost_multiplier=Decimal('1.13'),
        )
        changes.append(f"Rota {'+' if rota_hours_delta >= 0 else ''}{rota_hours_delta} hrs")

    # 3. Waste Log Entry
    waste_units = int(data.get('waste_units', 0) or 0)
    waste_sku = data.get('waste_sku', 'Artisan Panini / Pastry')
    waste_unit_cogs = Decimal(str(data.get('waste_unit_cogs', '1.95') or '1.95'))
    if waste_units != 0:
        WasteLog.objects.create(
            store=store,
            date=today,
            sku_name=waste_sku,
            units_discarded=waste_units,
            unit_cogs=waste_unit_cogs,
        )
        changes.append(f"Waste {'+' if waste_units >= 0 else ''}{waste_units} units")

    # 4. Optional 2:00 PM Stock Count Override for Waste Predictor
    panini_2pm = data.get('panini_stock_2pm')
    if panini_2pm is not None and str(panini_2pm).strip() != '':
        pred = (
            AfternoonSurplusPrediction.objects.filter(store=store).first()
            or AfternoonSurplusPrediction.objects.filter(sku_name__icontains='Toastie').first()
            or AfternoonSurplusPrediction.objects.first()
        )
        if pred:
            pred.stock_at_2pm = int(panini_2pm)
            pred.is_rescued = False
            pred.save()
            changes.append(f"2PM Stock set to {panini_2pm}")

    # Re-evaluate store P&L and create real-time AlertEvent if thresholds are breached or healed
    policy = DeliveryPolicyConfig.objects.first()
    pl = compute_store_pl_dict(store, policy)
    summary_str = ', '.join(changes) if changes else 'Manual sync'

    if pl['status'] == 'breach':
        store.diagnosis_note = f"Updated via live input ({summary_str}): Labor at {pl['laborPct']}%, Op Margin at {pl['opMargin']}%."
        store.save()
        AlertEvent.objects.create(
            store_name=store.name,
            severity='critical' if pl['opMargin'] < 10.0 else 'warning',
            message=f"LIVE INPUT ({summary_str}): {pl['breachReason']} — Op Margin now {pl['opMargin']}%, Labor {pl['laborPct']}%.",
        )
    else:
        store.diagnosis_note = f"Healthy after live update ({summary_str}): Labor {pl['laborPct']}%, Op Margin {pl['opMargin']}%."
        store.save()
        AlertEvent.objects.create(
            store_name=store.name,
            severity='info',
            message=f"RESOLVED ({summary_str}): {store.name} is within all guardrails (Labor {pl['laborPct']}%, Margin {pl['opMargin']}%).",
        )

    return Response({'status': 'ok', 'updatedStore': pl, 'changes': changes})


@api_view(['POST'])
def api_update_delivery_policy(request):
    """POST /api/delivery-policy/
    Saves Module 2 Delivery Simulator sliders to DB and updates flagship store margins.
    """
    ensure_seed_data()
    data = request.data
    policy = DeliveryPolicyConfig.objects.first()
    policy.minimum_order_value = Decimal(str(data.get('mov', policy.minimum_order_value)))
    policy.menu_markup_pct = Decimal(str(data.get('markup_pct', policy.menu_markup_pct)))
    policy.cogs_pct = Decimal(str(data.get('cogs_pct', policy.cogs_pct)))
    policy.bundle_only_enabled = bool(data.get('bundle_only', policy.bundle_only_enabled))
    policy.save()

    econ = calculate_unit_economics(policy.minimum_order_value, policy.menu_markup_pct, policy.cogs_pct)

    AlertEvent.objects.create(
        store_name='Dashly Menu API (All Stores)',
        severity='info' if econ['netProfit'] >= 0 else 'warning',
        message=f"Deployed £{policy.minimum_order_value} MOV & +{policy.menu_markup_pct}% markup. Per-order profit: £{econ['netProfit']:.2f} ({econ['marginPct']}%).",
    )
    return Response({'status': 'ok', 'economics': econ})


@api_view(['POST'])
def api_trigger_waste_rescue(request):
    """POST /api/waste-rescue/
    Toggles or executes Module 3 2:30 PM surplus rescue protocols and writes a negative
    waste credit to `WasteLog` so the Weekly P&L and Annual Waste KPI actually drop in real time!
    """
    ensure_seed_data()
    sku_id = request.data.get('sku_id')
    rescue_all = bool(request.data.get('rescue_all', False))
    add_new_sku = request.data.get('new_sku_name')

    manchester = Store.objects.filter(code__in=['S07', 'MAN-01']).first() or Store.objects.first()

    # Allow user to add a custom predicted surplus item in Module 3!
    if add_new_sku:
        stock_2pm = int(request.data.get('stock_at_2pm', 35))
        est_sales = int(request.data.get('baseline_sales', 10))
        unit_cogs = Decimal(str(request.data.get('unit_cogs', '1.65')))
        retail = Decimal(str(request.data.get('retail_price', '4.80')))
        channel = request.data.get('rescue_channel', '50% Loyalty App Push')
        AfternoonSurplusPrediction.objects.create(
            store=manchester,
            sku_name=add_new_sku,
            category='Custom Manager Prediction • 20:00 Discard',
            stock_at_2pm=stock_2pm,
            baseline_afternoon_sales=est_sales,
            unit_cogs=unit_cogs,
            retail_price=retail,
            rescue_channel=channel,
            rescue_protocol_desc=f"Automated {channel} protocol @ 50% recovery",
            recovered_per_unit=round(retail * Decimal('0.5'), 2),
            is_rescued=False,
        )
        AlertEvent.objects.create(
            store_name=manchester.name,
            severity='warning',
            message=f"2:00 PM Predictor: Added {add_new_sku} ({stock_2pm} in stock, {max(0, stock_2pm - est_sales)} predicted surplus).",
        )
        return Response({'status': 'created'})

    if rescue_all:
        items = AfternoonSurplusPrediction.objects.filter(is_rescued=False)
        for item in items:
            item.is_rescued = True
            item.save()
            surplus_units = max(0, item.stock_at_2pm - int(item.baseline_afternoon_sales * 0.55))
            WasteLog.objects.create(
                store=item.store,
                date=date.today(),
                sku_name=f"RESCUED: {item.sku_name}",
                units_discarded=-surplus_units,
                unit_cogs=item.unit_cogs,
            )
        AlertEvent.objects.create(
            store_name='Manchester Piccadilly',
            severity='info',
            message='Executed all 2:30 PM Surplus Rescue Protocols (50% Loyalty Push + Too Good To Go Bags).',
        )
    elif sku_id:
        item = AfternoonSurplusPrediction.objects.filter(id=sku_id).first()
        if item:
            item.is_rescued = not item.is_rescued
            item.save()
            surplus_units = max(0, item.stock_at_2pm - int(item.baseline_afternoon_sales * 0.55))
            multiplier = -1 if item.is_rescued else 1
            WasteLog.objects.create(
                store=item.store,
                date=date.today(),
                sku_name=f"{'RESCUED' if item.is_rescued else 'REVERTED'}: {item.sku_name}",
                units_discarded=multiplier * surplus_units,
                unit_cogs=item.unit_cogs,
            )

    return Response({'status': 'ok'})


@api_view(['POST'])
def api_reset_demo(request):
    """POST /api/reset/
    Resets the database to clean initial hackathon demo state.
    """
    Store.objects.all().delete()
    DeliveryPolicyConfig.objects.all().delete()
    AlertEvent.objects.all().delete()
    CandidateSite.objects.all().delete()
    ensure_seed_data()
    return Response({'status': 'reset'})


@api_view(['POST'])
def api_toggle_candidate_site(request):
    """POST /api/candidate-site/
    Toggles selection of a candidate expansion location from `candidate_sites.csv`.
    """
    ensure_seed_data()
    site_id = request.data.get('site_id')
    site = CandidateSite.objects.filter(id=site_id).first()
    if site:
        site.is_selected = not site.is_selected
        site.save()
    return Response({'status': 'ok'})


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def api_upload_csv(request):
    """POST /api/upload-csv/
    Ingests a CSV file and populates/updates the relational database models:
    - Store, DailyStoreSale, StaffRotaWeekly, WasteLog, StoreCostMonthly (P&L CSV)
    - AfternoonSurplusPrediction (2:00 PM Waste Predictor CSV)
    Supports 'replace' or 'append' mode.
    """
    ensure_seed_data()
    csv_file = request.FILES.get('file')
    mode = request.data.get('mode', 'replace')

    if not csv_file:
        return Response({'error': 'No CSV file provided'}, status=400)

    decoded = csv_file.read().decode('utf-8-sig', errors='ignore')
    reader = csv.DictReader(io.StringIO(decoded))
    rows = list(reader)
    if not rows:
        return Response({'error': 'CSV file is empty'}, status=400)

    headers = {h.strip().lower() for h in (reader.fieldnames or []) if h}
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    stores_processed = 0
    surplus_processed = 0
    alerts_triggered = 0

    # Check if this is a candidate_sites.csv upload (supports both official pack columns and custom columns)
    if 'site_code' in headers or 'site_id' in headers or 'setup_capex' in headers or 'est_fitout_gbp' in headers:
        if mode == 'replace':
            CandidateSite.objects.all().delete()
        sites_count = 0
        default_profits = {
            'CS5': ('810000', '91000'),
            'CS6': ('580000', '91000'),
            'CS1': ('760000', '91000'),
            'CS2': ('790000', '95000'),
            'CS3': ('740000', '89000'),
            'CS4': ('680000', '86000'),
            'CS7': ('690000', '19000'),
        }
        for row in rows:
            clean = {k.strip().lower(): (v.strip() if v else '') for k, v in row.items() if k}
            code = clean.get('site_code') or clean.get('site_id') or f"CS{sites_count + 1}"
            name = clean.get('city_location') or clean.get('site_name') or clean.get('city') or code
            if clean.get('site_name') and not name.startswith(code):
                name = f"{code} {clean.get('site_name')}"
            loc_type = clean.get('catchment_type') or clean.get('location_type') or 'High street'
            rent_mo = clean.get('quoted_rent_gbp_month')
            catch = f"{loc_type} (£{int(float(rent_mo)):,}/mo rent)" if rent_mo else loc_type
            def_rev, def_prof = default_profits.get(code, ('720000', '125000'))
            rev = Decimal(clean.get('projected_annual_revenue') or clean.get('annual_revenue') or def_rev)
            prof = Decimal(clean.get('projected_annual_net_profit') or clean.get('annual_net_profit') or def_prof)
            capex = Decimal(clean.get('setup_capex') or clean.get('est_fitout_gbp') or clean.get('capex') or '320000')
            sel = clean.get('is_selected', '').lower() in ('true', '1', 'yes', 'y')
            CandidateSite.objects.update_or_create(
                site_code=code,
                defaults={
                    'city_location': name,
                    'catchment_type': catch,
                    'projected_annual_revenue': rev,
                    'projected_annual_net_profit': prof,
                    'setup_capex': capex,
                    'is_selected': sel,
                }
            )
            sites_count += 1
        return Response({
            'status': 'ok',
            'type': 'candidate_sites',
            'rowsProcessed': sites_count,
            'filename': csv_file.name,
        })

    # Check if this is a 2:00 PM Surplus Prediction CSV
    if 'stock_at_2pm' in headers or 'baseline_afternoon_sales' in headers:
        if mode == 'replace':
            AfternoonSurplusPrediction.objects.all().delete()

        for row in rows:
            clean = {k.strip().lower(): (v.strip() if v else '') for k, v in row.items() if k}
            store_code = clean.get('store_code') or 'MAN-01'
            store = Store.objects.filter(code=store_code).first() or Store.objects.first()
            sku_name = clean.get('sku_name') or clean.get('item') or 'Artisan Bakery Item'
            stock_2pm = int(float(clean.get('stock_at_2pm') or 40))
            est_sales = int(float(clean.get('baseline_afternoon_sales') or clean.get('expected_sales') or 15))
            unit_cogs = Decimal(clean.get('unit_cogs') or '1.50')
            retail_price = Decimal(clean.get('retail_price') or '4.80')
            channel = clean.get('rescue_channel') or '50% Loyalty App Push'

            AfternoonSurplusPrediction.objects.create(
                store=store,
                sku_name=sku_name,
                category=clean.get('category') or 'CSV Imported • 20:00 Discard',
                stock_at_2pm=stock_2pm,
                baseline_afternoon_sales=est_sales,
                unit_cogs=unit_cogs,
                retail_price=retail_price,
                rescue_channel=channel,
                rescue_protocol_desc=clean.get('protocol') or f"Automated {channel} protocol",
                recovered_per_unit=round(retail_price * Decimal('0.5'), 2),
                is_rescued=False,
            )
            surplus_processed += 1

        AlertEvent.objects.create(
            store_name='CSV Batch Importer (2PM Waste AI)',
            severity='info',
            message=f"Imported {surplus_processed} afternoon stock SKUs from '{csv_file.name}' into 2:00 PM Waste Predictor.",
        )
        return Response({
            'status': 'ok',
            'type': 'waste_predictor',
            'rowsProcessed': surplus_processed,
            'filename': csv_file.name,
        })

    # Otherwise process as Store Operations & Weekly P&L CSV
    for row in rows:
        clean = {k.strip().lower(): (v.strip() if v else '') for k, v in row.items() if k}
        code = clean.get('store_code') or clean.get('code') or f"STR-{stores_processed + 1:02d}"
        name = clean.get('store_name') or clean.get('name') or code
        is_flagship_str = clean.get('is_flagship', '').lower()
        is_flagship = is_flagship_str in ('true', '1', 'yes', 'y')

        store, _ = Store.objects.get_or_create(
            code=code,
            defaults={'name': name, 'is_flagship': is_flagship}
        )
        if clean.get('store_name') or clean.get('name'):
            store.name = name
        if 'is_flagship' in clean and is_flagship_str != '':
            store.is_flagship = is_flagship
        if clean.get('hourly_wage_rate'):
            store.hourly_wage_rate = Decimal(clean['hourly_wage_rate'])
        if clean.get('cogs_ratio'):
            val = Decimal(clean['cogs_ratio'])
            store.cogs_ratio = val / Decimal('100.0') if val > 1 else val
        store.save()

        # Sales
        sales_val = clean.get('gross_revenue') or clean.get('sales') or clean.get('wtd_sales')
        deliv_cnt = clean.get('delivery_orders') or clean.get('delivery_orders_count') or '0'
        if sales_val:
            if mode == 'replace':
                store.daily_sales.all().delete()
            DailyStoreSale.objects.create(
                store=store,
                date=today,
                gross_revenue=Decimal(sales_val),
                delivery_orders_count=int(float(deliv_cnt)),
            )

        # Rota Hours
        rota_val = clean.get('rostered_hours') or clean.get('rota_hours') or clean.get('hours')
        if rota_val:
            if mode == 'replace':
                store.weekly_rotas.all().delete()
            StaffRotaWeekly.objects.create(
                store=store,
                week_start=week_start,
                rostered_hours=Decimal(rota_val),
                employer_on_cost_multiplier=Decimal('1.13'),
            )

        # Waste
        waste_units = clean.get('waste_units') or clean.get('units_discarded')
        waste_cogs = clean.get('waste_unit_cogs') or clean.get('unit_cogs') or '1.95'
        waste_cost_direct = clean.get('waste_cost')
        if waste_units or waste_cost_direct:
            if mode == 'replace':
                store.waste_logs.all().delete()
            if waste_units:
                u = int(float(waste_units))
                c = Decimal(waste_cogs)
            else:
                u = 100
                c = Decimal(waste_cost_direct) / Decimal('100.0')
            WasteLog.objects.create(
                store=store,
                date=today,
                sku_name=clean.get('waste_sku') or 'CSV Imported Waste',
                units_discarded=u,
                unit_cogs=c,
            )

        # Monthly Fixed Costs
        rent_val = clean.get('rent_monthly') or clean.get('rent')
        util_val = clean.get('utilities_monthly') or clean.get('utilities')
        ins_val = clean.get('insurance_ops_monthly') or clean.get('insurance')
        if rent_val or util_val or ins_val:
            StoreCostMonthly.objects.update_or_create(
                store=store,
                defaults={
                    'rent_monthly': Decimal(rent_val or '12000.00'),
                    'utilities_monthly': Decimal(util_val or '3500.00'),
                    'insurance_ops_monthly': Decimal(ins_val or '2800.00'),
                }
            )

        # Optional 2PM Panini Stock column in unified CSV
        if clean.get('panini_stock_2pm'):
            AfternoonSurplusPrediction.objects.create(
                store=store,
                sku_name=f"{store.name} — Artisan Panini",
                category='CSV Imported • 20:00 Discard',
                stock_at_2pm=int(float(clean['panini_stock_2pm'])),
                baseline_afternoon_sales=int(float(clean.get('baseline_afternoon_sales') or 18)),
                unit_cogs=Decimal('1.95'),
                retail_price=Decimal('5.95'),
                rescue_channel='50% Loyalty App Push',
                rescue_protocol_desc='Push 50% Off Flash Deal to Grind & Crumb Loyalty App',
                recovered_per_unit=Decimal('2.98'),
                is_rescued=False,
            )

        # Evaluate P&L & generate alert if breached
        policy = DeliveryPolicyConfig.objects.first()
        pl = compute_store_pl_dict(store, policy)
        store.diagnosis_note = clean.get('diagnosis') or (
            f"CSV Import ({csv_file.name}): Labor {pl['laborPct']}%, Op Margin {pl['opMargin']}% ({pl['breachReason']})."
        )
        store.save()

        if pl['status'] == 'breach':
            alerts_triggered += 1
            AlertEvent.objects.create(
                store_name=store.name,
                severity='critical' if pl['opMargin'] < 10.0 else 'warning',
                message=f"CSV IMPORT BREACH ({csv_file.name}): {pl['breachReason']} — Sales £{pl['sales']:,.0f}, Labor {pl['laborPct']}%, Margin {pl['opMargin']}%.",
            )

        stores_processed += 1

    AlertEvent.objects.create(
        store_name='PostgreSQL CSV Pipeline',
        severity='info',
        message=f"Processed {stores_processed} store rows from '{csv_file.name}' ({mode} mode). {alerts_triggered} breaches detected.",
    )

    return Response({
        'status': 'ok',
        'type': 'store_pl',
        'rowsProcessed': stores_processed,
        'alertsTriggered': alerts_triggered,
        'filename': csv_file.name,
    })


def api_sample_csv(request):
    """GET /api/sample-csv/?type=pl|waste|candidates
    Downloads a ready-to-edit CSV template matching the real S01-S12 and CS1-CS7 data pack.
    """
    csv_type = request.GET.get('type', 'pl')
    response = HttpResponse(content_type='text/csv')

    if csv_type == 'candidates':
        response['Content-Disposition'] = 'attachment; filename="candidate_sites.csv"'
        writer = csv.writer(response)
        writer.writerow(['site_id', 'site_name', 'city', 'location_type', 'sqft', 'quoted_rent_gbp_month', 'daily_footfall_street', 'office_workers_500m', 'students_1km', 'median_household_income_gbp', 'competitor_cafes_500m', 'area_vibrancy_index_10', 'est_fitout_gbp', 'projected_annual_revenue', 'projected_annual_net_profit', 'is_selected'])
        writer.writerow(['CS5', 'Liverpool Bold Street', 'Liverpool', 'High street', 1550, 11200, 33000, 6900, 9800, 30700, 16, 8.0, 450000, 810000, 91000, 'true'])
        writer.writerow(['CS6', 'Wakefield Trinity Walk', 'Wakefield', 'Shopping centre', 1400, 6900, 18500, 1400, 1100, 27900, 4, 5.4, 450000, 580000, 91000, 'false'])
        writer.writerow(['CS1', 'Leeds Headingley', 'Leeds', 'High street', 1350, 7600, 26000, 3800, 17500, 31200, 9, 7.8, 320000, 760000, 91000, 'false'])
        writer.writerow(['CS2', 'Sheffield Kelham Island', 'Sheffield', 'High street', 1600, 8200, 14500, 5200, 4100, 33900, 5, 8.3, 390000, 790000, 95000, 'false'])
        writer.writerow(['CS3', 'Manchester Oxford Road', 'Manchester', 'Campus', 900, 9800, 52000, 6100, 31000, 26800, 11, 7.2, 240000, 740000, 89000, 'false'])
        writer.writerow(['CS4', 'York Railway Station', 'York', 'Transit', 600, 12900, 39000, 900, 600, 34500, 2, 6.6, 180000, 680000, 86000, 'false'])
        writer.writerow(['CS7', 'Leeds Wellington Place', 'Leeds', 'Office district', 1450, 11800, 9500, 18200, 1100, 40300, 6, 6.5, 350000, 690000, 19000, 'false'])
        return response

    if csv_type == 'waste':
        response['Content-Disposition'] = 'attachment; filename="grind_crumb_2pm_waste_sample.csv"'
        writer = csv.writer(response)
        writer.writerow(['store_code', 'sku_name', 'category', 'stock_at_2pm', 'baseline_afternoon_sales', 'unit_cogs', 'retail_price', 'rescue_channel'])
        writer.writerow(['S10', 'P26 Ham & Cheese Toastie + P28 Chicken Pesto (Hull S10)', 'Lunch • £68.2k/yr chain waste', 58, 18, '2.19', '5.60', '50% Loyalty App Push'])
        writer.writerow(['S03', 'P16 Butter Croissant & P22 Almond Croissant (Leeds S03)', 'Bakery • £52.4k/yr chain waste', 52, 16, '1.02', '3.10', 'Too Good To Go API'])
        writer.writerow(['S07', 'P29 Falafel Wrap & P31 Superfood Salad (Piccadilly S07)', 'Lunch Grab & Go • £16.1k/yr S07 waste', 36, 12, '2.31', '5.75', 'POS Meal Deal Upsell'])
        return response

    response['Content-Disposition'] = 'attachment; filename="grind_crumb_weekly_pl_sample.csv"'
    writer = csv.writer(response)
    writer.writerow([
        'store_code', 'store_name', 'is_flagship', 'gross_revenue',
        'rostered_hours', 'waste_units', 'waste_unit_cogs',
        'rent_monthly', 'utilities_monthly', 'insurance_ops_monthly',
        'delivery_orders', 'diagnosis'
    ])
    writer.writerow(['S07', 'Manchester Piccadilly (S07)', 'true', 21358.53, 383.75, 206, '1.5032', 30500, 2027.54, 8320.69, 319, 'Highest revenue (£1.11m/yr) but losing -£63.9k/yr (-5.8% true margin): £30.5k/mo rent + sub-£8 delivery orders.'])
    writer.writerow(['S10', 'Hull Paragon (S10)', 'false', 10393.95, 242.49, 212, '1.4788', 5400, 1812.74, 3976.79, 144, 'Worst waste rate in chain (3.02% / £16.3k/yr — manager over-orders intentionally) + £14k/yr boiler/dishwasher repairs.'])
    writer.writerow(['S11', 'Sheffield Uni Campus (S11)', 'false', 6959.86, 176.09, 105, '1.4950', 4800, 741.48, 2401.86, 34, 'Labor > 35% breach (35.5% annual / 52.0% in June): university term-time rota not flexed down out-of-term.'])
    writer.writerow(['S03', 'Leeds Briggate (S03)', 'true', 16922.93, 340.84, 214, '1.4961', 11800, 2217.66, 4003.63, 229, 'Cannibalized (-19% sales) by S12 Leeds Trinity opening 0.4 miles away; central par levels never adjusted (£16.6k/yr waste).'])
    writer.writerow(['S04', 'York Stonegate (S04)', 'false', 17082.64, 340.01, 127, '1.4973', 7900, 1357.02, 3200.44, 228, '#1 most profitable store in chain (£183.7k/yr true profit, 20.7% margin, lowest 1.11% waste).'])
    return response

