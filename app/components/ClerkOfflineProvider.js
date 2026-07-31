'use client';

import React, { useState, useEffect } from 'react';
import { ClerkProvider } from '@clerk/nextjs';

class ClerkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[TripWise Offline] Caught Clerk authentication script load error:', error);
  }

  render() {
    if (this.state.hasError) {
      // If Clerk script load fails offline, degrade gracefully to rendering children directly
      return this.props.children;
    }
    return this.props.children;
  }
}

export default function ClerkOfflineProvider({ children }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  return (
    <ClerkErrorBoundary>
      <ClerkProvider
        // Prevent Clerk from throwing unhandled errors if offline
        navigate={(to) => {
          if (typeof window !== 'undefined') window.location.href = to;
        }}
      >
        {children}
      </ClerkProvider>
    </ClerkErrorBoundary>
  );
}
