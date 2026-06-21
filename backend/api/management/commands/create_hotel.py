from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Hotel, RoomType, Room

class Command(BaseCommand):
    help = 'Interactively creates a hotel with default room types and standard rooms.'

    def handle(self, *args, **options):
        self.stdout.write('--- Create New Hotel ---')
        
        # 1. Get Hotel Name
        name = ''
        while not name:
            name = input('Enter Hotel Name: ').strip()
            if not name:
                self.stdout.write('Hotel name cannot be empty.')
                
        # 2. Get Hotel Code
        code = ''
        while not code:
            code = input('Enter Hotel Code: ').strip()
            if not code:
                self.stdout.write('Hotel code cannot be empty.')
            elif Hotel.objects.filter(code=code).exists():
                self.stdout.write(f'Hotel with code "{code}" already exists. Please use a unique code.')
                code = ''

        # 3. Get or Create Owner
        owner_username = ''
        owner_user = None
        while not owner_user:
            owner_username = input('Enter Owner Username: ').strip()
            if not owner_username:
                self.stdout.write('Owner username cannot be empty.')
                continue
            
            try:
                owner_user = User.objects.get(username=owner_username)
                self.stdout.write(f'Using existing user "{owner_username}" as owner.')
            except User.DoesNotExist:
                create_choice = input(f'User "{owner_username}" does not exist. Create new user? (y/n): ').strip().lower()
                if create_choice == 'y':
                    password = ''
                    while not password:
                        password = input(f'Enter password for "{owner_username}": ').strip()
                    owner_user = User.objects.create_user(username=owner_username, password=password)
                    owner_user.is_staff = True
                    owner_user.save()
                    self.stdout.write(f'Created new user "{owner_username}".')
                else:
                    self.stdout.write('Please enter an existing username or choose to create a new one.')

        # 4. Create the Hotel
        hotel = Hotel.objects.create(name=name, code=code, owner=owner_user)
        self.stdout.write(self.style.SUCCESS(f'Successfully created hotel: {hotel.name} ({hotel.code})'))

        # 5. Create Room Types
        std, _ = RoomType.objects.get_or_create(hotel=hotel, name="Standard", defaults={"price": 1500.00})
        dlx, _ = RoomType.objects.get_or_create(hotel=hotel, name="Deluxe", defaults={"price": 2500.00})
        sup, _ = RoomType.objects.get_or_create(hotel=hotel, name="Superior", defaults={"price": 4000.00})
        self.stdout.write('Created standard room types (Standard: Rs. 1500, Deluxe: Rs. 2500, Superior: Rs. 4000).')

        # 6. Create Default Rooms
        rooms_created = 0
        # Standard: STD-101 to STD-105
        for i in range(101, 106):
            Room.objects.get_or_create(hotel=hotel, number=f"STD-{i}", defaults={"room_type": std})
            rooms_created += 1
        # Deluxe: DLX-116 to DLX-120
        for i in range(116, 121):
            Room.objects.get_or_create(hotel=hotel, number=f"DLX-{i}", defaults={"room_type": dlx})
            rooms_created += 1
        # Superior: SUP-131 to SUP-133
        for i in range(131, 134):
            Room.objects.get_or_create(hotel=hotel, number=f"SUP-{i}", defaults={"room_type": sup})
            rooms_created += 1
            
        self.stdout.write(self.style.SUCCESS(f'Created {rooms_created} default rooms for {hotel.name}.'))
