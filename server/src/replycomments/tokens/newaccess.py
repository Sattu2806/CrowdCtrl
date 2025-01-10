import requests

def refresh_google_access_token(refresh_token, client_id, client_secret):
    """
    Refresh Google access token using the refresh token.

    Args:
        refresh_token (str): The refresh token from Google OAuth.
        client_id (str): Your Google app's client ID.
        client_secret (str): Your Google app's client secret.

    Returns:
        dict: A dictionary containing the new access token and its expiry, or None if the request fails.
    """
    token_url = "https://oauth2.googleapis.com/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    
    response = requests.post(token_url, data=payload)
    
    if response.status_code == 200:
        return response.json()  # Contains access_token, expires_in, etc.
    else:
        print(f"Error refreshing token: {response.status_code} - {response.text}")
        return None
