'use client'
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';

type Props = {}

const Suggestions = (props: Props) => {
    const [youtubeData, setYouTubeData] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true); // Loading state

    const maxLength = 50; // Maximum characters to show when collapsed

    useEffect(() => {
        const fetchYouTubeData = async () => {
            try {
                const response = await fetch('http://localhost:8001/get_new_idea', {
                    method: 'GET',
                    credentials: 'include',
                });
                if (!response.ok) throw new Error('Failed to fetch YouTube data');
                const data = await response.json();
                setYouTubeData(JSON.parse(data.replace(/^```json\s*|\s*```$/g, '').trim()));
                setLoading(false); // Set loading to false after data is fetched
            } catch (err) {
                console.error(err);
                setError((err as Error).message);
                setLoading(false); // Set loading to false even on error
            }
        };
        fetchYouTubeData();
    }, []);

    if (loading) {
        return (
            <div className="container mx-auto flex justify-center items-center min-h-screen">
                <p className="text-xl text-neutral-300">Loading, please wait...</p>
            </div>
        );
    }

    return (
        <div className='container mx-auto'>
            <div className='w-2/3'>
                <div className='grid grid-cols-2 gap-6'>
                    <Card className='bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white rounded-3xl'>
                        <CardHeader>
                            <div>
                                <p className='font-medium text-xl'>Content Ideas</p>
                                <span className='text-xs text-neutral-500'>based on comments</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className='bg-neutral-950 p-4 rounded-2xl'>
                                {youtubeData.ideas_for_video.map((video: any, index: any) => (
                                    <p className='py-3 text-sm text-neutral-300' key={index}>
                                        {index + 1}. {video}
                                    </p>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className='bg-gradient-to-b dark:from-neutral-900 via-neutral-600 dark:to-neutral-950 dark:text-white rounded-3xl'>
                        <CardHeader>
                            <div>
                                <p className='font-medium text-xl'>Poll Ideas</p>
                                <span className='text-xs text-neutral-500'>based on comments</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className='bg-neutral-950 p-4 rounded-2xl'>
                                {youtubeData.idea_for_poll.map((poll: any, index: any) => (
                                    <p className='py-3 text-sm text-neutral-300' key={index}>
                                        {index + 1}. {poll}
                                    </p>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Suggestions;
