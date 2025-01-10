import requests

def is_google_token_valid(access_token):
    """
    Check if a Google access token is valid using Google's tokeninfo endpoint.

    Args:
        access_token (str): The access token.

    Returns:
        bool: True if the token is valid, False otherwise.
    """
    url = f"https://oauth2.googleapis.com/tokeninfo?access_token={access_token}"
    response = requests.get(url)
    
    if response.status_code == 200:
        # Token is valid
        return True
    else:
        # Token is invalid or expired
        print(f"Token validation failed: {response.json()}")
        return False

