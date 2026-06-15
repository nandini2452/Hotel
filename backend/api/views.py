from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
import datetime
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Hotel, Room, Booking

@api_view(['GET'])
@permission_classes([AllowAny])
def list_hotels(request):
    """
    List all hotels with names and codes. (Public)
    """
    hotels = Hotel.objects.all().order_by('name')
    data = [{"id": h.id, "name": h.name, "code": h.code} for h in hotels]
    return Response(data, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Custom login view. Requires username, password, and hotel_code.
    Checks authentication and authorization for that specific hotel.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    hotel_code = request.data.get('hotel_code')

    if not username or not password:
        return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
    
    if not hotel_code:
        return Response({"detail": "Please select a hotel code."}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Authenticate user
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({"detail": "Invalid username or password."}, status=status.HTTP_400_BAD_REQUEST)

    # 2. Get hotel by code
    try:
        hotel = Hotel.objects.get(code=hotel_code)
    except Hotel.DoesNotExist:
        return Response({"detail": "Hotel with the specified code does not exist."}, status=status.HTTP_404_NOT_FOUND)

    # 3. Check if user is owner or manager of that hotel
    is_owner = hotel.owner == user
    is_manager = hotel.managers.filter(id=user.id).exists()

    if not (is_owner or is_manager):
        return Response({"detail": f"User {username} is not authorized for hotel {hotel.name}."}, status=status.HTTP_403_FORBIDDEN)

    # 4. Generate/Retrieve Token
    token, _ = Token.objects.get_or_create(user=user)

    return Response({
        "token": token.key,
        "username": user.username,
        "hotel_name": hotel.name,
        "hotel_code": hotel.code
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_hotel_details(request):
    """
    Get details for all hotels associated with the logged-in user. (Authenticated)
    """
    user = request.user
    # Fetch hotels where the user is owner or manager
    hotels = Hotel.objects.filter(Q(owner=user) | Q(managers=user)).distinct().order_by('name')
    
    data = []
    for h in hotels:
        data.append({
            "id": h.id,
            "name": h.name,
            "code": h.code,
            "owner": {
                "id": h.owner.id,
                "username": h.owner.username
            },
            "managers": [{"id": m.id, "username": m.username} for m in h.managers.all()]
        })
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_hotel_rooms(request):
    """
    Get rooms list for the specified hotel.
    Query param: hotel_code
    """
    user = request.user
    hotel_code = request.query_params.get('hotel_code')
    if not hotel_code:
        return Response({"detail": "hotel_code query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        hotel = Hotel.objects.get(code=hotel_code)
    except Hotel.DoesNotExist:
        return Response({"detail": "Hotel not found."}, status=status.HTTP_404_NOT_FOUND)

    # Check if user is owner or manager of this hotel
    is_owner = hotel.owner == user
    is_manager = hotel.managers.filter(id=user.id).exists()
    if not (is_owner or is_manager):
        return Response({"detail": "Not authorized for this hotel."}, status=status.HTTP_403_FORBIDDEN)

    rooms = hotel.rooms.all().order_by('room_type', 'number')
    data = []
    for r in rooms:
        min_advance = 0.00
        if r.room_type == 'Standard':
            min_advance = 500.00
        elif r.room_type == 'Deluxe':
            min_advance = 1000.00
        elif r.room_type == 'Superior':
            min_advance = 2000.00
            
        data.append({
            "id": r.id,
            "number": r.number,
            "room_type": r.room_type,
            "price": r.price,
            "min_advance": min_advance
        })
    return Response(data, status=status.HTTP_200_OK)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_hotel_bookings(request):
    """
    Manage bookings for the specified hotel.
    GET: List bookings for the hotel.
    POST: Create a new booking for the hotel.
    """
    user = request.user
    
    if request.method == 'GET':
        hotel_code = request.query_params.get('hotel_code')
        if not hotel_code:
            return Response({"detail": "hotel_code query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            hotel = Hotel.objects.get(code=hotel_code)
        except Hotel.DoesNotExist:
            return Response({"detail": "Hotel not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check if user is owner or manager
        is_owner = hotel.owner == user
        is_manager = hotel.managers.filter(id=user.id).exists()
        if not (is_owner or is_manager):
            return Response({"detail": "Not authorized for this hotel."}, status=status.HTTP_403_FORBIDDEN)

        bookings = Booking.objects.filter(room__hotel=hotel)
        data = []
        for b in bookings:
            data.append({
                "id": b.id,
                "room_id": b.room.id,
                "room_number": b.room.number,
                "room_type": b.room.room_type,
                "guest_first_name": b.guest_first_name,
                "guest_last_name": b.guest_last_name,
                "guest_phone": b.guest_phone,
                "guest_email": b.guest_email,
                "check_in": b.check_in.strftime('%Y-%m-%d'),
                "check_in_time": b.check_in_time,
                "check_out": b.check_out.strftime('%Y-%m-%d'),
                "check_out_time": b.check_out_time,
                "status": b.status,
                "advance_paid": b.advance_paid,
                "advance_status": b.advance_status
            })
        return Response(data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Add a quick reservation
        room_id = request.data.get('room_id')
        guest_first_name = request.data.get('guest_first_name')
        guest_last_name = request.data.get('guest_last_name')
        guest_phone = request.data.get('guest_phone')
        guest_email = request.data.get('guest_email')
        check_in = request.data.get('check_in')
        check_in_time = request.data.get('check_in_time', '12:00 PM')
        check_out = request.data.get('check_out')
        check_out_time = request.data.get('check_out_time', '12:00 PM')
        status_val = request.data.get('status', 'Reserve')
        advance_paid = request.data.get('advance_paid', 0.00)
        advance_status_val = request.data.get('advance_status', 'Paid')

        if not all([room_id, guest_first_name, guest_last_name, guest_phone, check_in, check_out]):
            return Response({"detail": "Missing required booking fields."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate phone number is exactly 10 digits
        if not (len(guest_phone) == 10 and guest_phone.isdigit()):
            return Response({"detail": "Phone number must be exactly 10 digits."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response({"detail": "Room not found."}, status=status.HTTP_404_NOT_FOUND)

        hotel = room.hotel
        # Check authorization
        is_owner = hotel.owner == user
        is_manager = hotel.managers.filter(id=user.id).exists()
        if not (is_owner or is_manager):
            return Response({"detail": "Not authorized for this hotel."}, status=status.HTTP_403_FORBIDDEN)

        # Parse check-in/check-out date strings
        try:
            check_in_date = datetime.datetime.strptime(check_in, '%Y-%m-%d').date()
            check_out_date = datetime.datetime.strptime(check_out, '%Y-%m-%d').date()
        except ValueError:
            return Response({"detail": "Invalid check-in or check-out date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        if check_in_date >= check_out_date:
            return Response({"detail": "Check-out date must be after check-in date."}, status=status.HTTP_400_BAD_REQUEST)

        # Validate advance paid
        # Standard: 500, Deluxe: 1000, Superior: 2000
        min_advance = 0.00
        if room.room_type == 'Standard':
            min_advance = 500.00
        elif room.room_type == 'Deluxe':
            min_advance = 1000.00
        elif room.room_type == 'Superior':
            min_advance = 2000.00

        try:
            advance_paid_dec = float(advance_paid)
        except ValueError:
            return Response({"detail": "Advance paid must be a number."}, status=status.HTTP_400_BAD_REQUEST)

        if advance_status_val == 'Unpaid':
            advance_paid_dec = 0.00
        else:
            if advance_paid_dec < min_advance:
                return Response({"detail": f"Minimum advance payment of ₹{min_advance} is required for {room.room_type} rooms."}, status=status.HTTP_400_BAD_REQUEST)

        # Check for booking overlaps
        overlapping_bookings = Booking.objects.filter(
            room=room,
            check_in__lt=check_out_date,
            check_out__gt=check_in_date
        )
        if overlapping_bookings.exists():
            return Response({"detail": "This room is already booked for the selected dates."}, status=status.HTTP_400_BAD_REQUEST)

        booking = Booking.objects.create(
            room=room,
            guest_first_name=guest_first_name,
            guest_last_name=guest_last_name,
            guest_phone=guest_phone,
            guest_email=guest_email,
            check_in=check_in_date,
            check_in_time=check_in_time,
            check_out=check_out_date,
            check_out_time=check_out_time,
            status=status_val,
            advance_paid=advance_paid_dec,
            advance_status=advance_status_val
        )

        return Response({
            "id": booking.id,
            "room_id": booking.room.id,
            "room_number": booking.room.number,
            "guest_first_name": booking.guest_first_name,
            "guest_last_name": booking.guest_last_name,
            "check_in": booking.check_in.strftime('%Y-%m-%d'),
            "check_in_time": booking.check_in_time,
            "check_out": booking.check_out.strftime('%Y-%m-%d'),
            "check_out_time": booking.check_out_time,
            "status": booking.status,
            "advance_paid": booking.advance_paid,
            "advance_status": booking.advance_status
        }, status=status.HTTP_201_CREATED)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def my_hotel_booking_detail(request, pk):
    """
    Update or delete an existing booking.
    """
    user = request.user
    try:
        booking = Booking.objects.get(id=pk)
    except Booking.DoesNotExist:
        return Response({"detail": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

    hotel = booking.room.hotel
    is_owner = hotel.owner == user
    is_manager = hotel.managers.filter(id=user.id).exists()
    if not (is_owner or is_manager):
        return Response({"detail": "Not authorized for this hotel."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        guest_first_name = request.data.get('guest_first_name')
        guest_last_name = request.data.get('guest_last_name')
        guest_phone = request.data.get('guest_phone')
        guest_email = request.data.get('guest_email')
        check_in = request.data.get('check_in')
        check_in_time = request.data.get('check_in_time')
        check_out = request.data.get('check_out')
        check_out_time = request.data.get('check_out_time')
        status_val = request.data.get('status')
        advance_paid = request.data.get('advance_paid')
        advance_status_val = request.data.get('advance_status')

        if guest_phone:
            if not (len(guest_phone) == 10 and guest_phone.isdigit()):
                return Response({"detail": "Phone number must be exactly 10 digits."}, status=status.HTTP_400_BAD_REQUEST)
            booking.guest_phone = guest_phone

        if guest_first_name:
            booking.guest_first_name = guest_first_name
        if guest_last_name:
            booking.guest_last_name = guest_last_name
        if guest_email is not None:
            booking.guest_email = guest_email
        if status_val:
            booking.status = status_val
        if advance_status_val:
            booking.advance_status = advance_status_val

        if check_in or check_out:
            cin_str = check_in or booking.check_in.strftime('%Y-%m-%d')
            cout_str = check_out or booking.check_out.strftime('%Y-%m-%d')
            try:
                check_in_date = datetime.datetime.strptime(cin_str, '%Y-%m-%d').date()
                check_out_date = datetime.datetime.strptime(cout_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({"detail": "Invalid date format. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

            if check_in_date >= check_out_date:
                return Response({"detail": "Check-out date must be after check-in date."}, status=status.HTTP_400_BAD_REQUEST)

            overlapping_bookings = Booking.objects.filter(
                room=booking.room,
                check_in__lt=check_out_date,
                check_out__gt=check_in_date
            ).exclude(id=booking.id)

            if overlapping_bookings.exists():
                return Response({"detail": "This room is already booked for the selected dates."}, status=status.HTTP_400_BAD_REQUEST)

            booking.check_in = check_in_date
            booking.check_out = check_out_date

        if check_in_time:
            booking.check_in_time = check_in_time
        if check_out_time:
            booking.check_out_time = check_out_time

        if advance_status_val == 'Unpaid':
            booking.advance_paid = 0.00
        elif advance_status_val == 'Paid' or advance_paid is not None:
            adv_val = advance_paid if advance_paid is not None else booking.advance_paid
            try:
                advance_paid_dec = float(adv_val)
            except ValueError:
                return Response({"detail": "Advance paid must be a number."}, status=status.HTTP_400_BAD_REQUEST)

            if booking.advance_status == 'Paid':
                min_advance = 0.00
                if booking.room.room_type == 'Standard':
                    min_advance = 500.00
                elif booking.room.room_type == 'Deluxe':
                    min_advance = 1000.00
                elif booking.room.room_type == 'Superior':
                    min_advance = 2000.00

                if advance_paid_dec < min_advance:
                    return Response({"detail": f"Minimum advance payment of ₹{min_advance} is required for {booking.room.room_type} rooms."}, status=status.HTTP_400_BAD_REQUEST)
            booking.advance_paid = advance_paid_dec

        booking.save()
        return Response({
            "id": booking.id,
            "guest_first_name": booking.guest_first_name,
            "guest_last_name": booking.guest_last_name,
            "guest_phone": booking.guest_phone,
            "guest_email": booking.guest_email,
            "check_in": booking.check_in.strftime('%Y-%m-%d'),
            "check_in_time": booking.check_in_time,
            "check_out": booking.check_out.strftime('%Y-%m-%d'),
            "check_out_time": booking.check_out_time,
            "status": booking.status,
            "advance_paid": booking.advance_paid,
            "advance_status": booking.advance_status
        }, status=status.HTTP_200_OK)

    elif request.method == 'DELETE':
        booking.delete()
        return Response({"detail": "Booking deleted successfully."}, status=status.HTTP_204_NO_CONTENT)
