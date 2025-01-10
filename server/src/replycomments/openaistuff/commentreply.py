from .chat import generate_response
from django.core.cache import cache
from replycomments.models import Account, CommentSuggestion

def generate_reply_again(comment_text,description,commentId,userId):
    """
    Generate a reply for a given comment using OpenAI's ChatCompletion API.
    """
    # Prepare the messages to send to the API, specific to YouTube comments

    cache_key = f"comment_reply_{userId}_{commentId}"

    ai_reply = cache.get(cache_key)
    
    messages = [
        {"role": "system", "content": "You are a helpful assistant skilled in crafting polite, thoughtful, and engaging replies to YouTube comments."},
        {"role": "user", "content": f"Suggest a reply to this YouTube comment again: \"{comment_text}\". This is the description of the YouTube video: \"{description}\", this is your previous response \"${ai_reply}\", generate response each time from scratch and in another way."},
    ]
    # Call the reusable API function with the prepared messages
    reply = generate_response(messages)
    ai_reply = reply

    # Save or update the suggestion to the database
    # suggestion_entry, created = CommentSuggestion.objects.update_or_create(
    #     parent_comment_id=commentId,
    #     defaults={'suggestion': ai_reply}  # If the record exists, this will update the 'suggestion' field
    # )


    cache.set(cache_key, ai_reply, timeout=600) 
    
    print(reply)  # Optional: Print the response for debugging
    return reply
