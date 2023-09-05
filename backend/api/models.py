from django.db import models
from django.contrib.auth.models import User

# Extending User Model Using a One-To-One Link


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    class Meta:
        permissions = [
            ("access", "Can access the application")
        ]

    def __str__(self):
        return self.user.username
