"""
URL configuration for youtube_back_manager project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from .api import api
from .api import GoogleLoginApi
from replycomments.views import get_youtube_data, get_youtube_video_comments,get_youtube_video_data, fetch_channel_analytics, check_auth, chatai, reply_to_comment_api, get_unreplied_comments,all_youtube_videos_data,get_new_idea

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
    path('youtubecallback/', GoogleLoginApi.as_view(), name='google-login'),
    path('getyoutubedata/', get_youtube_data, name="get_youtube_data"),
    path('getcommentsbyvideo/', get_youtube_video_comments, name="get_youtube_data_video_comments"),
    path('getvideodataid/', get_youtube_video_data, name="get_youtube_video_data"),
    path('fetch-channel-analytics/', fetch_channel_analytics, name="fetch_channel_analytics"),
    path('api/check-auth', check_auth, name='auth-check' ),
    path('chat_openai/', chatai, name='chat_openai'),
    path('reply-to-comment/', reply_to_comment_api, name='reply_to_comment_api'),
    path('all-unreplied-comments/', get_unreplied_comments, name='get_unreplied_comment'),
    path('all-youtube-videos-data/', all_youtube_videos_data, name='all_youtube_videos_data'),
    path('get_new_idea/', get_new_idea, name='get_new_idea'),
]
