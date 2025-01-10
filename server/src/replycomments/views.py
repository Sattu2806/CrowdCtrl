from django.http import JsonResponse
from .gettingdata.getyoutubedata import fetch_youtube_data
from .gettingdata.getvideocomment import get_comment_data
from .gettingdata.getanalyticschannel import get_channel_analytics
from django.contrib.auth.decorators import login_required
from replycomments.models import Account, CommentSuggestion
from django.core.cache import cache
import logging
from openai import OpenAI
from django.conf import settings
import json
from .gettingdata.getvideobyId import get_video_data
from django.core.exceptions import ValidationError
from .tokens.checkaccess import is_google_token_valid
from .tokens.newaccess import refresh_google_access_token
from .openaistuff.chatmiddleware import chat_middleware
from .gettingdata.replytocomment import reply_to_comment
from .gettingdata.allcomments import fetch_all_unreplied_comments
from .gettingdata.allvideoanalytics import get_all_videos_and_analytics
from .gettingdata.videodataforidea import fetch_youtube_data_for_idea

api_key = settings.OPENAI_API_KEY

client = OpenAI(
    api_key=api_key
)


@login_required
def get_youtube_data(request):
    """
    Fetch and return YouTube data to the frontend.
    Cache the data for 24 hours to reduce API calls and improve performance.
    """

    account = request.user.accounts.first()
    if not account:
        return JsonResponse({"error": "No account linked to user."}, status=400)
    # Validate the access token
    if not is_google_token_valid(account.access_token):
        # Refresh the token if it's invalid
        refreshed_token_data = refresh_google_access_token(
            refresh_token=account.refresh_token,
            client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET
        )
        if not refreshed_token_data:
            return JsonResponse({"error": "Failed to refresh access token."}, status=401)

        # Update the account with the new access token
        account.access_token = refreshed_token_data.get("access_token")
        account.save()


    # Use a user-specific cache key
    cache_key = f"youtube_data_{request.user.id}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse(cached_data, safe=False)

    try:
        # Assuming user has linked their account
        

        # Fetch YouTube data using the user's access token
        youtube_data = fetch_youtube_data(account.access_token)

        # Cache the data for 24 hours (86400 seconds)
        cache.set(cache_key, youtube_data, timeout=86400)


        return JsonResponse(youtube_data, status=200)
        

    except Exception as e:
        logging.error(f"Error fetching YouTube data: {e}")
        return JsonResponse({"error": str(e)}, status=500)


@login_required
def get_youtube_video_comments(request):
    """
    Fetch YouTube comments for a video, provide AI-generated reply suggestions, and store them in the database.
    """
    # Extract the video_id from request parameters
    video_id = request.GET.get('video_id')
    description = request.GET.get('description')
    if not video_id:
        return JsonResponse({"error": "Missing 'video_id' in request parameters."}, status=400)

    account = request.user.accounts.first()
    if not account:
        return JsonResponse({"error": "No account linked to user."}, status=400)
    # Validate the access token
    if not is_google_token_valid(account.access_token):
        # Refresh the token if it's invalid
        refreshed_token_data = refresh_google_access_token(
            refresh_token=account.refresh_token,
            client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET
        )
        if not refreshed_token_data:
            return JsonResponse({"error": "Failed to refresh access token."}, status=401)

        # Update the account with the new access token
        account.access_token = refreshed_token_data.get("access_token")
        account.save()

    try:
        # Retrieve the user's linked account and access token
        # account = request.user.accounts.first()
        # if not account or not account.access_token:
        #     return JsonResponse({"error": "No account with a valid access token found."}, status=400)

        # Fetch comment data using the video_id and access token
        all_comment_cache_key = f"comment_reply_{request.user.id}_{video_id}"
        comments_data = cache.get(all_comment_cache_key)
        comment_data = get_comment_data(video_id, account.access_token)
        if comments_data is None:
            # Extract all `textOriginal` comments into a list
            comments_text_data = {
                "comments": [
                    comment.get('snippet', {}).get('topLevelComment', {}).get('snippet', {}).get('textOriginal', "")
                    for comment in comment_data.get('items', [])
                ]
            }
    
            # Cache the extracted comments
            cache.set(all_comment_cache_key, comments_text_data, timeout=3600)  # Cache for 1 hour (adjust timeout as needed)
        for comment in comment_data.get('items', []):
            original_comment = comment.get('snippet', {}).get('topLevelComment', {}).get('snippet', {}).get('textOriginal', "")
            parent_comment_id = comment.get('id', "")

            # Create a unique cache key for the user and comment
            cache_key = f"comment_reply_{request.user.id}_{parent_comment_id}"

            # Check if the AI reply is already cached
            ai_reply = cache.get(cache_key)
            if not ai_reply:
                # If not cached, check if a suggestion already exists in the database
                # suggestion_entry = CommentSuggestion.objects.filter(
                #     user=request.user,
                #     parent_comment_id=parent_comment_id
                # ).first()

                # if suggestion_entry:
                #     # Use existing suggestion
                #     ai_reply = suggestion_entry.suggestion
                # else:
                    # Generate a new AI reply
                ai_reply = generate_ai_reply(original_comment, description)

                # Save the suggestion to the database
                # CommentSuggestion.objects.create(
                #     user=request.user,
                #     parent_comment_id=parent_comment_id,
                #     suggestion=ai_reply
                # )

                # Cache the AI reply for this comment
                cache.set(cache_key, ai_reply)

            # Attach the AI reply to the comment
            comment['ai_reply'] = ai_reply

        # Return the enriched comment data
        return JsonResponse(comment_data, safe=False, status=200)

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)



def generate_ai_reply(comment_text, description):
    """
    Generate a reply for a given comment using OpenAI's ChatCompletion API.
    """
    try:
        print('It is working to here', comment_text)
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Use a model like "gpt-4" or "gpt-3.5-turbo"
            messages=[
                {"role": "system", "content": "You are a helpful assistant skilled in crafting polite, thoughtful, and engaging replies to YouTube comments."},
                {"role": "user", "content": f"Suggest a reply to this YouTube comment, reply should be very concise and to the point.: \"{comment_text}\". This is the description of the YouTube video: \"{description}\". If description is not given then generate reply without it."},
            ],
            max_tokens=100,
            temperature=0.7,
        )
        print(response)
        # Extract and return the reply
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Error generating AI reply: {e}")
        return "Sorry, I couldn't generate a reply."




@login_required
def chatai (request):
    response = chat_middleware(request)
    return JsonResponse({"data": response} )

@login_required
def reply_to_comment_api(request):
    account = request.user.accounts.first()
    if not account:
        return JsonResponse({"error": "No account linked to user."}, status=400)
    # Validate the access token
    if not is_google_token_valid(account.access_token):
        # Refresh the token if it's invalid
        refreshed_token_data = refresh_google_access_token(
            refresh_token=account.refresh_token,
            client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET
        )
        if not refreshed_token_data:
            return JsonResponse({"error": "Failed to refresh access token."}, status=401)

        # Update the account with the new access token
        account.access_token = refreshed_token_data.get("access_token")
        account.save()
    parent_comment_id = request.GET.get('parent_comment_id')
    reply_text = request.GET.get('reply_text')
    reply_to_comment(account.access_token,parent_comment_id,reply_text)
    return JsonResponse({"data": "Replied"} )

@login_required
def get_youtube_video_data(request):
    """
    Fetch and return YouTube video data to the frontend by video ID.
    Cache the data for 24 hours to reduce API calls and improve performance.
    """
    # Extract the video_id from request parameters
    video_id = request.GET.get('video_id')
    if not video_id:
        return JsonResponse({"error": "Missing 'video_id' in request parameters."}, status=400)

    # Create a cache key specific to the user and video_id
    cache_key = f"youtube_video_data_{request.user.id}_{video_id}"
    cached_data = cache.get(cache_key)

    if cached_data:
        return JsonResponse(cached_data, safe=False)

    try:
        # Retrieve the user's linked account and access token
        account = request.user.accounts.first()
        if not account or not account.access_token:
            return JsonResponse({"error": "No account with a valid access token found."}, status=400)

        # Fetch video data using the video_id and access token
        video_data = get_video_data(video_id, account.access_token)

        # Cache the data for 24 hours (86400 seconds)
        cache.set(cache_key, video_data, timeout=86400)

        # Return the video data
        return JsonResponse(video_data, safe=False, status=200)

    except Exception as e:
        logging.error(f"Error fetching video data for video_id={video_id}: {e}")
        return JsonResponse({"error": "An unexpected error occurred.", "details": str(e)}, status=500)


@login_required
def fetch_channel_analytics(request):
    """
    Django view to fetch and cache YouTube channel analytics for the last 28 days.

    Args:
        request: Django HTTP request object.

    Returns:
        JsonResponse: A JSON response containing the analytics data or an error message.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Invalid request method. Only GET is allowed."}, status=405)


    # Ensure the access token is available in the user's session or database
    account = request.user.accounts.first()
    if not account or not account.access_token:
        return JsonResponse({"error": "No account with a valid access token found."}, status=400)

        account = request.user.accounts.first()
    # Validate the access token
    if not is_google_token_valid(account.access_token):
        # Refresh the token if it's invalid
        refreshed_token_data = refresh_google_access_token(
            refresh_token=account.refresh_token,
            client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET
        )
        if not refreshed_token_data:
            return JsonResponse({"error": "Failed to refresh access token."}, status=401)

        # Update the account with the new access token
        account.access_token = refreshed_token_data.get("access_token")
        account.save()
    # Define a unique cache key for the user's analytics
    cache_key = f"youtube_analytics_{request.user.id}"
    cached_data = cache.get(cache_key)

    if cached_data:
        # If analytics data is cached, return it directly
        return JsonResponse({"success": True, "data": cached_data}, status=200)

    try:
        # Fetch channel analytics using the helper function
        analytics_data = get_channel_analytics(account.access_token)

        # Cache the analytics data for a specific duration (e.g., 1 hour)
        cache.set(cache_key, analytics_data, timeout=3600)
        return JsonResponse({"success": True, "data": analytics_data}, status=200)

    except AttributeError as e:
        # Specific handling for missing settings attribute
        return JsonResponse({"error": f"Missing configuration: {str(e)}"}, status=500)
    except ValidationError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"Error": "An unexpected error occurred. Please try again."}, status=500)

# In Django views.py auth-check
def check_auth(request):
    if request.user.is_authenticated:
        user_data = {
            'id': request.user.id,
            'username': request.user.first_name,
            'email': request.user.email,
            'image':request.user.image
            # Add any additional fields you need from the user model
        }
        return JsonResponse({'authenticated': True, 'user': user_data})
    else:
        return JsonResponse(
            {'authenticated': False, 'message': 'User not authenticated'},
            status=401
        )

def analyze_comment_with_gpt(comment_text, description=None):
    """
    Analyze the comment using GPT to check if it contains a question, a link, or any keywords.
    
    Args:
    - comment_text (str): The comment text to analyze.
    - description (str, optional): The YouTube video description, if provided.
    
    Returns:
    - dict: A dictionary with 'contain_question', 'contain_link', and 'contain_keyword' as boolean values.
    """
    try:
        # Send request to OpenAI GPT to analyze the comment
        prompt = f"""
        Analyze the following YouTube comment and return whether it contains a question, a link, or any keywords.
        The comment is: "{comment_text}"
        Video description (if available): "{description if description else 'No description provided.'}"
        Please check if the comment:
        - Contains a question (ends with a question mark).
        - Contains a link (http[s]://).
        - Contains any relevant keywords (e.g., help, how, what, please, etc.).

        Return a JSON response with the following keys:
        - contain_question: true or false
        - contain_link: true or false
        - contain_keyword: true or false
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Use a model like "gpt-4" or "gpt-3.5-turbo"
            messages=[{"role": "system", "content": "You are a helpful assistant."},
                      {"role": "user", "content": prompt}],
            max_tokens=200,
            temperature=0.5
        )
        # Extract the response content correctly
        analysis_content = response.choices[0].message.content.strip()
        # Parse the analysis content and convert to a dict-like structure
        # analysis_dict = {}
        # # Here, you can split the analysis content and map it to the keys
        # for line in analysis_content.split('\n'):
        #     if 'contain_question' in line:
        #         analysis_dict['contain_question'] = 'true' in line.lower()
        #     if 'contain_link' in line:
        #         analysis_dict['contain_link'] = 'true' in line.lower()
        #     if 'contain_keyword' in line:
        #         analysis_dict['contain_keyword'] = 'true' in line.lower()

        return analysis_content
    
    except Exception as e:
        logging.error(f"Error analyzing comment: {e}")
        return {
            'contain_question': False,
            'contain_link': False,
            'contain_keyword': False
        }




CACHE_TIMEOUT = 60 * 60

@login_required
def get_unreplied_comments(request):
    """
    Django view to fetch all unreplied comments for the authenticated user's channel, with caching.
    """
    if request.method != "GET":
        return JsonResponse({"error": "Invalid request method. Only GET is allowed."}, status=405)

    # Ensure the access token is available in the user's session or database
    account = request.user.accounts.first()
    if not account or not account.access_token:
        return JsonResponse({"error": "No account with a valid access token found."}, status=400)

    # Generate a cache key unique to the user
    cache_key = f"unreplied_comments_{request.user.id}"

    # Check if the data is already cached
    cached_data = cache.get(cache_key)
    if cached_data:
        return JsonResponse({"unreplied_comments": cached_data}, status=200)

    # Validate the access token
    if not is_google_token_valid(account.access_token):
        # Refresh the token if it's invalid
        refreshed_token_data = refresh_google_access_token(
            refresh_token=account.refresh_token,
            client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET,
        )
        if not refreshed_token_data or not refreshed_token_data.get("access_token"):
            return JsonResponse({"error": "Failed to refresh access token."}, status=401)

        # Update the account with the new access token
        account.access_token = refreshed_token_data.get("access_token")
        account.save()

    try:
        # Use the access token to fetch unreplied comments
        access_token = account.access_token
        unreplied_comments = fetch_all_unreplied_comments(access_token)

        # Iterate over each video and its corresponding comments
        processed_comments = {}
        for video_id, video_data in unreplied_comments.items():
            video_details = video_data["video_details"]  # Extract video details
            comments = video_data["comments"]
            
            processed_comments[video_id] = {
                "video_details": video_details,  # Include video details
                "comments": [
                    {
                        **comment,  # Retain original comment data
                        "ai_reply": generate_ai_reply(comment["snippet"]["textOriginal"], ''),  # Add AI-generated reply
                        "analysis": analyze_comment_with_gpt(comment["snippet"]["textOriginal"], '')  # Add GPT analysis
                    }
                    for comment in comments
                ]
            }

        # Output the processed comments (for debugging purposes)
        for video_id, video_data in processed_comments.items():
            # print(f"Video ID: {video_id}")
            # print(f"Video Title: {video_data['video_details']['title']}")
            for comment in video_data["comments"]:
                # print(f"Comment ID: {comment['id']}")
                print(f"Original Comment: {comment['snippet']['textOriginal']}")
                # print(f"AI Reply: {comment['ai_reply']}")
                print(f"Analysis: {comment['analysis']}\n")

        if not processed_comments:
            return JsonResponse({"error": "No unreplied comments found."}, status=404)

        # Cache the data before returning it
        cache.set(cache_key, processed_comments, timeout=CACHE_TIMEOUT)

        return JsonResponse({"unreplied_comments": processed_comments}, status=200)

    except ValidationError as e:
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)


# def get_unreplied_comments(request):
#     # Ensure the access token is available in the user's session or database
#     account = request.user.accounts.first()
#     if not account or not account.access_token:
#         return JsonResponse({"error": "No account with a valid access token found."}, status=400)

#         account = request.user.accounts.first()
#     unreplied_comments = fetch_all_unreplied_comments(account.access_token)
#     return JsonResponse({"unreplied_comments": "data"}, status=200)


@login_required
def all_youtube_videos_data(request):
    """
    Django view function to fetch all videos of a channel along with their metadata and analytics.

    Returns:
        JsonResponse: A JSON response containing video data or an error message.
    """
    # Get the user's account
    account = request.user.accounts.first()
    if not account or not account.access_token:
        return JsonResponse({"error": "No account with a valid access token found."}, status=400)

    # Validate the access token
    if not is_google_token_valid(account.access_token):
        # Refresh the token if it's invalid
        refreshed_token_data = refresh_google_access_token(
            refresh_token=account.refresh_token,
            client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
            client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET,
        )
        if not refreshed_token_data or not refreshed_token_data.get("access_token"):
            return JsonResponse({"error": "Failed to refresh access token."}, status=401)

        # Update the account with the new access token
        account.access_token = refreshed_token_data.get("access_token")
        account.save()

    # Use the access token to construct a cache key
    cache_key = f"youtube_videos_{account.access_token}"
    cached_data = cache.get(cache_key)

    if cached_data:
        # Return cached data if available
        return JsonResponse({"videos": cached_data}, status=200, safe=False)

    try:
        # Fetch all videos and their analytics
        video_data = get_all_videos_and_analytics(account.access_token)

        # Cache the data for future use
        cache_timeout = getattr(settings, "YOUTUBE_DATA_CACHE_TIMEOUT", 3600)  # Default to 1 hour if not set
        cache.set(cache_key, video_data, timeout=cache_timeout)

        return JsonResponse({"videos": video_data}, status=200, safe=False)

    except ValidationError as e:
        # Handle validation errors
        return JsonResponse({"error": str(e)}, status=400)
    except Exception as e:
        # Handle unexpected errors
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)



@login_required
def get_new_idea(request):
    """
    View to fetch YouTube channel data including video titles and descriptions, 
    analyze it, and suggest new video ideas and poll ideas. Caches the result 
    for a given period.
    
    Args:
        request: The HTTP request object.
    
    Returns:
        JsonResponse: Returns a JSON response with the fetched YouTube data or an error message.
    """
    if request.method == 'GET':
        # Get the user's account
        account = request.user.accounts.first()
        if not account or not account.access_token:
            return JsonResponse({"error": "No account with a valid access token found."}, status=400)

        # Validate the access token
        if not is_google_token_valid(account.access_token):
            # Refresh the token if it's invalid
            refreshed_token_data = refresh_google_access_token(
                refresh_token=account.refresh_token,
                client_id=settings.GOOGLE_OAUTH2_CLIENT_ID,
                client_secret=settings.GOOGLE_OAUTH2_CLIENT_SECRET,
            )
            if not refreshed_token_data or not refreshed_token_data.get("access_token"):
                return JsonResponse({"error": "Failed to refresh access token."}, status=401)

            # Update the account with the new access token
            account.access_token = refreshed_token_data.get("access_token")
            account.save()

        # Generate cache key based on the user's access token
        cache_key = f'new_idea_{account.id}'
        
        # Try to fetch the response from cache
        cached_response = cache.get(cache_key)
        if cached_response:
            return JsonResponse(cached_response, safe=False)

        try:
            # Fetch YouTube data using the provided access token
            youtube_data = fetch_youtube_data_for_idea(account.access_token)

            prompt = f"""
            Analyze the following YouTube data and suggest some new ideas for new videos and also for doing some polls.
            The data is: "{youtube_data}"

            Return a JSON response with the following keys:
            - ideas_for_video: content
            - idea_for_poll: content
            """

            response = client.chat.completions.create(
                model="gpt-4o-mini",  # Use a model like "gpt-4" or "gpt-3.5-turbo"
                messages=[{"role": "system", "content": "You are a helpful assistant."},
                          {"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.5
            )

            # Prepare the response content
            response_content = response.choices[0].message.content.strip()

            # Cache the response for 1 hour (you can change this to your desired duration)
            cache.set(cache_key, response_content, timeout=3600)

            return JsonResponse(response_content, safe=False)

        except ValidationError as e:
            # If there is an error in fetching the data
            return JsonResponse({'error': str(e)}, status=400)
        except Exception as e:
            # Catch any other exceptions and return a generic error
            return JsonResponse({'error': 'An unexpected error occurred'}, status=500)

    return JsonResponse({'error': 'Only GET method is allowed'}, status=405)