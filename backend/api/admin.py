from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Hotel, RoomType, Room, Booking

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

@admin.register(RoomType)
class RoomTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'hotel')
    list_filter = ('hotel',)
    search_fields = ('name',)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('number', 'room_type', 'get_price', 'hotel')
    list_filter = ('room_type__name', 'hotel')
    search_fields = ('number',)

    def get_price(self, obj):
        return obj.room_type.price
    get_price.short_description = 'Price'

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('room', 'guest_first_name', 'guest_last_name', 'check_in', 'check_out', 'status', 'advance_paid')
    list_filter = ('status', 'check_in', 'check_out', 'room__hotel')
    search_fields = ('guest_first_name', 'guest_last_name', 'guest_phone', 'room__number')
