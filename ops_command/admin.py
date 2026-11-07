from django.contrib import admin
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


@admin.register(Store)
class StoreAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'is_flagship', 'hourly_wage_rate', 'cogs_ratio')
    list_filter = ('is_flagship',)
    search_fields = ('code', 'name')


@admin.register(DailyStoreSale)
class DailyStoreSaleAdmin(admin.ModelAdmin):
    list_display = ('store', 'date', 'gross_revenue', 'delivery_orders_count', 'avg_delivery_basket')
    list_filter = ('store', 'date')


@admin.register(StaffRotaWeekly)
class StaffRotaWeeklyAdmin(admin.ModelAdmin):
    list_display = ('store', 'week_start', 'rostered_hours', 'employer_on_cost_multiplier')
    list_filter = ('store', 'week_start')


@admin.register(WasteLog)
class WasteLogAdmin(admin.ModelAdmin):
    list_display = ('store', 'date', 'sku_name', 'units_discarded', 'unit_cogs', 'retail_price')
    list_filter = ('store', 'date')


@admin.register(StoreCostMonthly)
class StoreCostMonthlyAdmin(admin.ModelAdmin):
    list_display = ('store', 'rent_monthly', 'utilities_monthly', 'insurance_ops_monthly')


@admin.register(DeliveryPolicyConfig)
class DeliveryPolicyConfigAdmin(admin.ModelAdmin):
    list_display = ('minimum_order_value', 'menu_markup_pct', 'cogs_pct', 'bundle_only_enabled', 'updated_at')


@admin.register(AfternoonSurplusPrediction)
class AfternoonSurplusPredictionAdmin(admin.ModelAdmin):
    list_display = ('store', 'sku_name', 'stock_at_2pm', 'baseline_afternoon_sales', 'rescue_channel', 'is_rescued')
    list_filter = ('store', 'is_rescued')


@admin.register(AlertEvent)
class AlertEventAdmin(admin.ModelAdmin):
    list_display = ('created_at', 'store_name', 'severity', 'message')
    list_filter = ('severity', 'store_name')


@admin.register(CandidateSite)
class CandidateSiteAdmin(admin.ModelAdmin):
    list_display = ('site_code', 'city_location', 'catchment_type', 'projected_annual_revenue', 'projected_annual_net_profit', 'setup_capex', 'is_selected')
    list_filter = ('is_selected',)

