from django.db import models
from django.contrib.auth.models import User

class Hotel(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_hotels')
    managers = models.ManyToManyField(User, related_name='managed_hotels')

    def __str__(self):
        return f"{self.name} ({self.code})"
