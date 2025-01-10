'use client'

import { Button } from '@/components/ui/button'; // Assuming ShadCN's Button component is imported here
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const onGoogleLoginSuccess = () => {
  const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const REDIRECT_URI = 'youtubecallback';

  const scope = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/yt-analytics.readonly'
  ].join(' ');

  const params = {
    response_type: 'code',
    client_id: '407790550509-2jvkg86dio71479ha5kg48ctvc4m3iok.apps.googleusercontent.com',
    redirect_uri: `http://localhost:8001/${REDIRECT_URI}`,
    prompt: 'consent',
    access_type: 'offline',
    scope
  };

  const urlParams = new URLSearchParams(params).toString();
  window.location = `${GOOGLE_AUTH_URL}?${urlParams}`;
};

const LoginButton = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status by calling Django API or checking session
    const checkAuthStatus = async () => {
      const res = await fetch('http://localhost:8001/api/check-auth', { method: 'GET',credentials: 'include' });
      if (res.ok) {
        setIsAuthenticated(true);
      }
    };

    checkAuthStatus();
  }, []);

  const handleClick = () => {
    if (isAuthenticated) {
      // User is authenticated, so redirect or show fragment
       // Redirect to dashboard or another fragment route
    } else {
      // User is not authenticated, initiate Google login
      onGoogleLoginSuccess();
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        <Button onClick={handleClick} className="w-full py-2">
          'Sign in with Google'
        </Button>
      ):(
        <></>
      )
      }
    </>
  );
};

export default LoginButton;
