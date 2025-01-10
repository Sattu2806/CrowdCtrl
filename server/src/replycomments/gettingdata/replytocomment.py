import requests
from django.core.exceptions import ValidationError

YOUTUBE_COMMENTS_REPLY_URL = "https://www.googleapis.com/youtube/v3/comments"

def reply_to_comment(access_token: str, parent_comment_id: str, reply_text: str) -> dict:
    """
    Replies to an existing YouTube comment.

    Args:
        access_token (str): The valid OAuth2 access token for YouTube API authorization.
        parent_comment_id (str): The ID of the comment to which this reply will be posted.
        reply_text (str): The text of the reply to post.

    Returns:
        dict: The response from the YouTube Data API.

    Raises:
        ValidationError: If the API request fails or the response structure is unexpected.
    """
    # Authorization headers
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Request body
    body = {
        "snippet": {
            "textOriginal": reply_text,
            "parentId": parent_comment_id,
        }
    }

    try:
        # Make the POST request
        response = requests.post(
            YOUTUBE_COMMENTS_REPLY_URL,
            headers=headers,
            params={"part": "snippet"},
            json=body,
        )

        # Check if the response was successful
        if response.status_code != 200:
            raise ValidationError(f"Error replying to comment: {response.status_code}, {response.text}")

        # Return the API response
        return response.json()

    except requests.exceptions.RequestException as e:
        # Handle network-related errors
        raise ValidationError(f"Network error occurred while replying to comment: {e}") from e
