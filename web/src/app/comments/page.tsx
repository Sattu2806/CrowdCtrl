"use client";
import React, { useEffect, useState } from "react";
import EachComment from "../youtube/video/EachComment";
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import Image from "next/image";

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



const Page = () => {
  const [unrepliedComments, setUnrepliedComments] = useState<Record<string, Comment[]> | null>(null);
  const [videoDetails, setVideoDetails] = useState<Record<string, VideoDetails> | null>(null);
  const [error, setError] = useState("");
  const [sort, setSort] = useState("newest");
  const [filter, setFilter] = useState("unreplied"); // Filter state for Select dropdown
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const maxLength = 50;

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

  // Sorting logic
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

  const timeAgo = (publishedAt: string) => {
    const publishedDate = new Date(publishedAt);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - publishedDate.getTime()) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
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

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!unrepliedComments || !videoDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between gap-5 py-4 sticky top-0 bg-neutral-950">
        <p className="text-3xl font-semibold text-neutral-200">
            Comments
        </p>
        {/* Sort Dropdown */}
        <div className="flex items-center justify-end gap-5">
            <div className='flex items-center space-x-1 p-1 px-3 border-2 border-purple-500/50 shadow-md rounded-full'>
                <img src="/youtube.png" alt="YouTube Logo" className="w-8 h-8" />
                <p className='text-neutral-100 font-medium'>@Finvest</p>
            </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="border-[2px] border-purple-500/50 rounded-full px-4 py-5 w-[140px] font-semibold">
            <SelectValue placeholder="Sort Comments" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Sort By</SelectLabel>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="mostLiked">Most Liked</SelectItem>
              <SelectItem value="mostReplies">Most Replies</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* Filter Dropdown */}
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="border-[2px] border-purple-500/50 rounded-full px-4 py-5 w-[180px] font-semibold">
            <SelectValue placeholder="Filter Comments" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
                <SelectLabel>Filter By</SelectLabel>
                <SelectItem value="all">All Comments</SelectItem>
                <SelectItem value="replied">Replied Comments</SelectItem>
                <SelectItem value="unreplied">Unreplied Comments</SelectItem>
                <SelectItem value="containQuestion">Contain Question</SelectItem>
                <SelectItem value="containLink">Contain Link</SelectItem>
                <SelectItem value="containKeyword">Contain Keyword</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        </div>
      </div>

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
            <div key={videoId} className="grid grid-cols-4 gap-4 border-b">
              {videoDetails[videoId] && (
                <Card className="rounded-2xl bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white max-h-[400px] my-4">
                  <CardHeader className='p-4'>
                    <Image
                      src={videoDetails[videoId].thumbnails.medium.url}
                      width={500}
                      height={400}
                      alt="Video thumbnail"
                      className="rounded-xl"
                    />
                  </CardHeader>
                  <CardContent className='px-4'>
                    <h2 className="font-medium text-neutral-300">{videoDetails[videoId].title}</h2>
                    <h2 className="text-neutral-400 font-medium text-sm">{videoDetails[videoId].channel_title}</h2>
                    {expandedDescriptions[videoDetails[videoId].id] ? (
                      <span className='text-neutral-400 font-medium text-sm'>
                        {videoDetails[videoId].description}{" "}
                        <button
                          className="text-neutral-400 font-medium text-sm underline ml-2"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDescription(videoDetails[videoId].id);
                          }}
                        >
                          Show less
                        </button>
                      </span>
                    ) : (
                      videoDetails[videoId].description.length > maxLength && (
                        <button
                          className="text-neutral-400 font-medium text-sm underline ml-2"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDescription(videoDetails[videoId].id);
                          }}
                        >
                          Show more
                        </button>
                      )
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="col-span-3">
                {filteredComments.map((comment) => (
                    <div key={comment.id} className="my-4">
                        <EachComment
                        authorDisplayName={comment.snippet.authorDisplayName}
                        textDisplay={comment.snippet.textDisplay}
                        publishedAt={comment.snippet.publishedAt}
                        ai_reply={comment.ai_reply || ""}
                        id={comment.id}
                        textOriginal={comment.snippet.textOriginal}
                        fetchData={fetchUnrepliedComments}
                        video_id={comment.snippet.videoId}
                        />
                    </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Page;
