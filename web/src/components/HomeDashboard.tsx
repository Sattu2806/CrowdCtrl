'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, CircleAlert } from 'lucide-react';

type AnalyticsData = {
    kind: string;
    columnHeaders: {
      name: string;
      columnType: string;
      dataType: string;
    }[];
    rows: Array<any>;
  };
  

const HomeDashboard = () => {
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
        console.log(data)

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
    <div className='container mx-auto'>
        <Card className='bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white rounded-m my-6'>
              <CardHeader className='p-6 flex flex-row items-center space-x-4'>
                <CircleAlert size={20} className='rotate-180' />
                <p className='text-lg font-medium'>
                    This month, your videos reached {aggregatedData['views'] - aggregatedDataPrevious['views']} people, 
                    a <span className={percentageChange['views'] >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {Math.abs(percentageChange['views'])}% {percentageChange['views'] >= 0 ? ' increase ' : ' decrease '}
                    </span> 
                    compared to the last month. Engagements are 
                    <span className={percentageChange['estimatedMinutesWatched'] >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {percentageChange['estimatedMinutesWatched'] >= 0 ? ' up ' : ' down '} by {Math.abs(percentageChange['estimatedMinutesWatched'])}%
                    </span>, with {aggregatedData['likes']} likes and {aggregatedData['comments']} comments.
                    </p>
              </CardHeader>
        </Card>
        <hr />
        <div className='flex items-center space-x-1 p-1 px-3 border-2 border-purple-500/50 shadow-md rounded-full max-w-[150px] mt-4'>
            <img src="/youtube.png" alt="YouTube Logo" className="w-8 h-8" />
            <p className='text-neutral-100 font-medium'>@Finvest</p>
        </div>
        {analyticsData ? (
            <div className="lg:w-3/4">
              <div className="space-y-2 text-neutral-400">
                <div className='grid grid-cols-4 gap-4'>
                {Object.entries(aggregatedData).map(([key, value], index) => (
                //   <div key={index} className='text-sm flex items-center space-x-2'>
                //     <span className='font-semibold'>{key.charAt(0).toUpperCase() + key.slice(1, 15)}:</span> <span className='text-neutral-100'>{value}</span>
                //     <sub className={`text-[10px] ${percentageChange[key] < 0 ? "text-red-500":"text-green-500"}`}>
                //       {percentageChange[key]}%
                //     </sub>
                //   </div>
                <Card key={index} className='bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white rounded-m my-6'>
                    <CardHeader className='p-6 flex flex-row items-center space-x-4 text-xl font-semibold text-neutral-300'>
                        {key.charAt(0).toUpperCase() + key.slice(1, 15)}
                    </CardHeader>
                    <CardContent>
                        <p className='text-3xl font-medium text-neutral-100'>{value}</p>
                        <div className='pt-2 flex items-center space-x-2'>
                            <p className={`${percentageChange[key] > 0 ? "text-red-500":"text-green-500"} font-medium flex items-center space-x-1`}>
                                {percentageChange[key] > 0 ? (
                                    <ArrowDownRight size={16}/>
                                ):(
                                    <ArrowUpRight size={16}/>
                                )}
                                <span>
                                    {percentageChange[key]}%
                                </span>
                            </p>
                            <p className='text-neutral-500 font-medium'>
                                {percentageChange[key] > 0 ? (
                                    <>+</>
                                ):(
                                    <></>
                                )}
                                <span>{aggregatedData[key]-aggregatedDataPrevious[key]}</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
                ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-center">No analytics data available.</p>
        )}
    </div>
  )
}

export default HomeDashboard