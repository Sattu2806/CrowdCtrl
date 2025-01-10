from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.conf import settings

# Create your models here.

class WaitListEntry(models.Model):
    # user = 
    email = models.EmailField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)


# Custom User Manager
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(email, password, **extra_fields)


# Custom User Model
class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True) 
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True)  # Optional fallback
    first_name = models.CharField(max_length=255, blank=True)  # New field
    last_name = models.CharField(max_length=255, blank=True)  # New field
    image = models.CharField(max_length=255, blank=True, null=True)  # New image field
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']  # Ensure these fields are required

    objects = UserManager()

    def __str__(self):
        return self.email



class Account(models.Model):
    id = models.AutoField(primary_key=True) 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="accounts"
    )
    type = models.CharField(max_length=255)
    provider = models.CharField(max_length=255)
    provider_account_id = models.CharField(max_length=255)
    refresh_token = models.TextField(null=True, blank=True)
    access_token = models.TextField(null=True, blank=True)
    expires_at = models.IntegerField(null=True, blank=True)
    token_type = models.CharField(max_length=255, null=True, blank=True)
    scope = models.CharField(max_length=255, null=True, blank=True)
    id_token = models.TextField(null=True, blank=True)
    session_state = models.CharField(max_length=255, null=True, blank=True)

    class Meta:
        db_table = "accounts"
        unique_together = ["provider", "provider_account_id"]

    def __str__(self):
        return f"{self.provider} - {self.provider_account_id}"

class CommentSuggestion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comment_suggestions")
    parent_comment_id = models.CharField(max_length=255)  # YouTube comment ID
    suggestion = models.TextField()  # AI-generated suggestion
    actual_reply = models.TextField(blank=True, null=True)  # User's reply
    replied = models.BooleanField(default=False)  # Indicates if the suggestion was used/replied
    created_at = models.DateTimeField(auto_now_add=True)  # When the suggestion was created
    updated_at = models.DateTimeField(auto_now=True)  # When the suggestion was last updated

    def __str__(self):
        return f"Suggestion for Comment {self.parent_comment_id}"