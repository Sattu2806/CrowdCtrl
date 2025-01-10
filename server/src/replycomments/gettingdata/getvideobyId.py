import requests
from django.core.exceptions import ValidationError

# YouTube Data API endpoint for fetching video details
YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos"

def get_video_data(video_id: str, access_token: str) -> dict:
    """
    Fetches details of a specific YouTube video using the YouTube Data API.

    Args:
        video_id (str): The unique identifier of the YouTube video to fetch data for.
        access_token (str): The valid OAuth2 access token required for authorization with the YouTube Data API.

    Returns:
        dict: A dictionary containing details of the requested YouTube video, such as title, description, statistics,
              and other metadata.

    Raises:
        ValidationError: If the API request fails or if any unexpected response structure is encountered.
    """
    # Set up authorization headers
    headers = {
        "Authorization": f"Bearer {access_token}"  # Include Bearer token for authenticated requests
    }

    try:
        # Make the GET request to YouTube's videos endpoint
        video_response = requests.get(
            YOUTUBE_VIDEO_URL,
            headers=headers,
            params={
                "part": "snippet,contentDetails,statistics",  # Include detailed video information
                "id": video_id  # Specify the video ID
            }
        )

        # Check if the response was successful
        if not video_response.ok:
            raise ValidationError(f"Error fetching video data: {video_response.status_code}, {video_response.text}")

        # Parse and return JSON data from the response
        return video_response.json()

    except requests.exceptions.RequestException as e:
        # Handle network-related errors
        raise ValidationError(f"Network error occurred while fetching video data: {e}") from e
