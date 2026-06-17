from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from api.models import Hotel, RoomType, Room, Booking, Transaction
import datetime

class Command(BaseCommand):
    help = 'Seeds admin, owner, 4 managers, and 2 hotels into the database with updated RoomType, DateTime checks, and Transactions.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data with 1 Admin, 1 Owner, 4 custom Managers, and 2 Hotels...')

        # 1. Create/Update Admin (Separate Superuser)
        admin_user, created = User.objects.get_or_create(username='admin')
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        self.stdout.write('Created/updated Superuser Admin: admin (password: admin123)')

        # 2. Create/Update Owner (Regular staff user, non-superuser)
        owner, created = User.objects.get_or_create(username='owner')
        owner.set_password('678')
        owner.is_staff = True
        owner.is_superuser = False
        owner.save()
        self.stdout.write('Created/updated Owner: owner (password: 678, superuser: False)')
        
        # 3. Define custom managers A, B, C, D and passwords
        manager_data = [
            {"username": "A", "password": "111"},
            {"username": "B", "password": "222"},
            {"username": "C", "password": "333"},
            {"username": "D", "password": "444"},
        ]
        
        seeded_managers = {}
        for m_info in manager_data:
            username = m_info["username"]
            pwd = m_info["password"]
            manager, created = User.objects.get_or_create(username=username)
            manager.set_password(pwd)
            manager.save()
            self.stdout.write(f'Created/updated Manager: {username} (password: {pwd})')
            seeded_managers[username] = manager

        # Delete any pre-existing hotels to ensure clean manager mapping
        Hotel.objects.all().delete()
        self.stdout.write('Cleared previous hotel entries.')

        # 4. Create Abhirami Hotel (Code: ABH01)
        hotel_a = Hotel.objects.create(
            name='Abhirami Hotel',
            code='ABH01',
            owner=owner
        )
        hotel_a.managers.add(seeded_managers['A'], seeded_managers['B'])
        self.stdout.write(f"Seeded Hotel: {hotel_a.name} (Code: {hotel_a.code}) with managers A & B")

        # 5. Create Abhirami Lodge (Code: ABL02)
        hotel_b = Hotel.objects.create(
            name='Abhirami Lodge',
            code='ABL02',
            owner=owner
        )
        hotel_b.managers.add(seeded_managers['C'], seeded_managers['D'])
        self.stdout.write(f"Seeded Hotel: {hotel_b.name} (Code: {hotel_b.code}) with managers C & D")

        # Clear existing Rooms and Bookings to prevent duplicates
        RoomType.objects.all().delete()
        Room.objects.all().delete()
        Booking.objects.all().delete()
        Transaction.objects.all().delete()
        self.stdout.write('Cleared previous RoomTypes, rooms, booking, and transaction entries.')

        # Create Room Types for Hotel A and Hotel B
        def seed_room_types_for_hotel(hotel):
            std = RoomType.objects.create(hotel=hotel, name="Standard", price=1500.00)
            dlx = RoomType.objects.create(hotel=hotel, name="Deluxe", price=2500.00)
            sup = RoomType.objects.create(hotel=hotel, name="Superior", price=4000.00)
            return {"Standard": std, "Deluxe": dlx, "Superior": sup}

        types_a = seed_room_types_for_hotel(hotel_a)
        types_b = seed_room_types_for_hotel(hotel_b)
        self.stdout.write("Seeded RoomTypes (Standard, Deluxe, Superior) for both hotels.")

        def seed_rooms_for_hotel(hotel, types_dict):
            rooms_list = []
            # Standard: STD-101 to STD-105
            for i in range(101, 106):
                rooms_list.append(Room.objects.create(
                    hotel=hotel,
                    number=f"STD-{i}",
                    room_type=types_dict["Standard"]
                ))
            # Deluxe: DLX-116 to DLX-120
            for i in range(116, 121):
                rooms_list.append(Room.objects.create(
                    hotel=hotel,
                    number=f"DLX-{i}",
                    room_type=types_dict["Deluxe"]
                ))
            # Superior: SUP-131 to SUP-133
            for i in range(131, 134):
                rooms_list.append(Room.objects.create(
                    hotel=hotel,
                    number=f"SUP-{i}",
                    room_type=types_dict["Superior"]
                ))
            return rooms_list

        today = timezone.localdate()

        def make_dt(date_val, time_str="11:30 AM"):
            t = datetime.datetime.strptime(time_str, "%I:%M %p").time()
            dt = datetime.datetime.combine(date_val, t)
            return timezone.make_aware(dt)

        # Seed rooms and bookings for hotel_a
        rooms_a = seed_rooms_for_hotel(hotel_a, types_a)
        self.stdout.write(f"Seeded 13 rooms for {hotel_a.name}")
        
        b1 = Booking.objects.create(
            room=rooms_a[0],  # STD-101
            guest_first_name="Ramesh",
            guest_last_name="Kumar",
            guest_phone="9876543210",
            guest_email="ramesh@example.com",
            check_in=make_dt(today),
            check_out=make_dt(today + datetime.timedelta(days=2)),
            status="Booked",
            notes="Wants early check-in if possible."
        )
        Transaction.objects.create(
            booking=b1,
            amount=500.00,
            payment_method="Cash",
            receipt_id="REC-001"
        )

        b2 = Booking.objects.create(
            room=rooms_a[5],  # DLX-116
            guest_first_name="Priya",
            guest_last_name="Sharma",
            guest_phone="9876543211",
            guest_email="priya@example.com",
            check_in=make_dt(today + datetime.timedelta(days=1)),
            check_out=make_dt(today + datetime.timedelta(days=4)),
            status="Checked_in",
            notes="Needs extra towels."
        )
        Transaction.objects.create(
            booking=b2,
            amount=1000.00,
            payment_method="UPI",
            receipt_id="REC-002"
        )

        # Seed a dirty room to verify the cleaning interface works out of the box
        b3 = Booking.objects.create(
            room=rooms_a[10],  # SUP-131
            guest_first_name="Amit",
            guest_last_name="Patel",
            guest_phone="9876543212",
            guest_email="amit@example.com",
            check_in=make_dt(today - datetime.timedelta(days=2)),
            check_out=make_dt(today),
            status="dirty",
            notes="Already checked out. Waiting for housekeeping."
        )
        Transaction.objects.create(
            booking=b3,
            amount=2000.00,
            payment_method="Card",
            receipt_id="REC-003"
        )
        Transaction.objects.create(
            booking=b3,
            amount=2000.00,
            payment_method="Cash",
            receipt_id="REC-004"
        )

        # Seed rooms and bookings for hotel_b
        rooms_b = seed_rooms_for_hotel(hotel_b, types_b)
        self.stdout.write(f"Seeded 13 rooms for {hotel_b.name}")

        b4 = Booking.objects.create(
            room=rooms_b[1],  # STD-102
            guest_first_name="Suresh",
            guest_last_name="Raina",
            guest_phone="9876543213",
            guest_email="suresh@example.com",
            check_in=make_dt(today),
            check_out=make_dt(today + datetime.timedelta(days=3)),
            status="Booked"
        )
        Transaction.objects.create(
            booking=b4,
            amount=500.00,
            payment_method="UPI",
            receipt_id="REC-005"
        )

        b5 = Booking.objects.create(
            room=rooms_b[6],  # DLX-117
            guest_first_name="Anjali",
            guest_last_name="Devi",
            guest_phone="9876543214",
            guest_email="anjali@example.com",
            check_in=make_dt(today + datetime.timedelta(days=2)),
            check_out=make_dt(today + datetime.timedelta(days=5)),
            status="Checked_in"
        )
        Transaction.objects.create(
            booking=b5,
            amount=1500.00,
            payment_method="Cash",
            receipt_id="REC-006"
        )

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
