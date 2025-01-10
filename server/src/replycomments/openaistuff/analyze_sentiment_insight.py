from .chat import generate_response
from django.core.cache import cache
from replycomments.models import Account, CommentSuggestion
from collections import Counter

def analyze_sentiment_and_insights(video_Id,comments, description):
    """
    Analyze the sentiment of YouTube comments and provide insights on how users are reacting to the video.
    """
    cache_key = f"sentiment_analysis_video_Id"

    # Check if we have cached data for the given comments and description
    sentiment_insights = cache.get(cache_key)
    if sentiment_insights:
        return sentiment_insights

    # Prepare messages to send to the API for sentiment analysis
    messages = [
        {"role": "system", 
        "content": "You are a sentiment analysis expert. Analyze the overall sentiment of the comments for the given video in a concise and direct manner, avoiding introductory phrases like 'Based on the analysis of the provided comments and video description.'"
        },
        {"role": "user", 
        "content": f"Analyze the sentiment of these YouTube comments for the given video. I have provided the comments and description about the video. Your report should include what people think of the video, what kind of comments the video is receiving, what people are liking and disliking, and any other useful analysis. Start the response directly with the analysis and avoid introductory phrases. Finally, give me the output of the analysis as a paragraph: These are the comments \"{comments}\". The description of the video is: \"{description}\"."
        }
    ]

        
    # Call the reusable API function with the prepared messages
    reply = generate_response(messages)
        

    # Cache the results for future use
    cache.set(cache_key, reply)

    return reply

