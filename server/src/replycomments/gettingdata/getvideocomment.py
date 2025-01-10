import requests
from django.core.exceptions import ValidationError

# YouTube Data API endpoint for fetching comments
YOUTUBE_COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads"


def get_comment_data(video_id: str, access_token: str) -> dict:
    """
    Fetches comments for a given YouTube video using the YouTube Data API.
    
    Args:
        video_id (str): The unique identifier of the YouTube video for which comments are to be fetched.
        access_token (str): The valid OAuth2 access token required for authorization with the YouTube Data API.

    Returns:
        dict: A dictionary containing the fetched comment data from the YouTube API. Includes details such as the 
              comment author name, comment text, publication date, and other metadata for each comment.

    Raises:
        ValidationError: If the API request fails or if any unexpected response structure is encountered.
    """
    # Set up authorization headers
    headers = {
        "Authorization": f"Bearer {access_token}"  # Include Bearer token for authenticated requests
    }

    try:
        # Make the GET request to YouTube's commentThreads endpoint
        comment_response = requests.get(
            YOUTUBE_COMMENTS_URL,
            headers=headers,
            params={
                "part": "snippet,replies",  # Retrieve only the relevant snippet data for each comment
                "videoId": video_id,
                "maxResults": 5  # Limit number of comments to avoid excessive responses
            }
        )
        
        # Check if the response was successful
        if not comment_response.ok:
            raise ValidationError(f"Error fetching comments: {comment_response.status_code}, {comment_response.text}")

        # Parse and return JSON data from response
        return comment_response.json()

    except requests.exceptions.RequestException as e:
        # Handle network-related errors
        raise ValidationError(f"Network error occurred while fetching comments: {e}") from e
