'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { getDistanceAndProximity } from './itineraryHelpers';
import { getDistance } from '../actions/distance';

export default function LiveProximityBanner({ anchorCoords, actCoords, anchorName, isBasecampConfirmed, actLocation, cleanName, cleanDest }) {
  const fallback = getDistanceAndProximity(anchorCoords, actCoords, anchorName);
  const [distance, setDistance] = useState(fallback.distKm);
  const [mins, setMins] = useState(fallback.mins || 15);
  const [type, setType] = useState(fallback.type || 'transit');
  const [label, setLabel] = useState(fallback.label);

  useEffect(() => {
    if (!anchorCoords?.lat || !actCoords?.lat) return;

    const fetchDistance = async () => {
      try {
        const origins = `${anchorCoords.lat},${anchorCoords.lng}`;
        const destinations = `${actCoords.lat},${actCoords.lng}`;
        
        const data = await getDistance(origins, destinations, fallback.type);
        if (data.error) return;
        
        if (data.status === 'OK' && data.rows[0]?.elements[0]?.status === 'OK') {
          const element = data.rows[0].elements[0];
          const distText = element.distance.text.replace(' km', '');
          const durMins = Math.round(element.duration.value / 60);
          
          let resolvedType = fallback.type;
          if (data._fallbackMode) {
            resolvedType = data._fallbackMode === 'driving' ? 'taxi' : fallback.type;
          }

          setDistance(distText);
          setMins(durMins);
          setLabel(`${durMins} min ${resolvedType} from ${anchorName}`);
          setType(resolvedType);
        }
      } catch (e) {
        console.error("Distance API error", e);
      }
    };

    fetchDistance();
  }, [anchorCoords, actCoords, anchorName, fallback.type]);

  const actNameStr = (typeof actLocation === 'object' ? actLocation?.name : actLocation) || `${cleanName}, ${cleanDest}`;

  return (
    <motion.div
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="hidden lg:flex items-start gap-4 p-4 rounded-3xl border border-[#E6DFD5]/60 bg-gradient-to-br from-white/95 to-[#FAF6F0]/90 backdrop-blur-md shadow-[0_8px_24px_rgba(30,28,26,0.04)] hover:shadow-[0_12px_32px_rgba(30,28,26,0.08)] transition-shadow relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-white/40 pointer-events-none z-0"></div>
      <div className="relative z-10 w-10 h-10 rounded-2xl bg-gradient-to-b from-[#FFF5F0] to-[#FFE8DE] border border-[#FFD5C2]/50 flex items-center justify-center text-[#FF6B2C] shrink-0 shadow-inner">
        <MapPin className="w-4 h-4 stroke-[2.2]" />
      </div>
      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between gap-3 mb-2">
          <strong className="font-serif font-bold text-[#1E1C1A] text-[15px] tracking-tight">Getting There &amp; Proximity</strong>
          <span className={`text-[10px] font-sans font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors ${
            isBasecampConfirmed 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' 
              : 'bg-stone-50 text-[#7A7268] border border-stone-200'
          }`}>
            <span className="text-[12px] leading-none">📍</span> 
            <span className="mt-[1px]">{label}</span>
          </span>
        </div>
        <p className="font-sans text-[13px] text-[#5F5E5A] leading-relaxed">
          <span className="font-semibold text-[#1E1C1A]">{actNameStr}</span> — exactly {distance} km from {isBasecampConfirmed ? `your basecamp stay at ${anchorName}` : `the center of ${cleanDest}`} (approx. {mins} mins via {type === 'driving' ? 'taxi' : type}).
        </p>
      </div>
    </motion.div>
  );
}
