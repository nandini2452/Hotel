from django.db import models
from django.contrib.auth.models import User

class Hotel(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_hotels')
    managers = models.ManyToManyField(User, related_name='managed_hotels')

    def __str__(self):
        return f"{self.name} ({self.code})"

class Room(models.Model):
    ROOM_TYPES = [
        ('Standard', 'Standard'),
        ('Deluxe', 'Deluxe'),
        ('Superior', 'Superior'),
    ]
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    number = models.CharField(max_length=50)
    room_type = models.CharField(max_length=50, choices=ROOM_TYPES)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    class Meta:
        unique_together = ('hotel', 'number')

    def __str__(self):
        return f"{self.number} ({self.room_type}) - {self.hotel.name}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('Hold', 'Hold'),
        ('Temp Reserve', 'Temp Reserve'),
        ('Reserve', 'Reserve'),
        ('Checked-In', 'Checked-In'),
    ]
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    guest_first_name = models.CharField(max_length=100)
    guest_last_name = models.CharField(max_length=100)
    guest_phone = models.CharField(max_length=20)
    guest_email = models.EmailField(blank=True, null=True)
    check_in = models.DateField()
    check_in_time = models.CharField(max_length=10, default="12:00 PM")
    check_out = models.DateField()
    check_out_time = models.CharField(max_length=10, default="12:00 PM")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Reserve')
    advance_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.guest_first_name} {self.guest_last_name} - Room {self.room.number} ({self.check_in} {self.check_in_time} to {self.check_out} {self.check_out_time})"

