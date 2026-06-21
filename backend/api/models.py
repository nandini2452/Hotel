from django.db import models
from django.contrib.auth.models import User
from decimal import Decimal

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
    CLEANLINESS_CHOICES = [
        ('clean', 'Clean'),
        ('dirty', 'Dirty'),
    ]
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name='rooms')
    number = models.CharField(max_length=50)
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name='rooms')
    cleanliness = models.CharField(max_length=20, choices=CLEANLINESS_CHOICES, default='clean')

    class Meta:
        unique_together = ('hotel', 'number')

    def __str__(self):
        return f"{self.number} ({self.room_type.name}) - {self.hotel.name} - Cleanliness: {self.cleanliness}"

class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='customer_profile')
    phone = models.CharField(max_length=20, unique=True)
    kyc_type = models.CharField(max_length=50, blank=True, null=True)
    kyc_number = models.CharField(max_length=50, blank=True, null=True)
    kyc_front = models.FileField(upload_to='kyc/', blank=True, null=True)
    kyc_back = models.FileField(upload_to='kyc/', blank=True, null=True)
    kyc_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.phone})"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('Booked', 'Booked'),
        ('Checked_in', 'Checked_in'),
        ('Checked_out', 'Checked_out'),
        ('Cancelled', 'Cancelled'),
        ('Rejected', 'Rejected'),
    ]
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='bookings')
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, related_name='bookings', null=True, blank=True)
    guest_first_name = models.CharField(max_length=100)
    guest_last_name = models.CharField(max_length=100)
    guest_phone = models.CharField(max_length=20)
    guest_email = models.EmailField(blank=True, null=True)
    check_in = models.DateField()
    check_out = models.DateField()
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Booked')
    notes = models.TextField(blank=True, default='')
    extra_charges = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    extra_charges_reason = models.CharField(max_length=255, blank=True, default='')
    checked_out = models.BooleanField(default=False)
    rejection_reason = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.guest_first_name} {self.guest_last_name} - Room {self.room.number} ({self.check_in} to {self.check_out}) - Status: {self.status}"

class Transaction(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('Cash', 'Cash'),
        ('UPI', 'UPI'),
        ('Card', 'Card'),
    ]
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='Cash')
    receipt_id = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Txn for Booking {self.booking.id} - {self.payment_method} - ₹{self.amount}"
