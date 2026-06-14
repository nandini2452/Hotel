from django.urls import path
from . import views

urlpatterns = [
    path('hotels/', views.list_hotels, name='list_hotels'),
    path('login/', views.login_view, name='login'),
    path('my-hotel/', views.my_hotel_details, name='my_hotel_details'),
]
