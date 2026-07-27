'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const CollaborationContext = createContext(null);

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  return context || null;
};

export default function CollaborationProvider({ 
  tripId, 
  initialItinerary, 
  currentUser, // e.g. { id, name, avatarUrl } from Clerk
  onRemoteUpdate,
  children 
}) {
  const [itinerary, setItinerary] = useState(initialItinerary || null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [channel, setChannel] = useState(null);
  const [lastConflict, setLastConflict] = useState(null);

  // Sync initial itinerary when it changes from props (e.g. initial load)
  useEffect(() => {
    if (initialItinerary) {
      setItinerary(initialItinerary);
    }
  }, [initialItinerary]);

  useEffect(() => {
    if (!tripId || !currentUser) return;

    // Generate a consistent color for the user based on their ID
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    const userColor = colors[Math.abs(hashString(currentUser.id || '')) % colors.length];

    const room = supabase.channel(`trip:${tripId}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    // 1. Presence Sync
    room.on('presence', { event: 'sync' }, () => {
      const state = room.presenceState();
      // state is an object where keys are the presence keys (user IDs)
      // and values are arrays of presence state objects (one per connection/tab)
      const users = Object.keys(state).map(key => {
        // Take the first connection's state for this user
        const userData = state[key][0];
        return {
          id: key,
          name: userData.name || 'Anonymous',
          avatarUrl: userData.avatarUrl,
          color: userData.color,
          isTyping: userData.isTyping || false,
        };
      });
      // Filter out ourselves from the visual indicator list if desired, 
      // but usually we want everyone or we filter in the UI.
      setActiveUsers(users);
    });

    // 2. Broadcast updates (last-write-wins)
    room.on('broadcast', { event: 'itinerary_update' }, (payload) => {
      const { newItinerary, senderId, senderName, timestamp } = payload.payload;
      
      // If we receive an update from someone else, apply it
      if (senderId !== currentUser.id) {
        setItinerary(newItinerary);
        if (onRemoteUpdate) onRemoteUpdate(newItinerary);
        
        // Show a conflict toast if we recently updated (could be enhanced)
        setLastConflict({
          message: `${senderName || 'A collaborator'} updated the itinerary.`,
          timestamp: Date.now()
        });
        
        // Hide conflict toast after 3s
        setTimeout(() => setLastConflict(null), 3000);
      }
    });

    // Subscribe and track presence
    room.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await room.track({
          name: currentUser.name || currentUser.firstName || 'Collaborator',
          avatarUrl: currentUser.imageUrl || currentUser.avatarUrl || null,
          color: userColor,
          onlineAt: new Date().toISOString(),
        });
      }
    });

    setChannel(room);

    return () => {
      room.unsubscribe();
      setChannel(null);
    };
  }, [tripId, currentUser]);

  // Method to push local changes to others
  const broadcastUpdate = useCallback((newItinerary) => {
    // 1. Update locally instantly
    setItinerary(newItinerary);

    // 2. Broadcast to other collaborators
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'itinerary_update',
        payload: {
          newItinerary,
          senderId: currentUser.id,
          senderName: currentUser.name || currentUser.firstName || 'Collaborator',
          timestamp: Date.now()
        },
      });
    }
  }, [channel, currentUser]);

  const updateTypingStatus = useCallback((isTyping) => {
    if (channel && currentUser) {
       channel.track({
          name: currentUser.name || currentUser.firstName || 'Collaborator',
          avatarUrl: currentUser.imageUrl || currentUser.avatarUrl || null,
          color: channel.presenceState()?.[currentUser.id]?.[0]?.color || '#3B82F6',
          isTyping,
       });
    }
  }, [channel, currentUser]);

  return (
    <CollaborationContext.Provider value={{
      itinerary,
      setItinerary: broadcastUpdate, // intercept setItinerary to broadcast it
      activeUsers,
      lastConflict,
      updateTypingStatus
    }}>
      {children}
    </CollaborationContext.Provider>
  );
}

// Simple hash function for consistent color assignment
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}
