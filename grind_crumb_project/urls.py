from django.contrib import admin
from django.urls import path
from ops_command import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.dashboard_home, name='dashboard_home'),
    path('presentation/', views.presentation_view, name='presentation_view'),
    path('api/dashboard/', views.api_dashboard_state, name='api_dashboard_state'),
    path('api/store-log/', views.api_log_store_operation, name='api_log_store_operation'),
    path('api/delivery-policy/', views.api_update_delivery_policy, name='api_update_delivery_policy'),
    path('api/waste-rescue/', views.api_trigger_waste_rescue, name='api_trigger_waste_rescue'),
    path('api/candidate-site/', views.api_toggle_candidate_site, name='api_toggle_candidate_site'),
    path('api/upload-csv/', views.api_upload_csv, name='api_upload_csv'),
    path('api/sample-csv/', views.api_sample_csv, name='api_sample_csv'),
    path('api/reset/', views.api_reset_demo, name='api_reset_demo'),
]
