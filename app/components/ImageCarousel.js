'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageCarousel({ query, initialImage, alt }) {
  const [images, setImages] = useState(initialImage ? [initialImage] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!query) return;
    
    // Fetch multiple images
    fetch(`/api/images?q=${encodeURIComponent(query)}&count=5`)
      .then(res => res.json())
      .then(data => {
        if (data && data.images && data.images.length > 0) {
          setImages(data.images);
        }
      })
      .catch(err => console.error("Failed to fetch carousel images", err));
  }, [query]);

  // Autoplay
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    
    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const goToNext = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover object-center absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, scale: isHovered ? 1.04 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.8, ease: 'easeInOut' },
            scale: { duration: 0.6, ease: 'easeOut' }
          }}
        />
      </AnimatePresence>

      {/* Navigation Controls (Visible on Hover) */}
      {images.length > 1 && (
        <>
          <button 
            onClick={goToPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:bg-black/60 hover:scale-110"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 hover:bg-black/60 hover:scale-110"
            aria-label="Next image"
          >
            <ChevronRight size={16} />
          </button>
          
          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 shadow-sm ${idx === currentIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
