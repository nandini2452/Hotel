from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Hotel, Room, Booking

# Unregister the default Group model to keep the admin interface clean
try:
    admin.site.unregister(Group)
except admin.sites.NotRegistered:
    pass

@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'owner')
    search_fields = ('name', 'code')
    filter_horizontal = ('managers',)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('number', 'room_type', 'price', 'hotel')
    list_filter = ('room_type', 'hotel')
    search_fields = ('number',)

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('room', 'guest_first_name', 'guest_last_name', 'check_in', 'check_out', 'status', 'advance_paid')
    list_filter = ('status', 'check_in', 'check_out', 'room__hotel')
    search_fields = ('guest_first_name', 'guest_last_name', 'guest_phone', 'room__number')

