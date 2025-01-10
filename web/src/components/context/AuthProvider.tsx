'use client'
import React, { createContext, useState, useContext, useEffect } from "react";
import { redirect } from "next/navigation";

// Define the structure of the auth context
interface AuthContextType {
  isAuthenticated: boolean;
  user: null | { name: string; email: string, image:string }; // Adjust as needed for your user structure
  setUser: (user: { name: string; email: string, image:string } | null) => void;
  checkAuth: () => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provide the context to the app
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<null | { name: string; email: string, image:string }>(null);

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
    redirect(`${GOOGLE_AUTH_URL}?${urlParams}`);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('http://localhost:8001/api/check-auth', { method: 'GET',credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        setUser(data.user); // Assuming the API returns user info
      } else {
        setIsAuthenticated(false);
        onGoogleLoginSuccess();
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to check authentication", error);
      setIsAuthenticated(false);
      setUser(null);
      onGoogleLoginSuccess();
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, setUser, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
