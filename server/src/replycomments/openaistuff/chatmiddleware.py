from .commentreply import generate_reply_again
from .analyze_sentiment_insight import analyze_sentiment_and_insights
from django.core.cache import cache

def chat_middleware(request=None, **kwargs):
    # print("request",request)
    # print("comment_Id_id",request.GET.get('comment_id'))
    # print("comment",request.GET.get('comment'))
    # print("comment",request.GET.get('type'))
    Type = request.GET.get('type')
    video_Id = request.GET.get('video_Id')
    cache_key = f"youtube_video_data_{request.user.id}_{video_Id}"
    all_comment_cache_key = f"comment_reply_{request.user.id}_{video_Id}"
    cached_data = cache.get(cache_key)
    all_comment_cached_data = cache.get(all_comment_cache_key)

    if not cached_data:
        # Handle empty cache
        return {"error": "No data found in cache for the given video ID"}

    # Ensure `items` exists and is a list
    items = cached_data.get("items")
    if not items or not isinstance(items, list):
        return {"error": "Invalid cached data structure"}

    # Safely retrieve `description` from the first item's snippet
    first_item = items[0]
    description = first_item.get("snippet", {}).get("description")
    if not description:
        return {"error": "Description not found in cached data"}

    if not all_comment_cached_data:
        # Handle empty cache
        return {"error": "No data found in all_comment cache for the given video ID"}

    # Ensure `items` exists and is a list
    all_comments = all_comment_cached_data.get("comments")
    if not all_comments or not isinstance(all_comments, list):
        return {"error": "Invalid cached data structure"}



    if(Type == 'generate_reply_again'):
        comment_text = request.GET.get('comment')
        commentId = request.GET.get('comment_Id')
        return generate_reply_again(comment_text,description,commentId,request.user.id)

    if(Type == 'generate_insight'):
        return analyze_sentiment_and_insights(video_Id,all_comments,description)
    return "Middleware Response"
