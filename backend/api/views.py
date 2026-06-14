from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Hotel

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
        "hotel_name": hotel.name
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
