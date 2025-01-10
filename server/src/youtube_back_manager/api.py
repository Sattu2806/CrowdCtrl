from ninja import NinjaAPI, Schema
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja_jwt.authentication import JWTAuth
from ninja_extra import NinjaExtraAPI

api = NinjaExtraAPI()
api.register_controllers(NinjaJWTDefaultController)

class UserSchema(Schema):
    username:str
    is_authenticated:bool
    email:str = None

@api.get('/hello')
def hello(request):
    print(request)
    return "Hello World"

@api.get('/me', response=UserSchema, auth=JWTAuth())
def me(request):
    return request.user


from .services import get_user_data
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth import login
from rest_framework.views import APIView
from .serializers import AuthSerializer
# from django.contrib.auth.models import User
from replycomments.models import User  # Import your custom User model


# views that handle 'localhost://8000/auth/api/login/google/'
class GoogleLoginApi(APIView):
    def get(self, request, *args, **kwargs):
        auth_serializer = AuthSerializer(data=request.GET)
        auth_serializer.is_valid(raise_exception=True)
        
        validated_data = auth_serializer.validated_data
        user_data = get_user_data(validated_data)
        print(validated_data)
        
        user = User.objects.get(email=user_data['email'])
        login(request, user)

        return redirect(settings.BASE_APP_URL)