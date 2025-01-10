import requests
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError
from django.conf import settings

# YouTube Analytics API endpoint
YOUTUBE_ANALYTICS_URL = "https://youtubeanalytics.googleapis.com/v2/reports"

def get_channel_analytics(access_token: str) -> dict:
    """
    Fetches channel analytics data for the last 56 days using the YouTube Analytics API.
    Splits the data into two ranges: the last 28 days and the 29th to 56th days.
    
    Args:
        access_token (str): OAuth2 access token with appropriate YouTube scopes.

    Returns:
        dict: A dictionary with two keys: 'last_28_days' and 'previous_28_days',
              containing analytics data for the respective periods.

    Raises:
        ValidationError: If the API request fails or if there is an error in the response.
    """
    def fetch_analytics_data(start_date, end_date):
        """Fetches analytics data for a given date range."""
        params = {
            "ids": "channel==MINE",
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "metrics": "views,comments,likes,dislikes,estimatedMinutesWatched,subscribersGained,subscribersLost",
            "dimensions": "day",
            "sort": "day",
            "key": settings.YOUTUBE_ANALYTICS_KEY,
        }

        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        try:
            response = requests.get(YOUTUBE_ANALYTICS_URL, headers=headers, params=params)
            
            if not response.ok:
                raise ValidationError(f"Error fetching analytics: {response.status_code} - {response.text}")
            
            return response.json()

        except requests.exceptions.RequestException as e:
            raise ValidationError(f"Network error occurred while fetching analytics: {e}") from e

    # Date ranges
    today = datetime.utcnow().date()
    last_28_days_start = today - timedelta(days=28)
    last_28_days_end = today

    previous_28_days_start = today - timedelta(days=56)
    previous_28_days_end = today - timedelta(days=28)

    # Fetch data for the two ranges
    last_28_days_data = fetch_analytics_data(last_28_days_start, last_28_days_end)
    previous_28_days_data = fetch_analytics_data(previous_28_days_start, previous_28_days_end)

    return {
        "last_28_days": last_28_days_data,
        "previous_28_days": previous_28_days_data,
    }
