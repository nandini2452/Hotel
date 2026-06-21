from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework.authtoken.models import Token
from .models import Hotel, RoomType, Room, Booking, Transaction
import datetime

class TransactionReportingTests(APITestCase):
    def setUp(self):
        # Create Owner/Manager user
        self.manager_user = User.objects.create_user(username='manager', password='password123')
        self.manager_token, _ = Token.objects.get_or_create(user=self.manager_user)

        # Create Customer user
        self.customer_user = User.objects.create_user(username='customer@example.com', password='password123')
        self.customer_token, _ = Token.objects.get_or_create(user=self.customer_user)

        # Create Hotel
        self.hotel = Hotel.objects.create(
            name="Test Grand Hotel",
            code="TGH01",
            owner=self.manager_user
        )
        self.hotel.managers.add(self.manager_user)

        # Create RoomType and Room
        self.room_type = RoomType.objects.create(
            hotel=self.hotel,
            name="Standard",
            price=1500.00
        )
        self.room = Room.objects.create(
            hotel=self.hotel,
            room_type=self.room_type,
            number="101"
        )

        from .models import Customer
        self.customer_profile = Customer.objects.create(
            user=self.customer_user,
            phone="9999999999"
        )

    def test_booking_creation_and_transaction(self):
        # 1. Post to create a booking as a customer
        url = f"/api/my-hotel/bookings/?hotel_code={self.hotel.code}"
        today_str = datetime.date.today().strftime('%Y-%m-%d')
        tomorrow_str = (datetime.date.today() + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

        data = {
            "room_type": "Standard",
            "guest_first_name": "John",
            "guest_last_name": "Doe",
            "guest_phone": "9999999999",
            "guest_email": "customer@example.com",
            "check_in": today_str,
            "check_out": tomorrow_str,
            "status": "Booked",
            "advance_paid": 500.00,
            "payment_method": "Cash",
            "hotel_code": self.hotel.code
        }

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.customer_token.key}')
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'Booked')
        self.assertEqual(response.data['advance_paid'], 500.00)

        # Check transaction was created in DB
        booking_id = response.data['id']
        txns = Transaction.objects.filter(booking_id=booking_id)
        self.assertEqual(txns.count(), 1)
        self.assertEqual(txns[0].amount, 500.00)

    def test_manager_rejection_with_refund(self):
        # 1. Manually create a booking in the database
        today = datetime.date.today()
        tomorrow = today + datetime.timedelta(days=1)
        booking = Booking.objects.create(
            room=self.room,
            customer=self.customer_profile,
            guest_first_name="Jane",
            guest_last_name="Doe",
            guest_phone="9999999999",
            guest_email="customer@example.com",
            check_in=today,
            check_out=tomorrow,
            status="Booked",
            extra_charges=0.00
        )

        # Create a payment transaction for this booking
        Transaction.objects.create(
            booking=booking,
            amount=1000.00,
            payment_method="Card",
            receipt_id="REC-999"
        )

        # 2. Reject booking as manager with a refund query param
        delete_url = f"/api/my-hotel/bookings/{booking.id}/?hotel_code={self.hotel.code}&refund=1000.00&method=UPI&reason=Documents+incomplete"
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.manager_token.key}')
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 3. Verify status set to Rejected
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'Rejected')
        self.assertEqual(booking.rejection_reason, 'Documents incomplete')

        # 4. Verify refund transaction is logged in DB
        txns = Transaction.objects.filter(booking=booking).order_by('created_at')
        self.assertEqual(txns.count(), 2)
        # first is payment
        self.assertEqual(txns[0].amount, 1000.00)
        # second is refund
        self.assertEqual(txns[1].amount, -1000.00)
        self.assertEqual(txns[1].payment_method, 'UPI')
        self.assertEqual(txns[1].receipt_id, f"REF-{booking.id}")

        # 5. Verify serialized response contains both transactions
        list_url = f"/api/my-hotel/bookings/?hotel_code={self.hotel.code}"
        get_response = self.client.get(list_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)

        # Find our booking
        booking_data = next(b for b in get_response.data if b['id'] == booking.id)
        self.assertEqual(len(booking_data['transactions']), 2)
        self.assertEqual(float(booking_data['transactions'][0]['amount']), 1000.00)
        self.assertEqual(float(booking_data['transactions'][1]['amount']), -1000.00)
        self.assertEqual(booking_data['transactions'][1]['payment_method'], 'UPI')
        self.assertEqual(booking_data['transactions'][1]['receipt_id'], f"REF-{booking.id}")

    def test_export_transactions_excel(self):
        # 1. Create a booking and transactions
        today = datetime.date.today()
        tomorrow = today + datetime.timedelta(days=1)
        booking = Booking.objects.create(
            room=self.room,
            customer=self.customer_profile,
            guest_first_name="John",
            guest_last_name="Doe",
            guest_phone="9999999999",
            guest_email="customer@example.com",
            check_in=today,
            check_out=tomorrow,
            status="Checked_in",
            extra_charges=150.00,
            extra_charges_reason="Late Checkout"
        )
        Transaction.objects.create(
            booking=booking,
            amount=2000.00,
            payment_method="Cash",
            receipt_id="REC-EXCEL-TEST"
        )

        # 2. Request Excel Export
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.manager_token.key}')
        export_url = f"/api/my-hotel/transactions/export/?hotel_code={self.hotel.code}&filter=today"
        response = self.client.get(export_url)

        # 3. Assert Excel Sheet Output Type
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        self.assertTrue(len(response.content) > 0)

    def test_manager_cancel_reservation(self):
        # 1. Create a booking
        today = datetime.date.today()
        tomorrow = today + datetime.timedelta(days=1)
        booking = Booking.objects.create(
            room=self.room,
            customer=self.customer_profile,
            guest_first_name="Jane",
            guest_last_name="Doe",
            guest_phone="9999999999",
            guest_email="customer@example.com",
            check_in=today,
            check_out=tomorrow,
            status="Booked"
        )
        # Create a payment transaction for this booking
        Transaction.objects.create(
            booking=booking,
            amount=500.00,
            payment_method="UPI",
            receipt_id="REC-CANCEL-TEST"
        )

        # 2. Cancel reservation as manager (action=cancel)
        delete_url = f"/api/my-hotel/bookings/{booking.id}/?hotel_code={self.hotel.code}&refund=450.00&method=UPI&reason=Got+a+different+hotel+nearby&action=cancel"
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.manager_token.key}')
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detail'], 'Booking cancelled successfully.')

        # 3. Verify status set to Cancelled
        booking.refresh_from_db()
        self.assertEqual(booking.status, 'Cancelled')
        self.assertEqual(booking.rejection_reason, 'Got a different hotel nearby')

        # 4. Verify refund transaction is logged in DB
        txns = Transaction.objects.filter(booking=booking).order_by('created_at')
        self.assertEqual(txns.count(), 2)
        # first is payment
        self.assertEqual(txns[0].amount, 500.00)
        # second is refund
        self.assertEqual(txns[1].amount, -450.00)
        self.assertEqual(txns[1].payment_method, 'UPI')
        self.assertEqual(txns[1].receipt_id, f"REF-{booking.id}")



