'use client';
import React from 'react';
import Image from 'next/image';

const CollaboratorStack = ({ collaborators = [], activeUsers = [], maxDisplay = 3, size = 'md' }) => {
  const displayCollaborators = collaborators.slice(0, maxDisplay);
  const remainingCount = Math.max(0, collaborators.length - maxDisplay);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="flex items-center -space-x-2">
      {displayCollaborators.map((collab, index) => {
        const isActive = activeUsers.includes(collab.userId);
        return (
          <div 
            key={collab.userId || index} 
            className={`relative rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold overflow-hidden ${sizeClasses[size]} shadow-sm`}
            style={{ zIndex: maxDisplay - index }}
            title={collab.name || collab.email}
          >
            {collab.photoURL ? (
              <Image src={collab.photoURL} alt={collab.name || 'User'} fill className="object-cover" />
            ) : (
              <span>{getInitials(collab.name || collab.email)}</span>
            )}
            {isActive && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border border-white rounded-full"></div>
            )}
          </div>
        );
      })}
      
      {remainingCount > 0 && (
        <div 
          className={`relative rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-gray-600 font-medium ${sizeClasses[size]} shadow-sm`}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default CollaboratorStack;
