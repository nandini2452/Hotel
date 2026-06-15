from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Hotel, Room, Booking
import datetime

class Command(BaseCommand):
    help = 'Seeds admin, owner, 4 managers, and 2 hotels into the database.'

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
        Room.objects.all().delete()
        Booking.objects.all().delete()
        self.stdout.write('Cleared previous room and booking entries.')

        def seed_rooms_for_hotel(hotel):
            rooms_list = []
            # Standard: STD-101 to STD-105
            for i in range(101, 106):
                rooms_list.append(Room.objects.create(
                    hotel=hotel,
                    number=f"STD-{i}",
                    room_type="Standard",
                    price=1500.00
                ))
            # Deluxe: DLX-116 to DLX-120
            for i in range(116, 121):
                rooms_list.append(Room.objects.create(
                    hotel=hotel,
                    number=f"DLX-{i}",
                    room_type="Deluxe",
                    price=2500.00
                ))
            # Superior: SUP-131 to SUP-133
            for i in range(131, 134):
                rooms_list.append(Room.objects.create(
                    hotel=hotel,
                    number=f"SUP-{i}",
                    room_type="Superior",
                    price=4000.00
                ))
            return rooms_list

        today = datetime.date.today()

        # Seed rooms and bookings for hotel_a
        rooms_a = seed_rooms_for_hotel(hotel_a)
        self.stdout.write(f"Seeded 13 rooms for {hotel_a.name}")
        
        Booking.objects.create(
            room=rooms_a[0],  # STD-101
            guest_first_name="Ramesh",
            guest_last_name="Kumar",
            guest_phone="9876543210",
            guest_email="ramesh@example.com",
            check_in=today,
            check_out=today + datetime.timedelta(days=2),
            status="Reserve",
            advance_paid=500.00
        )
        Booking.objects.create(
            room=rooms_a[5],  # DLX-116
            guest_first_name="Priya",
            guest_last_name="Sharma",
            guest_phone="9876543211",
            guest_email="priya@example.com",
            check_in=today + datetime.timedelta(days=1),
            check_out=today + datetime.timedelta(days=4),
            status="Checked-In",
            advance_paid=1000.00
        )
        Booking.objects.create(
            room=rooms_a[10],  # SUP-131
            guest_first_name="Amit",
            guest_last_name="Patel",
            guest_phone="9876543212",
            guest_email="amit@example.com",
            check_in=today + datetime.timedelta(days=3),
            check_out=today + datetime.timedelta(days=6),
            status="Hold",
            advance_paid=2000.00
        )

        # Seed rooms and bookings for hotel_b
        rooms_b = seed_rooms_for_hotel(hotel_b)
        self.stdout.write(f"Seeded 13 rooms for {hotel_b.name}")

        Booking.objects.create(
            room=rooms_b[1],  # STD-102
            guest_first_name="Suresh",
            guest_last_name="Raina",
            guest_phone="9876543213",
            guest_email="suresh@example.com",
            check_in=today,
            check_out=today + datetime.timedelta(days=3),
            status="Reserve",
            advance_paid=500.00
        )
        Booking.objects.create(
            room=rooms_b[6],  # DLX-117
            guest_first_name="Anjali",
            guest_last_name="Devi",
            guest_phone="9876543214",
            guest_email="anjali@example.com",
            check_in=today + datetime.timedelta(days=2),
            check_out=today + datetime.timedelta(days=5),
            status="Checked-In",
            advance_paid=1500.00
        )

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
