from django.db import models
from django.contrib.auth.models import User

class Hotel(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_hotels')
    managers = models.ManyToManyField(User, related_name='managed_hotels')

    def __str__(self):
        return f"{self.name} ({self.code})"

class RoomType(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='room_types')
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('hotel', 'name')

    def __str__(self):
        return f"{self.name} - {self.hotel.name} (₹{self.price})"

class Room(models.Model):
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    number = models.CharField(max_length=50)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rooms')

    class Meta:
        unique_together = ('hotel', 'number')

    def __str__(self):
        return f"{self.number} ({self.room_type.name}) - {self.hotel.name}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('Booked', 'Booked'),
        ('Checked_in', 'Checked_in'),
        ('dirty', 'dirty'),
    ]
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    guest_first_name = models.CharField(max_length=100)
    guest_last_name = models.CharField(max_length=100)
    guest_phone = models.CharField(max_length=20)
    guest_email = models.EmailField(blank=True, null=True)
    check_in = models.DateTimeField()
    check_out = models.DateTimeField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Booked')
    ADVANCE_STATUS_CHOICES = [
        ('Paid', 'Paid'),
        ('Unpaid', 'Unpaid'),
    ]
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    advance_status = models.CharField(max_length=20, choices=ADVANCE_STATUS_CHOICES, default='Paid')

    def __str__(self):
        return f"{self.guest_first_name} {self.guest_last_name} - Room {self.room.number} ({self.check_in} to {self.check_out}) - Status: {self.status}"

