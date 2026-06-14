from django.contrib import admin
from django.contrib.auth.models import Group
from .models import Hotel

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
