from django.urls import path
from . import views

urlpatterns = [
    path('hotels/', views.list_hotels, name='list_hotels'),
    path('login/', views.login_view, name='login'),
    path('my-hotel/', views.my_hotel_details, name='my_hotel_details'),
    path('my-hotel/rooms/', views.my_hotel_rooms, name='my_hotel_rooms'),
    path('my-hotel/bookings/', views.my_hotel_bookings, name='my_hotel_bookings'),
]
