import requests
from django.core.exceptions import ValidationError


# YouTube Data API endpoints
YOUTUBE_CHANNEL_INFO_URL = "https://www.googleapis.com/youtube/v3/channels"
YOUTUBE_VIDEO_LIST_URL = "https://www.googleapis.com/youtube/v3/search"


def fetch_youtube_data_for_idea(access_token: str) -> dict:
    """
    Fetch YouTube user data like channel details and uploaded videos (only title and description).
    
    Args:
        access_token (str): OAuth2 access token obtained during authentication.
    
    Returns:
        dict: A dictionary with channel data and video titles/descriptions.
    
    Raises:
        ValidationError: If any part of the request fails or YouTube data cannot be retrieved.
    """
    # Headers
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Fetch User Channel Info
    channel_info_params = {
        "part": "snippet,statistics",
        "mine": "true"
    }

    # Fetch user channel details
    channel_response = requests.get(YOUTUBE_CHANNEL_INFO_URL, headers=headers, params=channel_info_params)
    if not channel_response.ok:
        raise ValidationError(f"Failed to fetch channel data: {channel_response.status_code}, {channel_response.text}")
    
    channel_data = channel_response.json()
    
    if not channel_data.get("items") or not channel_data["items"][0].get("id"):
        raise ValidationError("Could not find the channelId for this user.")
    
    channel_id = channel_data["items"][0]["id"]  # Extracted user's channel ID

    # Fetch Uploaded Videos using channelId
    video_list_params = {
        "channelId": channel_id,  # Filter only user's uploaded videos
        "type": "video",
        "part": "snippet",
        "maxResults": 30,  # Limit number of videos
    }

    video_response = requests.get(YOUTUBE_VIDEO_LIST_URL, headers=headers, params=video_list_params)
    if not video_response.ok:
        raise ValidationError(f"Failed to fetch uploaded videos: {video_response.status_code}, {video_response.text}")
    
    video_data = video_response.json()
    videos = video_data.get("items", [])

    # Extract only title and description from each video
    video_details = []
    for video in videos:
        video_details.append({
            "title": video["snippet"]["title"],
            "description": video["snippet"]["description"]
        })

    # Structure the response
    result = {
        "channel_info": channel_data,
        "videos": video_details  # Only title and description of videos
    }

    return result
