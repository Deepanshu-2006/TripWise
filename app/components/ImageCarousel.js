'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ImageCarousel({ query, initialImage, alt, images: propImages }) {
  const [images, setImages] = useState(propImages || (initialImage ? [initialImage] : []));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
    if (propImages && propImages.length > 0) {
      setImages(propImages);
      return;
    }
    if (initialImage) {
      setImages([initialImage]);
    }
    if (!query) return;
    
    // Fetch multiple images in background
    fetch(`/api/images?q=${encodeURIComponent(query)}&count=5`)
      .then(res => res.json())
      .then(data => {
        if (data && data.images && data.images.length > 0) {
          setImages(data.images);
        }
      })
      .catch(err => console.error("Failed to fetch carousel images", err));
  }, [query, propImages, initialImage]);

  // Autoplay
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4500);
    
    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  const goToNext = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrev = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  const variants = {
    enter: (direction) => {
      return {
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.95
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => {
      return {
        zIndex: 0,
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.95
      };
    }
  };

  return (
    <div 
      className="w-full h-full relative overflow-hidden group bg-gray-100"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          alt={`${alt} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover object-center absolute inset-0 cursor-grab active:cursor-grabbing"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
            scale: { duration: 0.4 }
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);
            if (swipe < -swipeConfidenceThreshold) {
              goToNext();
            } else if (swipe > swipeConfidenceThreshold) {
              goToPrev();
            }
          }}
          whileHover={{ scale: images.length > 1 ? 1 : 1.05, transition: { duration: 0.6 } }}
        />
      </AnimatePresence>

      {/* Navigation Controls */}
      {images.length > 1 && (
        <>
          <button 
            type="button"
            onClick={goToPrev}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white border border-white/25 flex items-center justify-center backdrop-blur-md transition-all duration-200 z-20 hover:scale-110 active:scale-95 shadow-md cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          
          <button 
            type="button"
            onClick={goToNext}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white border border-white/25 flex items-center justify-center backdrop-blur-md transition-all duration-200 z-20 hover:scale-110 active:scale-95 shadow-md cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
          
          {/* Progress Dots Pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-xs pointer-events-none">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-3.5 bg-white shadow-xs' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

