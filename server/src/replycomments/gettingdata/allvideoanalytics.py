import requests
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta

# Get today's date
end_date = datetime.today()

# Calculate the start date (28 days ago)
start_date = end_date - timedelta(days=28)

# Format the dates to the desired format (YYYY-MM-DD)
start_date_str = start_date.strftime('%Y-%m-%d')
end_date_str = end_date.strftime('%Y-%m-%d')

# YouTube API Endpoints
YOUTUBE_CHANNEL_URL = "https://www.googleapis.com/youtube/v3/channels"
YOUTUBE_PLAYLIST_ITEMS_URL = "https://www.googleapis.com/youtube/v3/playlistItems"
YOUTUBE_VIDEO_URL = "https://www.googleapis.com/youtube/v3/videos"
YOUTUBE_ANALYTICS_URL = "https://www.googleapis.com/youtube/analytics/v2/reports"

def get_channel_id(access_token: str) -> str:
    """
    Fetch the channel ID for the authenticated user.

    Args:
        access_token (str): The OAuth2 access token for YouTube API.

    Returns:
        str: The channel ID of the authenticated user.
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    params = {
        "part": "id",
        "mine": True
    }

    response = requests.get(YOUTUBE_CHANNEL_URL, headers=headers, params=params)
    if not response.ok:
        raise ValidationError(f"Error fetching channel ID: {response.status_code}, {response.text}")

    data = response.json()
    return data["items"][0]["id"]

def get_all_videos_and_analytics(access_token: str) -> list:
    """
    Fetch all videos of a channel along with their metadata and analytics.

    Args:
        access_token (str): The OAuth2 access token for YouTube API.

    Returns:
        list: A list of dictionaries containing video metadata and analytics.
    """
    headers = {
        "Authorization": f"Bearer {access_token}"
    }

    # Step 1: Get channel ID
    channel_id = get_channel_id(access_token)

    # Step 2: Get the uploads playlist ID
    playlist_response = requests.get(
        YOUTUBE_CHANNEL_URL,
        headers=headers,
        params={
            "part": "contentDetails",
            "id": channel_id
        }
    )
    if not playlist_response.ok:
        raise ValidationError(f"Error fetching playlist ID: {playlist_response.status_code}, {playlist_response.text}")

    uploads_playlist_id = playlist_response.json()["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    # Step 3: Fetch all videos from the uploads playlist
    videos = []
    next_page_token = None
    while True:
        playlist_items_response = requests.get(
            YOUTUBE_PLAYLIST_ITEMS_URL,
            headers=headers,
            params={
                "part": "snippet",
                "playlistId": uploads_playlist_id,
                "maxResults": 50,
                "pageToken": next_page_token
            }
        )
        if not playlist_items_response.ok:
            raise ValidationError(f"Error fetching videos: {playlist_items_response.status_code}, {playlist_items_response.text}")

        playlist_items_data = playlist_items_response.json()
        videos.extend(playlist_items_data["items"])
        next_page_token = playlist_items_data.get("nextPageToken")
        if not next_page_token:
            break

    # Step 4: Fetch metadata and analytics for each video
    video_data_list = []
    for video in videos:
        video_id = video["snippet"]["resourceId"]["videoId"]

        # Fetch video metadata
        video_response = requests.get(
            YOUTUBE_VIDEO_URL,
            headers=headers,
            params={
                "part": "snippet,contentDetails,statistics",
                "id": video_id
            }
        )
        if not video_response.ok:
            raise ValidationError(f"Error fetching video data: {video_response.status_code}, {video_response.text}")

        video_metadata = video_response.json()

        today = datetime.utcnow().date()
        last_28_days_start = today - timedelta(days=28)
        last_28_days_end = today
        # Fetch video analytics
        analytics_response = requests.get(
            YOUTUBE_ANALYTICS_URL,
            headers=headers,
            params={
                "ids": f"channel=={channel_id}",
                "startDate": last_28_days_start,  # Adjust dates as needed
                "endDate": last_28_days_end,
                "metrics": "views,likes,dislikes,comments",
                "dimensions": "video",
                "filters": f"video=={video_id}"
            }
        )
        if not analytics_response.ok:
            # Log analytics error but continue
            print(f"Error fetching analytics for video {video_id}: {analytics_response.status_code}, {analytics_response.text}")
            video_analytics = {}
        else:
            video_analytics = analytics_response.json()

        # Combine metadata and analytics
        video_data_list.append({
            "metadata": video_metadata,
            "analytics": video_analytics
        })

    return video_data_list
