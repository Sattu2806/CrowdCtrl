import requests
from django.core.exceptions import ValidationError


# YouTube Data API endpoints
YOUTUBE_CHANNEL_INFO_URL = "https://www.googleapis.com/youtube/v3/channels"
YOUTUBE_VIDEO_LIST_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads"


def fetch_youtube_data(access_token: str) -> dict:
    """
    Fetch YouTube user data like channel details, uploaded videos, statistics, and comments on uploaded videos.
    
    Args:
        access_token (str): OAuth2 access token obtained during authentication.
    
    Returns:
        dict: A comprehensive dictionary with user data, videos, and comments.
    
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


    # comment_response = requests.get(
    #     YOUTUBE_COMMENTS_URL,
    #     headers=headers,
    #     params={
    #         "part": "snippet",
    #         "videoId": 'FOl1tAtyVKs',
    #         "maxResults": 5  # Limit number of comments per video
    #     }
    # )
    # comment_response1 = requests.get(
    #     YOUTUBE_COMMENTS_URL,
    #     headers=headers,
    #     params={
    #         "part": "snippet",
    #         "videoId": 'io66rkiHrdY',
    #         "maxResults": 5  # Limit number of comments per video
    #     }
    # )

    # print(comment_response1.json())
    # Fetch comments for each uploaded video
    # comments = []
    # for video in videos:
    #     video_id = video["id"]["videoId"]  # Extract videoId
    #     print(video_id,headers)
    #     comment_response = requests.get(
    #         YOUTUBE_COMMENTS_URL,
    #         headers=headers,
    #         params={
    #             "part": "snippet",
    #             "videoId": video_id,
    #             "maxResults": 5  # Limit number of comments per video
    #         }
    #     )
    #     if comment_response.ok:
    #         comments_data = comment_response.json().get("items", [])
    #         for comment in comments_data:
    #             comments.append({
    #                 "videoId": video_id,
    #                 "author": comment["snippet"]["authorDisplayName"],
    #                 "text": comment["snippet"]["textDisplay"],
    #                 "publishedAt": comment["snippet"]["publishedAt"]
    #             })
    #     else:
    #         print(f"Failed to fetch comments for video {video_id}")

    # Structure the response
    result = {
        "channel_info": channel_data,
        "videos": videos,
        # "comments": comments
    }

    return result
