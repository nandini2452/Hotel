from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Hotel

class Command(BaseCommand):
    help = 'Interactively creates an employee (owner or manager) and associates them with a hotel.'

    def handle(self, *args, **options):
        self.stdout.write('--- Create New Employee ---')
        
        # 1. Get Hotel Code
        hotel = None
        while not hotel:
            hotel_code = input('Enter Hotel Code: ').strip()
            if not hotel_code:
                self.stdout.write('Hotel code cannot be empty.')
                continue
            try:
                hotel = Hotel.objects.get(code=hotel_code)
                self.stdout.write(f'Associated with Hotel: {hotel.name}')
            except Hotel.DoesNotExist:
                self.stdout.write(f'Hotel with code "{hotel_code}" does not exist.')

        # 2. Get Employee Username
        username = ''
        user = None
        while not username:
            username = input('Enter Employee Username: ').strip()
            if not username:
                self.stdout.write('Username cannot be empty.')
                continue
            
            try:
                user = User.objects.get(username=username)
                self.stdout.write(f'User "{username}" already exists.')
                use_existing = input('Do you want to use this existing user? (y/n): ').strip().lower()
                if use_existing != 'y':
                    username = ''
                    user = None
            except User.DoesNotExist:
                # Need password to create new user
                password = ''
                while not password:
                    password = input(f'Enter password for "{username}": ').strip()
                user = User.objects.create_user(username=username, password=password)
                user.is_staff = True
                user.save()
                self.stdout.write(f'Created new user "{username}".')

        # 3. Get Role (Manager or Owner)
        role = ''
        while role not in ['owner', 'manager']:
            role = input('Is this employee an Owner or a Manager? (owner/manager): ').strip().lower()
            if role not in ['owner', 'manager']:
                self.stdout.write('Please enter "owner" or "manager".')

        # 4. Associate with Hotel
        if role == 'owner':
            hotel.owner = user
            hotel.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully assigned "{username}" as the Owner of {hotel.name}.'))
        else:
            hotel.managers.add(user)
            self.stdout.write(self.style.SUCCESS(f'Successfully assigned "{username}" as a Manager of {hotel.name}.'))
