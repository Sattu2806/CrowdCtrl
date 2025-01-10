'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';
import { use } from 'react';
import Insights from '../Insights';
import EachComment from '../EachComment';
import EachRepliedComment from '../EachRepliedComment';


type PageProps = {
  params: Promise<{ video_id: string }>;
};

const Page = ({ params }: PageProps) => {
  const [comments, setComments] = useState<any[]>([]);
  const [videodata, setVideoData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingReplies, setLoadingReplies] = useState<{ [key: string]: boolean }>({}); // Loading state for replies
  const [insights, setinsights] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 50; // Maximum characters to show when collapsed

  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  const param = use(params);

  console.log(comments)

  const fetchData = async () => {
    try {
      setLoading(true); // Start loading
  
      // Step 1: Fetch Video Data
      const videoResponse = await fetch(`http://localhost:8001/getvideodataid/?video_id=${param.video_id}`, {
        method: 'GET',
        credentials: 'include',
      });
  
      if (!videoResponse.ok) {
        throw new Error(`Error fetching video data: ${videoResponse.statusText}`);
      }
  
      const videoData = await videoResponse.json();
      const videoDescription = videoData.items?.[0]?.snippet?.description || ''; // Extract description
      setVideoData(videoData.items?.[0]); // Update state with video data
  
      // Step 2: Fetch Comments Data using the extracted description
      const commentsResponse = await fetch(
        `http://localhost:8001/getcommentsbyvideo/?video_id=${param.video_id}&description=${encodeURIComponent(videoDescription)}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
  
      if (!commentsResponse.ok) {
        throw new Error(`Error fetching comments: ${commentsResponse.statusText}`);
      }
  
      const commentsData = await commentsResponse.json();
      setComments(commentsData.items || []); // Update state with comments

      // Step 3: Fetch Comments Data insights
      const insightResponse = await fetch(
        `http://localhost:8001/chat_openai/?video_Id=${param.video_id}&comments=${comments}&type=generate_insight`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );
  
      if (!insightResponse.ok) {
        throw new Error(`Error fetching comments insights: ${insightResponse.statusText}`);
      }
  
      const insightData = await insightResponse.json();
      setinsights(insightData.data); // Update state with comments
  
      setError(null); // Clear any existing errors
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false); // End loading
    }
  };

  useEffect(() => {
    fetchData();
  }, [param.video_id]);

  const formatViews = (views: number) => {
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
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

  const GenerateReplyAgain = async (commentId: string, comment: string) => {
    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true })); // Set loading state for specific comment

      const videoResponse = await fetch(`http://localhost:8001/chat_openai/?comment_Id=${commentId}&video_Id=${param.video_id}&comment=${comment}&type=generate_reply_again`, {
        method: 'GET',
        credentials: 'include',
      });

      if (videoResponse.ok) {
        await fetchData(); // Refetch data after generating reply
      } else {
        throw new Error('Failed to regenerate reply');
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false })); // End loading state for specific comment
    }
  };

  const replytoComment = async  (commentId: string) => {
    try {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: true })); // Set loading state for specific comment

      const videoResponse = await fetch(`http://localhost:8001/do_reply/?comment_Id=${commentId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (videoResponse.ok) {
        await fetchData(); // Refetch data after generating reply
      } else {
        throw new Error('Failed to regenerate reply');
      }
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [commentId]: false })); // End loading state for specific comment
    }
  }





  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p className="text-red-500">Error: {error}</p>;
  }

  return (
    <div className="p-4 container mx-auto">
        {/* <div className='flex items-center justify-between mb-5'>
            <h1 className='text-2xl font-semibold text-neutral-200'>Comments</h1>
            <div className='filters flex items-center space-x-4 sticky top-8 self-start'>
              <div className='flex items-center space-x-1 p-1 px-3 border-2 border-purple-500/50 shadow-md rounded-full'>
                <img src="/youtube.png" alt="YouTube Logo" className="w-8 h-8" />
                <p className='text-neutral-100 font-medium'>{videodata.snippet.channelTitle}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className='text-neutral-400 flex items-center space-x-1 p-2 rounded-lg bg-neutral-900'>
                  <ArrowUpDown size={22} strokeWidth={1.5} />
                  <span className='font-medium'>Sort</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Newest First</DropdownMenuItem>
                  <DropdownMenuItem>Oldest First</DropdownMenuItem>
                  <DropdownMenuItem>Most Liked</DropdownMenuItem>
                  <DropdownMenuItem>Most Replied</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger className='text-neutral-400 flex items-center space-x-1 p-2 rounded-lg bg-neutral-900'>
                  <ListFilter size={22} strokeWidth={1.5} />
                  <span className='font-medium'>Filters</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Unreplied</DropdownMenuItem>
                  <DropdownMenuItem>Contain qestion</DropdownMenuItem>
                  <DropdownMenuItem>Unreplied questions</DropdownMenuItem>
                  <DropdownMenuItem>Contain Links</DropdownMenuItem>
                  <DropdownMenuItem>Contain Keywords</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
        </div> */}
      <div className="md:grid grid-cols-12 gap-5">
        {/* Video Information */}
        {videodata && (
          <div className="col-span-3">
            <Card className="rounded-2xl bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white">
              <CardHeader className='p-4'>
                <Image
                  src={videodata.snippet.thumbnails.medium.url}
                  width={500}
                  height={400}
                  alt="Video thumbnail"
                  className="rounded-xl"
                />
              </CardHeader>
              <CardContent className='px-4'>
                <h2 className="font-medium text-neutral-300">{videodata.snippet.title}</h2>
                <h2 className="text-neutral-400 font-medium text-sm">{videodata.snippet.channelTitle}</h2>
                {isExpanded ? (
                    <span className='text-neutral-400 font-medium text-sm'>
                      {videodata.snippet.description}{" "}
                      <button
                        className="text-neutral-400 font-medium text-sm underline ml-2"
                        onClick={toggleDescription}
                      >
                        Show less
                      </button>
                    </span>
                  ) : (
                    <span className='text-neutral-400 font-medium text-sm'>
                      {videodata.snippet.description.slice(0, maxLength)}
                      {videodata.snippet.description.length > maxLength && "..."}{" "}
                      {videodata.snippet.description.length > maxLength && (
                        <button
                          className="text-neutral-400 font-medium text-sm underline ml-2"
                          onClick={toggleDescription}
                        >
                          Show more
                        </button>
                      )}
                    </span>
                  )}
                <p className="text-neutral-500 text-sm">
                  {formatViews(videodata.statistics.viewCount)} views • {timeAgo(videodata.snippet.publishedAt)}
                </p>
              </CardContent>
            </Card>
            <Insights insight={insights}/>
          </div>
        )}

        {/* Comments Section */}
        <div className="col-span-9">
          {comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map((comment, index) => {
                /**
                 * Check if the video creator has replied to a comment and return the matching reply.
                 * 
                 * @param {Object} comment - The comment object containing replies.
                 * @param {string} creatorChannelId - The channel ID of the video creator.
                 * @returns {Object|null} - Returns the matching reply object if the creator has replied, otherwise null.
                 */
                function hasCreatorReplied(comment:any, creatorChannelId:any) {
                  // Check if the comment has replies
                  if (comment.replies && Array.isArray(comment.replies.comments)) {
                    // Find the reply from the creator
                    const creatorReply = comment.replies.comments.find(reply => {
                      const replyChannelId = reply.snippet.authorChannelId?.value;
                      return replyChannelId === creatorChannelId;
                    });

                    // Return the matching reply or null if not found
                    return creatorReply || null;
                  }
                  return null; // No replies or no match
                }


              const alreadyreplied = hasCreatorReplied(comment, videodata.snippet.channelId) 
              console.log(alreadyreplied,comment,videodata.snippet.channelId)

                return(

                // <div key={index} className="border p-4 shadow-md rounded-2xl bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white">
                //   <p className="font-semibold text-neutral-300">
                //     {comment.snippet.topLevelComment.snippet.authorDisplayName}
                //   </p>
                //   <p className="text-gray-700">
                //     {comment.snippet.topLevelComment.snippet.textDisplay}
                //   </p>
                //   <p className="text-gray-500 text-sm">
                //     {new Date(comment.snippet.topLevelComment.snippet.publishedAt).toLocaleString()}
                //   </p>
                //   <div className="rounded-md dark:bg-neutral-800 bg-neutral-200 p-2 m-2">
                //     <p className="col-span-10 dark:text-neutral-300">{comment.ai_reply}</p>
                //     <div className="flex items-center space-x-5 mt-3">
                //       <Button>Reply</Button>
                //       <Button
                //         onClick={() => GenerateReplyAgain(comment.id, comment.snippet.topLevelComment.snippet.textOriginal)}
                //         disabled={loadingReplies[comment.id]} // Disable button while loading
                //       >
                //         {loadingReplies[comment.id] ? (
                //           <Circle className="animate-spin text-blue-500" />
                //         ) : (
                //           <Sparkles />
                //         )}
                //         {loadingReplies[comment.id] ? ' Regenerating...' : ' Regenerate'}
                //       </Button>
                //     </div>
                //   </div>
                //   <div className='p-4 px-10'>
                //       {comment.replies && comment.replies.comments.map((reply:any[],index:number) => (
                //         <div key={index}>
                //             <p className="font-semibold text-neutral-300">
                //               {comment.snippet.topLevelComment.snippet.authorDisplayName}
                //             </p>
                //             <p className="text-gray-700">
                //               {comment.snippet.topLevelComment.snippet.textDisplay}
                //             </p>
                //             <p className="text-gray-500 text-sm">
                //               {new Date(comment.snippet.topLevelComment.snippet.publishedAt).toLocaleString()}
                //             </p>
                //         </div>
                //       ))}
                //   </div>
                // </div>
                <>
                {alreadyreplied ? (
                  <EachRepliedComment authorDisplayName={comment.snippet.topLevelComment.snippet.authorDisplayName} textDisplay={comment.snippet.topLevelComment.snippet.textDisplay} publishedAt={comment.snippet.topLevelComment.snippet.publishedAt} ai_reply={comment.ai_reply} id={comment.id} textOriginal={comment.snippet.topLevelComment.snippet.textOriginal} fetchData={fetchData} video_id={param.video_id} reply={alreadyreplied.snippet.textOriginal
                  } />
                ):(
                  <EachComment authorDisplayName={comment.snippet.topLevelComment.snippet.authorDisplayName} textDisplay={comment.snippet.topLevelComment.snippet.textDisplay} publishedAt={comment.snippet.topLevelComment.snippet.publishedAt} ai_reply={comment.ai_reply} id={comment.id} textOriginal={comment.snippet.topLevelComment.snippet.textOriginal} fetchData={fetchData} video_id={param.video_id} />
                )}
                </>
              )})}
            </div>
          ) : (
            <p>No comments found for this video.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page;
