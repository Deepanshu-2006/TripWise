'use client';

import React, { useState, useEffect } from 'react';
import { getDistance } from '../actions/distance';
import { getTransportBetweenStops } from './itineraryHelpers';

import { motion } from 'framer-motion';

export default function LiveTransitLine({ prevStop, nextStop, idx }) {
  // Get initial static estimate (Haversine straight-line distance)
  const initialTransport = getTransportBetweenStops(prevStop, nextStop, idx);
  
  const [transitIcon, setTransitIcon] = useState(initialTransport?.icon || '🚶');
  const [transitText, setTransitText] = useState(initialTransport?.text || '');
  const [mode, setMode] = useState(initialTransport?.mode || 'walk');

  useEffect(() => {
    if (!prevStop?.coordinates || !nextStop?.coordinates) return;

    let isMounted = true;

    const fetchTrueDistance = async () => {
      try {
        const origins = `${prevStop.coordinates.lat},${prevStop.coordinates.lng}`;
        const destinations = `${nextStop.coordinates.lat},${nextStop.coordinates.lng}`;
        
        // Pass the mode determined by the static helper (walk, taxi, metro)
        const data = await getDistance(origins, destinations, mode);
        
        if (data.error) return;
        
        if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
          if (!isMounted) return;
          
          const element = data.rows[0].elements[0];
          
          // OSRM returns distance text like "0.5 km" or "1.2 km"
          // Let's convert it to meters if it's less than 1km for walking
          let distText = element.distance.text;
          if (mode === 'walk') {
             const kmVal = parseFloat(distText.replace(' km', ''));
             if (kmVal < 1.0 && kmVal > 0) {
               distText = `${Math.round(kmVal * 1000)}m`;
             }
          }

          const durMins = Math.round(element.duration.value / 60);
          
          const minLabel = durMins === 1 ? 'min' : 'mins';
          let finalModeStr = mode;
          let finalIcon = transitIcon;

          if (mode === 'taxi' || mode === 'driving') {
             finalModeStr = 'Taxi';
             finalIcon = '🚕';
          } else if (mode === 'metro' || mode === 'transit') {
             finalModeStr = 'Metro';
             finalIcon = '🚇';
          } else {
             finalModeStr = 'walk';
             finalIcon = '🚶';
          }

          let newText = '';
          if (finalModeStr === 'walk') {
            newText = `${durMins} ${minLabel} walk • ${distText}`;
          } else {
            newText = `${finalModeStr} • ${durMins} ${minLabel} (${distText})`;
          }

          setTransitIcon(finalIcon);
          setTransitText(newText);
        }
      } catch (e) {
        console.error("OSRM Routing API error", e);
      }
    };

    // Add a slight delay to avoid blasting the OSRM API immediately on render
    const timer = setTimeout(fetchTrueDistance, 300 + (idx * 150));
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [prevStop, nextStop, mode, idx, transitIcon]);

  if (!initialTransport) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ margin: "-20px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="py-6 mb-6 sm:mb-8 flex items-center justify-center gap-4 text-[#7A7268] relative z-10"
    >
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ margin: "-20px" }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
        className="h-px w-12 sm:w-24 bg-[#E6DFD5] origin-right" 
      />
      
      <span className="font-serif italic text-xs sm:text-sm tracking-wide px-3 bg-[#FAF6F0] text-center whitespace-nowrap relative inline-block group">
        {transitIcon} {transitText} between stops
        
        {/* Animated underline on scroll */}
        <motion.div 
            className="absolute -bottom-1 left-3 right-3 h-[2px] bg-gradient-to-r from-transparent via-[#FF6B2C]/40 to-transparent rounded-full origin-left"
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ margin: "-20px" }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        />
      </span>

      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ margin: "-20px" }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeInOut" }}
        className="h-px w-12 sm:w-24 bg-[#E6DFD5] origin-left" 
      />
    </motion.div>
  );
}
