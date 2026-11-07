from decimal import Decimal
from django.db import models


class Store(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    is_flagship = models.BooleanField(default=False)
    hourly_wage_rate = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('12.75'))
    cogs_ratio = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('0.28'))
    diagnosis_note = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.name} ({self.code})"


class DailyStoreSale(models.Model):
    """Represents `daily_store_sales` table in the specification."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='daily_sales')
    date = models.DateField()
    gross_revenue = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_orders_count = models.IntegerField(default=0)
    avg_delivery_basket = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('6.50'))

    class Meta:
        ordering = ['-date']


class StaffRotaWeekly(models.Model):
    """Represents `staff_rota_weekly` table in the specification."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='weekly_rotas')
    week_start = models.DateField()
    rostered_hours = models.DecimalField(max_digits=7, decimal_places=2)
    employer_on_cost_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('1.13'))

    @property
    def total_labor_cost(self) -> Decimal:
        return self.rostered_hours * self.store.hourly_wage_rate * self.employer_on_cost_multiplier


class WasteLog(models.Model):
    """Represents `waste_log` table in the specification."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='waste_logs')
    date = models.DateField()
    sku_name = models.CharField(max_length=120)
    units_discarded = models.IntegerField()
    unit_cogs = models.DecimalField(max_digits=6, decimal_places=2)
    retail_price = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('5.50'))

    @property
    def total_waste_cost(self) -> Decimal:
        return Decimal(self.units_discarded) * self.unit_cogs


class StoreCostMonthly(models.Model):
    """Represents `store_costs_monthly` table in the specification."""
    store = models.OneToOneField(Store, on_delete=models.CASCADE, related_name='monthly_cost')
    rent_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    utilities_monthly = models.DecimalField(max_digits=10, decimal_places=2)
    insurance_ops_monthly = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def weekly_pro_rata_cost(self) -> Decimal:
        total_monthly = self.rent_monthly + self.utilities_monthly + self.insurance_ops_monthly
        return (total_monthly * Decimal('12.0')) / Decimal('52.0')


class DeliveryPolicyConfig(models.Model):
    """Stores the active Module 2 Third-Party Delivery Simulator settings."""
    minimum_order_value = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal('6.00'))
    menu_markup_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('0.00'))
    cogs_pct = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('28.00'))
    bundle_only_enabled = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)


class AfternoonSurplusPrediction(models.Model):
    """Represents Module 3 2:00 PM Dynamic End-of-Day Waste Predictor items."""
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='surplus_predictions')
    sku_name = models.CharField(max_length=120)
    category = models.CharField(max_length=80)
    stock_at_2pm = models.IntegerField()
    baseline_afternoon_sales = models.IntegerField()
    unit_cogs = models.DecimalField(max_digits=6, decimal_places=2)
    retail_price = models.DecimalField(max_digits=6, decimal_places=2)
    rescue_channel = models.CharField(max_length=100)
    rescue_protocol_desc = models.CharField(max_length=200)
    recovered_per_unit = models.DecimalField(max_digits=6, decimal_places=2)
    is_rescued = models.BooleanField(default=False)


class AlertEvent(models.Model):
    """Real-time Early Warning Alert log (Module 1)."""
    SEVERITY_CHOICES = [
        ('critical', 'Critical'),
        ('warning', 'Warning'),
        ('info', 'Info'),
    ]
    store_name = models.CharField(max_length=100)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='warning')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class CandidateSite(models.Model):
    """Represents candidate expansion locations from `candidate_sites.csv`
    for the CEO Decision Simulator (Chain Net Profit £922k & Payback on £1.5m CapEx).
    """
    site_code = models.CharField(max_length=20, unique=True)
    city_location = models.CharField(max_length=120)
    catchment_type = models.CharField(max_length=80, default='Commuter & High Street')
    projected_annual_revenue = models.DecimalField(max_digits=12, decimal_places=2)
    projected_annual_net_profit = models.DecimalField(max_digits=10, decimal_places=2)
    setup_capex = models.DecimalField(max_digits=10, decimal_places=2)
    is_selected = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.city_location} ({self.site_code})"

