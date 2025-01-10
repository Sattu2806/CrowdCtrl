'use client'
import React, { useEffect, useState } from 'react'
import { YouTubeDataResponse } from './YoutubeData';
import { Card, CardContent, CardHeader } from './ui/card';
import Image from 'next/image';

type Props = {}

type Snippet = {
    channelId: string;
    videoId: string;
    authorChannelId: { value: string };
    authorChannelUrl: string;
    authorDisplayName: string;
    authorProfileImageUrl: string;
    canRate: boolean;
    likeCount: number;
    publishedAt: string;
    textDisplay: string;
    textOriginal: string;
    updatedAt: string;
    viewerRating: string;
  };
  
  type VideoDetails = {
    id: string;
    title: string;
    description: string;
    published_at: string;
    thumbnails:{
      medium:{
          url:string
      }
    }
    channel_title:string
  };
  
  type Comment = {
    id: string;
    ai_reply?: string;
    replied: boolean;
    replies: any[];
    analysis:string
    snippet: Snippet;
  };
  
  type UnrepliedCommentsData = {
    unreplied_comments: Record<string, { comments: Comment[]; video_details: VideoDetails }>;
  };
  
  

const TopPerformer = (props: Props) => {
  const [youtubeData, setYouTubeData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const maxLength = 50; // Maximum characters to show when collapsed

  useEffect(() => {
    const fetchYouTubeData = async () => {
      try {
        const response = await fetch('http://localhost:8001/all-youtube-videos-data', {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch YouTube data');
        const data: YouTubeDataResponse = await response.json();
        setYouTubeData(data);
      } catch (err) {
        console.error(err);
        setError((err as Error).message);
      }
    };
    fetchYouTubeData();
  }, []);

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString()
  };

  const timeAgo = (publishedAt: string) => {
    const publishedDate = new Date(publishedAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - publishedDate.getTime()) / 1000);
  
    const intervals = {
      year: 31536000, // seconds in a year
      month: 2592000, // seconds in a month
      week: 604800, // seconds in a week
      day: 86400, // seconds in a day
      hour: 3600, // seconds in an hour
      minute: 60, // seconds in a minute
    };
  
    if (seconds >= intervals.year) {
      const years = Math.floor(seconds / intervals.year);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    } else if (seconds >= intervals.month) {
      const months = Math.floor(seconds / intervals.month);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else if (seconds >= intervals.week) {
      const weeks = Math.floor(seconds / intervals.week);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else if (seconds >= intervals.day) {
      const days = Math.floor(seconds / intervals.day);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (seconds >= intervals.hour) {
      const hours = Math.floor(seconds / intervals.hour);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (seconds >= intervals.minute) {
      const minutes = Math.floor(seconds / intervals.minute);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'just now';
    }
  };


  // Filter out videos with an empty items array in the metadata
  const topVideos = youtubeData 
    ? youtubeData.videos
        .filter((video: any) => video.metadata.items && video.metadata.items.length > 0) // Filter out empty metadata items
        .sort((a: any, b: any) => parseInt(b.metadata.items[0].statistics.viewCount) - parseInt(a.metadata.items[0].statistics.viewCount)) // Sort by viewCount
        .slice(0, 5) // Get top 5 videos
    : [];


  console.log(topVideos)


    const [unrepliedComments, setUnrepliedComments] = useState<Record<string, Comment[]> | null>(null);
    const [videoDetails, setVideoDetails] = useState<Record<string, VideoDetails> | null>(null);
    const [sort, setSort] = useState("mostLiked");
    const [filter, setFilter] = useState("all"); // Filter state for Select dropdown
    const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  
    const toggleDescription = (videoId: string) => {
      setExpandedDescriptions((prev) => ({
        ...prev,
        [videoId]: !prev[videoId],
      }));
    };
  
    console.log(unrepliedComments)
  
    async function fetchUnrepliedComments() {
      try {
        const response = await fetch("http://localhost:8001/all-unreplied-comments/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch unreplied comments");
        }
  
        const data: UnrepliedCommentsData = await response.json();
        const mappedComments = Object.fromEntries(
          Object.entries(data.unreplied_comments).map(([videoId, { comments }]) => [
            videoId,
            comments.map((comment) => ({
              id: comment.id,
              ai_reply: comment.ai_reply,
              replied: comment.replied,
              replies: comment.replies || [],
              analysis:JSON.parse(comment.analysis.replace(/^```json\s*|\s*```$/g, '').trim()),
              snippet: {
                ...comment.snippet,
              },
            })),
          ])
        );
  
        setUnrepliedComments(mappedComments);
  
        const mappedVideoDetails = Object.fromEntries(
          Object.entries(data.unreplied_comments).map(([videoId, { video_details }]) => [
            videoId,
            video_details,
          ])
        );
  
        setVideoDetails(mappedVideoDetails);
      } catch (error) {
        console.error("Error fetching unreplied comments:", error);
        setError("Failed to load comments.");
      }
    }
  
    useEffect(() => {
      fetchUnrepliedComments();
    }, []);
  
    const sortComments = (comments: Comment[]): Comment[] => {
        switch (sort) {
          case "newest":
            return comments.sort((a, b) => new Date(b.snippet.publishedAt).getTime() - new Date(a.snippet.publishedAt).getTime());
          case "oldest":
            return comments.sort((a, b) => new Date(a.snippet.publishedAt).getTime() - new Date(b.snippet.publishedAt).getTime());
          case "mostLiked":
            return comments.sort((a, b) => b.snippet.likeCount - a.snippet.likeCount);
          case "mostReplies":
            return comments.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0));
          default:
            return comments;
        }
    };
    
  
    const filterComments = (comments: Comment[]): Comment[] => {
      let filteredComments = comments;
  
      // Filter based on the selected filter (unreplied, replied, all)
      if (filter === "unreplied") {
        filteredComments = filteredComments.filter(comment => !comment.replied);
      } else if (filter === "replied") {
        filteredComments = filteredComments.filter(comment => comment.replied);
      }
       // Filter based on analysis properties
      if (filter === "containQuestion") {
          filteredComments = filteredComments.filter(comment => comment.analysis?.contain_question);
      } else if (filter === "containLink") {
          filteredComments = filteredComments.filter(comment => comment.analysis?.contain_link);
      } else if (filter === "containKeyword") {
          filteredComments = filteredComments.filter(comment => comment.analysis?.contain_keyword);
      }
  
      return filteredComments;
    };
    let renderedCommentsCount = 0;
  
    if (error) {
      return <div>Error: {error}</div>;
    }
  
    if (!unrepliedComments || !videoDetails) {
      return <div>Loading...</div>;
    }
  return (
    <div className='container mx-auto pb-4'>
        <h1 className='text-2xl font-bold mb-5'>Top Performers</h1>
        <div className='w-2/3'>
        <div className='grid grid-cols-2 gap-6'>
        <Card className='bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white rounded-3xl'>
            <CardHeader>
                <div>
                    <p className='font-medium text-xl'>Top Content</p>
                    <span className='text-xs text-neutral-500'>by engagements</span>
                </div>
            </CardHeader>
            <CardContent>
                {topVideos.map((video:any,index:any) => {
                    return(
                        <div key={index} className='py-4'>
                            <div className='flex items-center space-x-2'>
                                <Image src={`${video.metadata.items[0].snippet.thumbnails.medium.url}`} width={100} height={50} alt={video.metadata.etag} className='rounded-md'/>
                                <div >
                                    <p className='font-medium text-sm text-neutral-300'>{video.metadata.items[0].snippet.title}</p>
                                    <p className='text-neutral-500 text-xs'>
                                        {/* <span>{new Date(video.metadata.items[0].snippet.publishedAt).toLocaleString()}</span>
                                        <span>{formatViews(video.metadata.items[0].statistics.viewCount)}</span> */}
                                        {formatViews(video.metadata.items[0].statistics.viewCount)} views • {timeAgo(video.metadata.items[0].snippet.publishedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </CardContent>
        </Card>
        <Card className='bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white rounded-3xl'>
            <CardHeader className='pb-0'>
                <div>
                    <p className='font-medium text-xl'>Top Comments</p>
                    <span className='text-xs text-neutral-500'>by engagements</span>
                </div>
            </CardHeader>
            <CardContent>
                {Object.keys(unrepliedComments).length === 0 ? (
                <p>No unreplied comments found.</p>
                ) : (
                Object.entries(unrepliedComments).map(([videoId, comments]) => {
                    const filteredComments = filterComments(sortComments(comments));

                    // Only render the video if it has comments after applying the filter
                    if (filteredComments.length === 0) {
                    return null;
                    }

                    return (
                    <div key={videoId}>
                        {filteredComments.map((comment, index) => {
                        // Stop rendering if the total comments rendered reach 5
                        if (renderedCommentsCount >= 7) {
                            return null;
                        }

                        renderedCommentsCount++; // Increment the rendered comments count

                        return (
                            <div key={index} className='py-4 '>
                                <div>
                                    <p className='text-sm text-neutral-200'>{comment.snippet.textDisplay.substring(0, 60)}...</p>
                                    <p className='text-xs text-neutral-500'>
                                        {
                                            comment.snippet.authorDisplayName
                                        } .  {timeAgo(comment.snippet.updatedAt)} 
                                    </p>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                    );
                })
                )}
                  </CardContent>
                  </Card>
        </div>
        </div>

    </div>
  )
}

export default TopPerformer
