from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Hotel

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

        self.stdout.write(self.style.SUCCESS('Seeding complete!'))
