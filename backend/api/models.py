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


class Result(models.Model):
    task_id = models.CharField(max_length=100, primary_key=True)
    completed = models.BooleanField()
    flim_adjusted = models.BooleanField()
    source = models.CharField(max_length=300)
    channel = models.IntegerField(default=0)
    timestamp = models.DateTimeField(auto_now_add=True)
    local_algorithm = models.CharField(max_length=100, null=True)
    global_algorithm = models.CharField(max_length=100, null=True)
    local_params = models.JSONField(null=True)
    global_params = models.JSONField(null=True)
