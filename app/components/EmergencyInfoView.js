'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  PhoneCall,
  Building2,
  Stethoscope,
  MapPin,
  ExternalLink,
  Navigation,
  AlertTriangle,
  Book,
  CheckCircle2,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { fetchEmergencyInfo } from '../../lib/emergencyApi';

export default function EmergencyInfoView({ destinationName, passportNationality, onOpenSettings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Geolocation state
  const [userCoords, setUserCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Initial fetch
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchEmergencyInfo(passportNationality, destinationName, userCoords)
      .then(res => {
        if (isMounted) {
          setData(res);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error("Emergency info fetch error:", err);
          setError("Failed to load emergency information.");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [destinationName, passportNationality, userCoords]);

  const requestLiveLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setGeoLoading(false);
      },
      (err) => {
        console.warn("Geolocation permission error:", err);
        setGeoError("Location permission denied. Showing city center results.");
        setGeoLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center font-sans">
        <div className="w-8 h-8 border-3 border-[#E6DFD5] border-t-[#FF6B2C] rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#7A7268]">Gathering critical safety data…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-[#E6DFD5] rounded-3xl p-10 text-center flex flex-col items-center gap-4 font-sans">
        <div className="w-14 h-14 rounded-full bg-[#FAF6F0] flex items-center justify-center text-[#FF6B2C]">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-xl font-serif font-bold text-[#1E1C1A]">Information Unavailable</h3>
          <p className="text-sm text-[#7A7268] mt-1 max-w-md mx-auto">
            Unable to retrieve safety data for this destination. In an emergency, dial local emergency services directly.
          </p>
        </div>
      </div>
    );
  }

  const { emergencyNumbers, embassy, hospitals } = data;
  const isLiveLocation = hospitals.locationSource === 'live';

  return (
    <div className="flex flex-col gap-4 sm:gap-6 font-sans">
      
      {/* PERSISTENT EMERGENCY SAFETY DISCLAIMER BANNER */}
      <div className="bg-[#FFF5F2] border border-[#FF6B2C]/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs flex items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <ShieldAlert className="w-4.5 h-4.5 sm:w-5 sm:h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[9.5px] sm:text-[10px] font-extrabold uppercase tracking-widest text-[#FF6B2C] bg-[#FF6B2C]/10 px-2 py-0.5 rounded-md">
                Critical Safety Notice
              </span>
              {data.criticalForOffline && (
                <span className="font-mono text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <WifiOff className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Offline Ready
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-[#1E1C1A] mt-1 leading-snug">
              In an emergency, dial local emergency numbers directly.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: LOCAL EMERGENCY NUMBERS (Compact 3-dialer mobile grid) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E6DFD5] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-[#E6DFD5] pb-3 mb-3.5 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C] shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-widest text-[#7A7268] font-bold block">
                Immediate Response
              </span>
              <h3 className="text-base sm:text-lg font-serif font-black text-[#1E1C1A] leading-tight">
                Emergency Numbers · {data.countryMatched}
              </h3>
            </div>
          </div>
          {emergencyNumbers.note && (
            <span className="text-[11px] sm:text-xs font-serif italic text-[#7A7268] self-start sm:self-center">
              💡 {emergencyNumbers.note}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          
          {/* POLICE CARD */}
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between items-center sm:items-stretch text-center sm:text-left transition-all hover:border-[#FF6B2C]/50 shadow-2xs">
            <div className="w-full">
              <div className="flex items-center justify-center sm:justify-between text-[9px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#7A7268] mb-1 sm:mb-1.5">
                <span className="truncate">Police</span>
                <span className="text-xs sm:text-sm hidden sm:inline">👮‍♂️</span>
              </div>
              <div className="text-lg sm:text-2xl lg:text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                {emergencyNumbers.police}
              </div>
            </div>
            <a
              href={`tel:${emergencyNumbers.police.split('/')[0].trim()}`}
              className="mt-2 sm:mt-3.5 w-full py-1.5 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] active:scale-95 text-[11px] sm:text-xs font-bold font-sans flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs"
            >
              <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Call</span>
            </a>
          </div>

          {/* FIRE CARD */}
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between items-center sm:items-stretch text-center sm:text-left transition-all hover:border-[#FF6B2C]/50 shadow-2xs">
            <div className="w-full">
              <div className="flex items-center justify-center sm:justify-between text-[9px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#7A7268] mb-1 sm:mb-1.5">
                <span className="truncate">Fire</span>
                <span className="text-xs sm:text-sm hidden sm:inline">🚒</span>
              </div>
              <div className="text-lg sm:text-2xl lg:text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                {emergencyNumbers.fire}
              </div>
            </div>
            <a
              href={`tel:${emergencyNumbers.fire.split('/')[0].trim()}`}
              className="mt-2 sm:mt-3.5 w-full py-1.5 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] active:scale-95 text-[11px] sm:text-xs font-bold font-sans flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs"
            >
              <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Call</span>
            </a>
          </div>

          {/* AMBULANCE CARD */}
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between items-center sm:items-stretch text-center sm:text-left transition-all hover:border-[#FF6B2C]/50 shadow-2xs">
            <div className="w-full">
              <div className="flex items-center justify-center sm:justify-between text-[9px] sm:text-xs font-mono font-bold uppercase tracking-wider text-[#7A7268] mb-1 sm:mb-1.5">
                <span className="truncate">Medic</span>
                <span className="text-xs sm:text-sm hidden sm:inline">🚑</span>
              </div>
              <div className="text-lg sm:text-2xl lg:text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                {emergencyNumbers.ambulance}
              </div>
            </div>
            <a
              href={`tel:${emergencyNumbers.ambulance.split('/')[0].trim()}`}
              className="mt-2 sm:mt-3.5 w-full py-1.5 sm:py-2.5 px-1 sm:px-3 rounded-lg sm:rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] active:scale-95 text-[11px] sm:text-xs font-bold font-sans flex items-center justify-center gap-1 sm:gap-1.5 transition-all shadow-2xs"
            >
              <PhoneCall className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Call</span>
            </a>
          </div>

        </div>
      </div>

      {/* SECTION 2: NEAREST EMBASSY / CONSULATE */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E6DFD5] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6DFD5] pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C] shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-widest text-[#7A7268] font-bold block">
                Diplomatic Representation
              </span>
              <h3 className="text-base sm:text-lg font-serif font-black text-[#1E1C1A] leading-tight">
                Nearest Embassy / Consulate
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] sm:text-xs font-mono text-[#7A7268] font-bold">Passport:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] sm:text-xs font-bold uppercase">
              {passportNationality || 'Not Set'}
            </span>
            <Link
              href="/settings"
              className="text-[11px] sm:text-xs text-[#FF6B2C] hover:underline font-bold ml-0.5"
            >
              Change
            </Link>
          </div>
        </div>

        {!passportNationality ? (
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-xl sm:rounded-2xl p-5 text-center flex flex-col items-center gap-2.5">
            <Book className="w-7 h-7 text-[#FF6B2C]" />
            <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E1C1A]">Passport Nationality Missing</h4>
            <p className="text-xs text-[#7A7268] max-w-md">
              Please select your passport nationality in Settings to view your official diplomatic mission details in {destinationName}.
            </p>
            <Link
              href="/settings"
              className="mt-1 px-4 py-2 rounded-xl bg-[#1E1C1A] text-white text-xs font-bold hover:bg-[#FF6B2C] transition-colors"
            >
              Set Passport Nationality →
            </Link>
          </div>
        ) : !embassy.coverage ? (
          <div className="bg-[#FFF9F5] border-l-4 border-[#FF6B2C] rounded-r-xl sm:rounded-r-2xl p-4 sm:p-5 text-left">
            <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E1C1A] mb-1">
              Embassy Lookup Notice
            </h4>
            <p className="text-xs text-[#7A7268] leading-relaxed mb-3">
              {embassy.message}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${passportNationality} Embassy ${destinationName}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E1C1A] text-white text-xs font-bold hover:bg-[#FF6B2C] transition-colors"
            >
              <span>Search {passportNationality} Mission via Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-xl sm:rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <h4 className="font-serif font-black text-base sm:text-lg text-[#1E1C1A] leading-snug">
                {embassy.data.name}
              </h4>
              <p className="text-xs font-sans text-[#5F5E5A] flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0 mt-0.5" />
                <span className="leading-relaxed">{embassy.data.address}</span>
              </p>
              {embassy.data.phone && (
                <p className="text-xs font-sans text-[#5F5E5A] flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                  <a href={`tel:${embassy.data.phone.split('/')[0].trim()}`} className="font-bold text-[#1E1C1A] hover:text-[#FF6B2C] underline decoration-[#1E1C1A]/30">
                    {embassy.data.phone}
                  </a>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
              {embassy.data.website && (
                <a
                  href={embassy.data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#FAF6F0] text-xs font-bold text-[#1E1C1A] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {embassy.data.mapUrl && (
                <a
                  href={embassy.data.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Directions</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: NEAREST HOSPITALS & ER */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#E6DFD5] p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-[#E6DFD5] pb-3 mb-3.5 sm:mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C] shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9.5px] sm:text-[10px] font-mono uppercase tracking-widest text-[#7A7268] font-bold block">
                Medical &amp; Healthcare Facilities
              </span>
              <h3 className="text-base sm:text-lg font-serif font-black text-[#1E1C1A] leading-tight">
                Nearest Hospitals &amp; ER
              </h3>
            </div>
          </div>

          <button
            onClick={requestLiveLocation}
            disabled={geoLoading}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border text-[11px] sm:text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs self-start sm:self-auto ${
              isLiveLocation
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-[#FAF6F0] border-[#E6DFD5] hover:bg-white text-[#1E1C1A]'
            }`}
          >
            {geoLoading ? (
              <RefreshCw className="w-3 h-3 animate-spin text-[#FF6B2C]" />
            ) : (
              <Navigation className={`w-3 h-3 ${isLiveLocation ? 'text-emerald-600' : 'text-[#FF6B2C]'}`} />
            )}
            <span>{isLiveLocation ? 'Using Live GPS' : 'Use My Live Location'}</span>
          </button>
        </div>

        {/* LOCATION PERMISSION NOTICE / CITY CENTER FALLBACK NOTE */}
        {!isLiveLocation && (
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 mb-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] sm:text-xs text-[#7A7268]">
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <p>
                Showing facilities near <strong>{destinationName} Center</strong>.
              </p>
            </div>
            <button
              onClick={requestLiveLocation}
              className="text-[#FF6B2C] hover:underline font-bold shrink-0 text-left cursor-pointer"
            >
              Enable GPS Location →
            </button>
          </div>
        )}

        {geoError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 mb-3 text-xs font-semibold">
            ⚠️ {geoError}
          </div>
        )}

        {/* HOSPITALS LIST */}
        <div className="flex flex-col gap-2.5 sm:gap-3.5">
          {hospitals.items.map((hosp, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4.5 rounded-xl sm:rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:border-[#FF6B2C]/50 transition-colors shadow-2xs"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#1E1C1A]">
                    {hosp.name}
                  </h4>
                  {hosp.is24Hours && (
                    <span className="px-2 py-px rounded-full bg-emerald-100 text-emerald-800 text-[9.5px] sm:text-[10px] font-bold font-mono uppercase">
                      24/7 ER
                    </span>
                  )}
                  {hosp.traumaCenter && (
                    <span className="px-2 py-px rounded-full bg-[#FF6B2C]/15 text-[#FF6B2C] text-[9.5px] sm:text-[10px] font-bold font-mono uppercase">
                      Trauma Center
                    </span>
                  )}
                </div>

                <p className="text-[11px] sm:text-xs font-sans text-[#5F5E5A] flex items-start gap-1.5">
                  <MapPin className="w-3 h-3 text-[#FF6B2C] shrink-0 mt-0.5" />
                  <span className="leading-snug">{hosp.address}</span>
                </p>

                <div className="flex items-center gap-3 text-[10.5px] sm:text-xs text-[#7A7268] pt-0.5">
                  <span>Phone: <strong className="text-[#1E1C1A]">{hosp.phone}</strong></span>
                  <span>•</span>
                  <span>Proximity: <strong className="text-[#1E1C1A]">{hosp.distanceStr}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center shrink-0">
                <a
                  href={`tel:${hosp.phone.split('/')[0].trim()}`}
                  className="px-3 py-2 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#FAF6F0] text-xs font-bold text-[#1E1C1A] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <PhoneCall className="w-3 h-3 text-[#FF6B2C]" />
                  <span>Call Hospital</span>
                </a>

                {hosp.mapUrl && (
                  <a
                    href={hosp.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Map Link</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
