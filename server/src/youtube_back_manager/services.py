# services.py
from django.conf import settings
from django.shortcuts import redirect
from django.core.exceptions import ValidationError
from urllib.parse import urlencode
from typing import Dict, Any
import requests
import jwt
import logging
from replycomments.models import User  # Import your custom User model

logger = logging.getLogger(__name__)

GOOGLE_ACCESS_TOKEN_OBTAIN_URL = 'https://oauth2.googleapis.com/token'
GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo'
LOGIN_URL = f'{settings.BASE_APP_URL}/'


def google_get_access_token(code: str, redirect_uri: str) -> str:
    data = {
        'code': code,
        'client_id': settings.GOOGLE_OAUTH2_CLIENT_ID,
        'client_secret': settings.GOOGLE_OAUTH2_CLIENT_SECRET,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
        'scope': 'https://www.googleapis.com/auth/youtube.force-ssl https://www.googleapis.com/auth/yt-analytics.readonly'
    }

    logger.info("Sending request to Google with the following data: %s", data)

    response = requests.post(GOOGLE_ACCESS_TOKEN_OBTAIN_URL, data=data)
    
    # Log the HTTP response
    logger.info("Response Status Code: %d", response.status_code)
    logger.info("Response JSON: %s", response.json())
    print("res",response)
    print("res json",response.json().get('refresh_token'))

    if not response.ok:
        raise ValidationError(f"Error from Google: {response.status_code}, {response.json()}")

    access_token = response.json().get('access_token')
    if not access_token:
        raise ValidationError(f"Google's response did not include an access token. Response: {response.json()}")

    logger.info("Access Token: %s", access_token)

    return response.json()


# Get user info from Google
def google_get_user_info(access_token: str) -> Dict[str, Any]:
    response = requests.get(
        GOOGLE_USER_INFO_URL,
        params={'access_token': access_token}
    )

    if not response.ok:
        raise ValidationError('Could not get user info from Google.')
    print(response.json()
)
    return response.json()


def get_user_data(validated_data):
    """
    Processes token information from validated Google data.
    """
    redirect_uri = 'http://localhost:8001/youtubecallback'

    logger.info("Using Redirect URI: %s", redirect_uri)

    code = validated_data.get('code')
    error = validated_data.get('error')

    if error or not code:
        params = urlencode({'error': error})
        return redirect(f'{LOGIN_URL}?{params}')
    
    # Get tokens from Google
    access_token_response = google_get_access_token(code=code, redirect_uri=redirect_uri)
    user_data = google_get_user_info(access_token=access_token_response.get('access_token'))

    
    user, created = User.objects.get_or_create(
        email=user_data['email'],
        defaults={
            'first_name': user_data.get('given_name', ''),
            'last_name': user_data.get('family_name', ''),
            'image':user_data.get('picture', ''),
        }
    )

    # Create an account
    tokens = {
        "refresh_token": access_token_response.get('refresh_token'),
        "access_token": access_token_response.get('access_token'),
        "expires_in": access_token_response.get('expires_in'),
        "token_type": access_token_response.get('token_type'),
        "scope": access_token_response.get('scope'),
        "id_token": access_token_response.get('id_token'),
        # "session_state": validated_data.get('session_state'),
    }
    create_account(user, tokens)

    profile_data = {
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
    }

    logger.info("User profile data obtained and account created: %s", profile_data)

    return profile_data



#######


from replycomments.models import Account
from django.utils import timezone

def create_account(user, tokens) -> Account:
    """
    Create or update an account entry based on the user's Google tokens.
    """
    try:
        # Parse token information from validated Google response
        account, created = Account.objects.get_or_create(
            user=user,
            provider="google",
            provider_account_id=user.email,  # Use user's email as provider account ID
            defaults={
                "type": "google",
                "refresh_token": tokens.get('refresh_token'),
                "access_token": tokens.get('access_token'),
                "expires_at": tokens.get('expires_in') + int(timezone.now().timestamp()) if tokens.get('expires_in') else None,
                "token_type": tokens.get('token_type'),
                "scope": tokens.get('scope'),
                "id_token": tokens.get('id_token'),
                "session_state": tokens.get('session_state'),
            }
        )

        if created:
            print('created', user.email)
            logger.info(f"Account created successfully for user {user.email}")
        else:
            print('updated', user.email)
            logger.info(f"Account already exists for user {user.email}")

        return account
    except Exception as e:
        logger.error("Error creating account: %s", e)
        raise
