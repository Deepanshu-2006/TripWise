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
    <div className="flex flex-col gap-8 font-sans">
      
      {/* PERSISTENT EMERGENCY SAFETY DISCLAIMER BANNER */}
      <div className="bg-[#FFF5F2] border-2 border-[#FF6B2C]/30 rounded-3xl p-5 md:p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6B2C] text-white flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#FF6B2C] bg-[#FF6B2C]/10 px-2 py-0.5 rounded-md">
                Critical Safety Notice
              </span>
              {data.criticalForOffline && (
                <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline Priority Data
                </span>
              )}
            </div>
            <p className="text-xs md:text-sm font-semibold text-[#1E1C1A] mt-1 leading-snug">
              This information is provided for convenience. In an emergency, always contact local emergency services directly.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: LOCAL EMERGENCY NUMBERS (Large dialer cards with mobile call action) */}
      <div className="bg-white rounded-3xl border border-[#E6DFD5] p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6DFD5] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C]">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A7268] font-bold block">
                Immediate Response
              </span>
              <h3 className="text-xl font-serif font-black text-[#1E1C1A]">
                Local Emergency Numbers ({data.countryMatched})
              </h3>
            </div>
          </div>
          {emergencyNumbers.note && (
            <span className="text-xs font-serif italic text-[#7A7268] self-start sm:self-center">
              💡 {emergencyNumbers.note}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          {/* POLICE CARD */}
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF6B2C]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#7A7268] mb-2">
                <span>Police</span>
                <span className="text-base">👮‍♂️</span>
              </div>
              <div className="text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                {emergencyNumbers.police}
              </div>
            </div>
            <a
              href={`tel:${emergencyNumbers.police.split('/')[0].trim()}`}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-bold font-sans flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Police</span>
            </a>
          </div>

          {/* FIRE CARD */}
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF6B2C]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#7A7268] mb-2">
                <span>Fire Department</span>
                <span className="text-base">🚒</span>
              </div>
              <div className="text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                {emergencyNumbers.fire}
              </div>
            </div>
            <a
              href={`tel:${emergencyNumbers.fire.split('/')[0].trim()}`}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-bold font-sans flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Fire</span>
            </a>
          </div>

          {/* AMBULANCE CARD */}
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-2xl p-5 flex flex-col justify-between hover:border-[#FF6B2C]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[#7A7268] mb-2">
                <span>Ambulance / Medical</span>
                <span className="text-base">🚑</span>
              </div>
              <div className="text-3xl font-serif font-black text-[#1E1C1A] tracking-tight">
                {emergencyNumbers.ambulance}
              </div>
            </div>
            <a
              href={`tel:${emergencyNumbers.ambulance.split('/')[0].trim()}`}
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-bold font-sans flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call Ambulance</span>
            </a>
          </div>

        </div>
      </div>

      {/* SECTION 2: NEAREST EMBASSY / CONSULATE (Filtered by user passport nationality) */}
      <div className="bg-white rounded-3xl border border-[#E6DFD5] p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DFD5] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A7268] font-bold block">
                Diplomatic Representation
              </span>
              <h3 className="text-xl font-serif font-black text-[#1E1C1A]">
                Nearest Embassy / Consulate
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono text-[#7A7268] font-bold">Passport:</span>
            <span className="px-3 py-1 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] text-xs font-bold text-[#1E1C1A] uppercase">
              {passportNationality || 'Not Set'}
            </span>
            <Link
              href="/settings"
              className="text-xs text-[#FF6B2C] hover:underline font-bold ml-1"
            >
              Change
            </Link>
          </div>
        </div>

        {!passportNationality ? (
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-2xl p-6 text-center flex flex-col items-center gap-3">
            <Book className="w-8 h-8 text-[#FF6B2C]" />
            <h4 className="font-serif font-bold text-base text-[#1E1C1A]">Passport Nationality Missing</h4>
            <p className="text-xs text-[#7A7268] max-w-md">
              Please select your passport nationality in settings to view your official diplomatic mission details in {destinationName}.
            </p>
            <Link
              href="/settings"
              className="mt-2 px-5 py-2 rounded-xl bg-[#1E1C1A] text-white text-xs font-bold hover:bg-[#FF6B2C] transition-colors"
            >
              Set Passport Nationality →
            </Link>
          </div>
        ) : !embassy.coverage ? (
          <div className="bg-[#FFF9F5] border-l-4 border-[#FF6B2C] rounded-r-2xl p-6 text-left">
            <h4 className="font-serif font-bold text-base text-[#1E1C1A] mb-1">
              Embassy Lookup Notice
            </h4>
            <p className="text-xs text-[#7A7268] leading-relaxed mb-4">
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
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h4 className="font-serif font-black text-xl text-[#1E1C1A]">
                {embassy.data.name}
              </h4>
              <p className="text-xs font-sans text-[#5F5E5A] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                <span>{embassy.data.address}</span>
              </p>
              <p className="text-xs font-sans text-[#5F5E5A] flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                <span>{embassy.data.phone}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {embassy.data.website && (
                <a
                  href={embassy.data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#FAF6F0] text-xs font-bold text-[#1E1C1A] flex items-center justify-center gap-2 transition-all shadow-2xs"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {embassy.data.mapUrl && (
                <a
                  href={embassy.data.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: NEAREST HOSPITAL (Live GPS or Destination Center Fallback) */}
      <div className="bg-white rounded-3xl border border-[#E6DFD5] p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DFD5] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center text-[#FF6B2C]">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#7A7268] font-bold block">
                Medical &amp; Healthcare Facilities
              </span>
              <h3 className="text-xl font-serif font-black text-[#1E1C1A]">
                Nearest Hospitals &amp; ER
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={requestLiveLocation}
              disabled={geoLoading}
              className={`px-4 py-2 rounded-xl border text-xs font-bold font-sans flex items-center gap-2 transition-all cursor-pointer shadow-2xs ${
                isLiveLocation
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-[#FAF6F0] border-[#E6DFD5] hover:bg-white text-[#1E1C1A]'
              }`}
            >
              {geoLoading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF6B2C]" />
              ) : (
                <Navigation className={`w-3.5 h-3.5 ${isLiveLocation ? 'text-emerald-600' : 'text-[#FF6B2C]'}`} />
              )}
              <span>{isLiveLocation ? 'Using Live GPS' : 'Use My Live Location'}</span>
            </button>
          </div>
        </div>

        {/* LOCATION PERMISSION NOTICE / CITY CENTER FALLBACK NOTE */}
        {!isLiveLocation && (
          <div className="bg-[#FAF6F0] border border-[#E6DFD5] rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#7A7268]">
            <div className="flex items-center gap-2">
              <span className="text-base">📍</span>
              <p>
                Showing emergency facilities relative to <strong>{destinationName} City Center</strong>.{' '}
                <strong className="text-[#1E1C1A]">Enable location for results closer to you.</strong>
              </p>
            </div>
            <button
              onClick={requestLiveLocation}
              className="text-[#FF6B2C] hover:underline font-bold shrink-0 text-xs text-left"
            >
              Enable GPS Location →
            </button>
          </div>
        )}

        {geoError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 mb-4 text-xs font-semibold">
            ⚠️ {geoError}
          </div>
        )}

        {/* HOSPITALS LIST */}
        <div className="flex flex-col gap-4">
          {hospitals.items.map((hosp, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-[#E6DFD5] bg-[#FAF6F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#FF6B2C]/50 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-serif font-bold text-base text-[#1E1C1A]">
                    {hosp.name}
                  </h4>
                  {hosp.is24Hours && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono uppercase">
                      24/7 ER
                    </span>
                  )}
                  {hosp.traumaCenter && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FF6B2C]/15 text-[#FF6B2C] text-[10px] font-bold font-mono uppercase">
                      Trauma Center
                    </span>
                  )}
                </div>

                <p className="text-xs font-sans text-[#5F5E5A] flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                  <span>{hosp.address}</span>
                </p>

                <div className="flex items-center gap-4 text-xs text-[#7A7268]">
                  <span>Phone: <strong className="text-[#1E1C1A]">{hosp.phone}</strong></span>
                  <span>•</span>
                  <span>Proximity: <strong className="text-[#1E1C1A]">{hosp.distanceStr}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <a
                  href={`tel:${hosp.phone.split('/')[0].trim()}`}
                  className="px-4 py-2 rounded-xl border border-[#E6DFD5] bg-white hover:bg-[#FAF6F0] text-xs font-bold text-[#1E1C1A] flex items-center gap-1.5 transition-all shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[#FF6B2C]" />
                  <span>Call Hospital</span>
                </a>

                {hosp.mapUrl && (
                  <a
                    href={hosp.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#1E1C1A] text-white hover:bg-[#FF6B2C] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <Navigation className="w-3.5 h-3.5" />
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
