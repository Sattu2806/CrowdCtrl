'use client'
import React, { useEffect, useState } from 'react';
import { YouTubeDataResponse } from './YoutubeData';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoveDownRight, MoveUpRight } from 'lucide-react';

type Props = {};

type AnalyticsData = {
  kind: string;
  columnHeaders: {
    name: string;
    columnType: string;
    dataType: string;
  }[];
  rows: Array<any>;
};

const ChannelAnalytics = ({ youtubeData }: { youtubeData: YouTubeDataResponse | null }) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analyticsDataprevious, setAnalyticsDataprevios] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8001/fetch-channel-analytics/', {
          method: 'GET',
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setAnalyticsData(data.data.last_28_days);
          setAnalyticsDataprevios(data.data.previous_28_days);
        } else {
          throw new Error(data.error || 'Failed to fetch analytics data');
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  // previous_28_days

  // Mapping the column headers to their respective names
  const columnNamesPrevious = analyticsDataprevious?.columnHeaders.map((header) => header.name) || [];

  // Aggregating data
  const aggregatedDataPrevious: Record<string, number> = {};

  analyticsDataprevious?.rows.forEach((row) => {
    row.slice(1).forEach((value: number, index: number) => {
      const columnNamesPreviou = columnNamesPrevious[index + 1]; // Skip the first column (date or video identifier)
      aggregatedDataPrevious[columnNamesPreviou] = (aggregatedDataPrevious[columnNamesPreviou] || 0) + value;
    });
  });

  // Assuming the first column in rows represents the dates for the analytics range
  const analyticsRangePrevious = analyticsDataprevious?.rows.map((row) => row[0]) || [];
  const startDatePrevious = analyticsRangePrevious[0] || 'N/A';
  const endDatePrevious = analyticsRangePrevious[analyticsRangePrevious.length - 1] || 'N/A';

  // for last_28_days

  // Mapping the column headers to their respective names
  const columnNames = analyticsData?.columnHeaders.map((header) => header.name) || [];

  // Aggregating data
  const aggregatedData: Record<string, number> = {};

  analyticsData?.rows.forEach((row) => {
    row.slice(1).forEach((value: number, index: number) => {
      const columnName = columnNames[index + 1]; // Skip the first column (date or video identifier)
      aggregatedData[columnName] = (aggregatedData[columnName] || 0) + value;
    });
  });

  // Assuming the first column in rows represents the dates for the analytics range
  const analyticsRange = analyticsData?.rows.map((row) => row[0]) || [];
  const startDate = analyticsRange[0] || 'N/A';
  const endDate = analyticsRange[analyticsRange.length - 1] || 'N/A';




  // Calculate percentage change between `aggregatedData` and `aggregatedDataPrevious`
  const percentageChange: Record<string, number> = {};

  // Iterate over keys in `aggregatedDataPrevious`
  Object.keys(aggregatedDataPrevious).forEach((key) => {
    const previousValue = aggregatedDataPrevious[key] || 0;
    const currentValue = aggregatedData[key] || 0;

    // Avoid division by zero; assume 0% change if previous value is 0
    if (previousValue === 0) {
      percentageChange[key] = currentValue === 0 ? 0 : Infinity; // Infinite change if previous value is 0
    } else {
      const change = ((currentValue - previousValue) / previousValue) * 100;
      percentageChange[key] = parseFloat(change.toFixed(2)); // Round to 2 decimal places
    }
  });

  // Logging the result
  console.log('Percentage Change:', percentageChange);


  return (
    <div className="container mx-auto px-6 max-w-4xl">
      <Card className='bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white rounded-3xl'>
        <CardHeader className='p-6'>
          {youtubeData && (
            <div className="">
              <div className="flex items-center space-x-4 mb-5">
                <Image
                  src={youtubeData.channel_info.items[0]?.snippet.thumbnails.medium.url}
                  alt="Channel Thumbnail"
                  width={64}
                  height={64}
                  className="rounded-full"
                />
                <div className="text-xs">
                  <p>Subscribers: {youtubeData.channel_info.items[0]?.statistics.subscriberCount}</p>
                  <p>Videos: {youtubeData.channel_info.items[0]?.statistics.videoCount}</p>
                  <p>Views: {youtubeData.channel_info.items[0]?.statistics.viewCount}</p>
                </div>
              </div>
              <div className='space-y-2'>
                  <CardTitle>
                    {youtubeData.channel_info.items[0]?.snippet.title || 'Channel Name'}
                  </CardTitle>
                  <CardDescription className='text-sm'>
                    {youtubeData.channel_info.items[0]?.snippet.description || ''}
                  </CardDescription>
                </div>

            </div>
          )}
        </CardHeader>
        <hr />
        <CardContent>
          <h2 className="text-base font-medium py-4 dark:text-neutral-200">Last 28 days</h2>
          {analyticsData ? (
            <div className="">
              <div className="space-y-2 text-neutral-400">
                {Object.entries(aggregatedData).map(([key, value], index) => (
                  <div key={index} className='text-sm flex items-center space-x-2'>
                    <span className='font-semibold'>{key.charAt(0).toUpperCase() + key.slice(1, 15)}:</span> <span className='text-neutral-100'>{value}</span>
                    <sub className={`text-[10px] ${percentageChange[key] < 0 ? "text-red-500":"text-green-500"}`}>
                      {percentageChange[key]}%
                    </sub>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center">No analytics data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChannelAnalytics;
