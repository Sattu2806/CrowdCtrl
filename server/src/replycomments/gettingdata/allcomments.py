import requests
from django.core.exceptions import ValidationError

# YouTube API endpoints
YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_COMMENTS_URL = "https://www.googleapis.com/youtube/v3/commentThreads"

import requests

def get_channel_id(access_token: str) -> str:
    """
    Fetch the channel ID for the authenticated user.
    """
    url = "https://www.googleapis.com/youtube/v3/channels"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    params = {
        "part": "id",
        "mine": True
    }

    response = requests.get(url, headers=headers, params=params)
    if not response.ok:
        raise Exception(f"Error fetching channel ID: {response.status_code}, {response.text}")

    data = response.json()
    return data["items"][0]["id"]


def fetch_channel_videos(channel_id: str, access_token: str) -> list:
    """
    Fetch all video details from a YouTube channel, including video ID, title, description, and published date.
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    videos = []
    page_token = None

    while True:
        params = {
            "part": "snippet",  # Fetching video details along with the ID
            "channelId": channel_id,
            "maxResults": 50,
            "type": "video",
            "pageToken": page_token,
        }
        response = requests.get(YOUTUBE_VIDEOS_URL, headers=headers, params=params)
        if not response.ok:
            raise ValidationError(f"Error fetching videos: {response.status_code}, {response.text}")
        data = response.json()

        # Collect video details
        for item in data.get("items", []):
            video_id = item["id"]["videoId"]
            video_snippet = item["snippet"]
            videos.append({
                "id": video_id,
                "title": video_snippet["title"],
                "description": video_snippet["description"],
                "published_at": video_snippet["publishedAt"],
                "channel_id": video_snippet["channelId"],  # Channel ID of the video
                "channel_title": video_snippet["channelTitle"],  # Channel name/title
                "thumbnails": video_snippet["thumbnails"],  # Thumbnails object with different sizes
                "tags": video_snippet.get("tags", []),  # Tags associated with the video (optional)
            })


        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return videos


# def fetch_unreplied_comments(video_id: str, channel_id: str, access_token: str) -> list:
#     """
#     Fetch unreplied comments for a video, including comment IDs.
#     """
#     headers = {"Authorization": f"Bearer {access_token}"}
#     unreplied_comments = []
#     page_token = None

#     while True:
#         params = {
#             "part": "snippet,replies",
#             "videoId": video_id,
#             "maxResults": 100,
#             "pageToken": page_token,
#         }
#         response = requests.get(YOUTUBE_COMMENTS_URL, headers=headers, params=params)
#         if not response.ok:
#             raise ValidationError(f"Error fetching comments: {response.status_code}, {response.text}")
#         data = response.json()

#         for item in data.get("items", []):
#             top_level_comment = item["snippet"]["topLevelComment"]
#             comment_snippet = top_level_comment["snippet"]
#             replies = item.get("replies", {}).get("comments", [])

#             # Check if there are no replies from the channel
#             if not any(reply["snippet"]["authorChannelId"]["value"] == channel_id for reply in replies):
#                 unreplied_comments.append({
#                     "id": top_level_comment["id"],  # Include the comment ID
#                     "snippet": comment_snippet,    # Include the existing snippet details
#                     "replies": replies,
#                 })

#         page_token = data.get("nextPageToken")
#         if not page_token:
#             break

#     return unreplied_comments



# def fetch_all_unreplied_comments(access_token: str) -> dict:
#     """
#     Fetch all unreplied comments across all videos of a channel.
#     """
#     print('access_token_unreplied',access_token)
#     channel_id = get_channel_id(access_token)
#     all_unreplied_comments = {}
#     video_ids = fetch_channel_videos(channel_id, access_token)

#     for video_id in video_ids:
#         comments = fetch_unreplied_comments(video_id, channel_id, access_token)
#         if comments:
#             all_unreplied_comments[video_id] = comments

#     return all_unreplied_comments

def fetch_unreplied_comments(video_id: str, channel_id: str, access_token: str) -> list:
    """
    Fetch comments for a video, including comment IDs and whether they are replied to by the author.
    """
    headers = {"Authorization": f"Bearer {access_token}"}
    all_comments = []
    page_token = None

    while True:
        params = {
            "part": "snippet,replies",
            "videoId": video_id,
            "maxResults": 100,
            "pageToken": page_token,
        }
        response = requests.get(YOUTUBE_COMMENTS_URL, headers=headers, params=params)
        if not response.ok:
            raise ValidationError(f"Error fetching comments: {response.status_code}, {response.text}")
        data = response.json()

        for item in data.get("items", []):
            top_level_comment = item["snippet"]["topLevelComment"]
            comment_snippet = top_level_comment["snippet"]
            replies = item.get("replies", {}).get("comments", [])

            # Determine if the author has already replied
            author_replied = any(reply["snippet"]["authorChannelId"]["value"] == channel_id for reply in replies)

            all_comments.append({
                "id": top_level_comment["id"],  # Include the comment ID
                "snippet": comment_snippet,    # Include the existing snippet details
                "replies": replies,
                "replied": author_replied,    # Add the replied column
            })

        page_token = data.get("nextPageToken")
        if not page_token:
            break

    return all_comments


def fetch_all_unreplied_comments(access_token: str) -> dict:
    """
    Fetch all unreplied comments across all videos of a channel, including video details and a 'replied' column.
    """
    print('access_token_unreplied', access_token)
    channel_id = get_channel_id(access_token)
    all_video_comments = {}
    video_ids = fetch_channel_videos(channel_id, access_token)

    for video in video_ids:
        video_id = video["id"]  # Access the video ID
        video_details = {
            "id": video["id"],
            "title": video["title"],
            "description": video["description"],
            "published_at": video["published_at"],
            "channel_id": video["channel_id"],  # Channel ID of the video
            "channel_title": video["channel_title"],  # Channel name/title
            "thumbnails": video["thumbnails"],  # Thumbnails object with different sizes
            "tags": video.get("tags", []),  # Tags associated with the video (optional)
        }

        comments = fetch_unreplied_comments(video_id, channel_id, access_token)
        
        # Add the video details to the comments response
        if comments:
            all_video_comments[video_id] = {
                "video_details": video_details,
                "comments": comments
            }

    return all_video_comments
