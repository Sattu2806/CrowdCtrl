'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import ChannelAnalytics from './ChannelAnalytics';
import Link from 'next/link';

interface YouTubeStatistics {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
}

interface YouTubeSnippet {
  title: string;
  description: string;
  customUrl: string;
  publishedAt: string;
  thumbnails: {
    medium: { url: string };
  };
  channelTitle: string;
}

interface VideoData {
  id: { kind: string; videoId: string };
  snippet: YouTubeSnippet;
}

interface YouTubeChannelInfo {
  snippet: YouTubeSnippet;
  statistics: YouTubeStatistics;
}

export interface YouTubeDataResponse {
  channel_info: { items: YouTubeChannelInfo[] };
  videos: VideoData[];
}

const YouTubeDataComponent: React.FC = () => {
  const [youtubeData, setYouTubeData] = useState<YouTubeDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({}); // State for expanded descriptions

  const maxLength = 50; // Maximum characters to show when collapsed

  const toggleDescription = (videoId: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  useEffect(() => {
    const fetchYouTubeData = async () => {
      try {
        const response = await fetch('http://localhost:8001/getyoutubedata', {
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

    if (seconds >= intervals.year) return `${Math.floor(seconds / intervals.year)} year(s) ago`;
    if (seconds >= intervals.month) return `${Math.floor(seconds / intervals.month)} month(s) ago`;
    if (seconds >= intervals.week) return `${Math.floor(seconds / intervals.week)} week(s) ago`;
    if (seconds >= intervals.day) return `${Math.floor(seconds / intervals.day)} day(s) ago`;
    if (seconds >= intervals.hour) return `${Math.floor(seconds / intervals.hour)} hour(s) ago`;
    return `${Math.floor(seconds / intervals.minute)} minute(s) ago`;
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <h1 className="text-3xl font-semibold text-center mb-5 text-neutral-300 font-mono">YouTube Dashboard</h1>
      {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-6">
        <div className="sticky top-8 self-start col-span-2">
          <ChannelAnalytics youtubeData={youtubeData} />
        </div>
        <div className="col-span-6">
          {youtubeData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {youtubeData.videos.map((video) => {
                const isExpanded = expandedDescriptions[video.id.videoId] || false;
                return (
                  <Link href={`/youtube/video/${video.id.videoId}`} key={video.id.videoId}>
                    <Card className="rounded-2xl bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white">
                      <CardHeader className="p-4">
                        <Image
                          src={video.snippet.thumbnails.medium.url}
                          width={500}
                          height={400}
                          alt="Video thumbnail"
                          className="rounded-xl"
                        />
                      </CardHeader>
                      <CardContent className="px-4">
                        <h2 className="font-medium text-neutral-300">{video.snippet.title}</h2>
                        {isExpanded ? (
                          <span className="text-neutral-400 font-medium text-sm">
                            {video.snippet.description}{' '}
                            <button
                              className="text-neutral-400 font-medium text-sm underline ml-2"
                              onClick={(e) => {
                                e.preventDefault();
                                toggleDescription(video.id.videoId);
                              }}
                            >
                              Show less
                            </button>
                          </span>
                        ) : (
                          <span className="text-neutral-400 font-medium text-sm">
                            {video.snippet.description.slice(0, maxLength)}
                            {video.snippet.description.length > maxLength && '...'}{' '}
                            {video.snippet.description.length > maxLength && (
                              <button
                                className="text-neutral-400 font-medium text-sm underline ml-2"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toggleDescription(video.id.videoId);
                                }}
                              >
                                Show more
                              </button>
                            )}
                          </span>
                        )}
                        <p className="text-neutral-500 text-sm">• {timeAgo(video.snippet.publishedAt)}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-600">Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default YouTubeDataComponent;
