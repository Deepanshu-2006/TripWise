'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Navigation, RefreshCw } from 'lucide-react';
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
      <div className="py-32 flex flex-col items-center justify-center font-sans">
        <div className="w-4 h-4 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">Loading Directory...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center font-sans px-6">
        <h3 className="text-lg font-black text-stone-900 mb-2">Directory Unavailable</h3>
        <p className="text-sm text-stone-500">
          Unable to retrieve safety data for this destination. In an emergency, dial local emergency services directly.
        </p>
      </div>
    );
  }

  const { emergencyNumbers, embassy, hospitals } = data;
  const isLiveLocation = hospitals.locationSource === 'live';

  return (
    <div className="flex flex-col gap-10 font-sans pb-10">
      
      {/* HEADER / DISCLAIMER */}
      <div className="flex flex-col items-center text-center pt-2 pb-6 border-b border-stone-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-pulse" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-stone-500">
            Official Directory • {data.countryMatched}
          </span>
          {data.criticalForOffline && (
            <>
              <span className="text-stone-300">•</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                Offline Ready
              </span>
            </>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-stone-900 mb-2">
          Emergency Contacts
        </h2>
        <p className="text-sm text-stone-500 max-w-sm">
          In an emergency, dial local services directly. Data provided by official local authorities.
        </p>
      </div>

      {/* SECTION 1: LOCAL EMERGENCY NUMBERS */}
      <div>
        <div className="grid grid-cols-3 divide-x divide-stone-200 border-y border-stone-200">
          {[
            { label: 'Police', number: emergencyNumbers.police },
            { label: 'Fire', number: emergencyNumbers.fire },
            { label: 'Medical', number: emergencyNumbers.ambulance }
          ].map((service, i) => (
            <div key={i} className="py-6 px-2 flex flex-col items-center justify-center text-center group">
              <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-stone-400 mb-3">
                {service.label}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tighter mb-4">
                {service.number}
              </div>
              <a
                href={`tel:${service.number.split('/')[0].trim()}`}
                className="font-mono text-[10px] font-bold tracking-widest uppercase text-stone-900 group-hover:text-[#FF5B1D] transition-colors border-b border-stone-900 group-hover:border-[#FF5B1D] pb-0.5"
              >
                Dial Now ↗
              </a>
            </div>
          ))}
        </div>
        {emergencyNumbers.note && (
          <p className="text-center font-mono text-[10px] text-stone-400 mt-4 uppercase tracking-widest">
            Note: {emergencyNumbers.note}
          </p>
        )}
      </div>

      {/* SECTION 2: EMBASSY */}
      <div>
        <div className="flex items-end justify-between mb-4 px-1">
          <h3 className="font-serif text-lg font-black tracking-tight text-stone-900">
            Diplomatic Mission
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] text-stone-400 uppercase tracking-widest">Passport:</span>
            <span className="font-mono text-[10px] font-bold text-stone-900 uppercase">
              {passportNationality || 'Not Set'}
            </span>
            <Link href="/settings" className="font-mono text-[9px] text-[#FF5B1D] uppercase tracking-widest hover:underline ml-1">
              Change
            </Link>
          </div>
        </div>

        {!passportNationality ? (
          <div className="py-8 border-y border-stone-200 flex flex-col items-center text-center">
            <p className="text-sm text-stone-500 mb-4">Set your passport nationality to view your official diplomatic mission details.</p>
            <Link href="/settings" className="font-mono text-[10px] font-bold tracking-widest uppercase text-stone-900 border border-stone-200 px-6 py-2 hover:bg-stone-50 transition-colors">
              Set Nationality
            </Link>
          </div>
        ) : !embassy.coverage ? (
          <div className="py-6 border-y border-stone-200 px-4">
            <p className="text-sm text-stone-600 mb-4">{embassy.message}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${passportNationality} Embassy ${destinationName}`)}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#FF5B1D] hover:text-stone-900 transition-colors flex items-center gap-2">
              Search via Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="border-y border-stone-200 flex flex-col sm:flex-row">
            <div className="flex-1 py-5 pr-4 sm:border-r border-stone-200 sm:border-b-0 border-b">
              <h4 className="font-black text-base text-stone-900 mb-2">
                {embassy.data.name}
              </h4>
              <p className="text-sm text-stone-500 mb-4 max-w-sm">
                {embassy.data.address}
              </p>
              {embassy.data.phone && (
                <a href={`tel:${embassy.data.phone.split('/')[0].trim()}`} className="font-mono text-[11px] font-bold tracking-widest uppercase text-stone-900 hover:text-[#FF5B1D] transition-colors block">
                  Tel: {embassy.data.phone}
                </a>
              )}
            </div>
            <div className="flex sm:flex-col divide-x sm:divide-x-0 sm:divide-y divide-stone-200 min-w-[140px]">
              {embassy.data.website && (
                <a href={embassy.data.website} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 flex items-center justify-center gap-2 font-mono text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors">
                  Website ↗
                </a>
              )}
              {embassy.data.mapUrl && (
                <a href={embassy.data.mapUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-4 flex items-center justify-center gap-2 font-mono text-[10px] font-bold tracking-widest uppercase text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-colors">
                  Directions ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: HOSPITALS */}
      <div>
        <div className="flex items-end justify-between mb-4 px-1">
          <h3 className="font-serif text-lg font-black tracking-tight text-stone-900">
            Medical Facilities
          </h3>
          <button onClick={requestLiveLocation} disabled={geoLoading} className="font-mono text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition-colors text-stone-400 hover:text-stone-900 cursor-pointer">
            {geoLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Navigation className={`w-3 h-3 ${isLiveLocation ? 'text-emerald-500' : ''}`} />}
            {isLiveLocation ? 'Live GPS Active' : 'Use GPS'}
          </button>
        </div>

        {!isLiveLocation && (
          <p className="text-xs text-stone-400 mb-4 px-1">Showing facilities near {destinationName} center.</p>
        )}
        {geoError && (
          <p className="text-[10px] font-mono text-red-500 mb-4 px-1">{geoError}</p>
        )}

        <div className="border-t border-stone-200 divide-y divide-stone-200">
          {hospitals.items.map((hosp, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row py-5 gap-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <h4 className="font-black text-sm text-stone-900">
                    {hosp.name}
                  </h4>
                  {hosp.is24Hours && <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5">24/7 ER</span>}
                  {hosp.traumaCenter && <span className="font-mono text-[8px] font-bold uppercase tracking-widest text-[#FF5B1D] bg-[#FF5B1D]/10 px-1.5 py-0.5">Trauma</span>}
                </div>
                <p className="text-[13px] text-stone-500 mb-2">{hosp.address}</p>
                <div className="flex items-center gap-3 font-mono text-[10px] text-stone-400 uppercase tracking-widest">
                  <span>Proximity: {hosp.distanceStr}</span>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 min-w-[120px]">
                <a href={`tel:${hosp.phone.split('/')[0].trim()}`} className="flex-1 border border-stone-200 py-2.5 flex items-center justify-center font-mono text-[9px] font-bold uppercase tracking-widest text-stone-900 hover:border-stone-900 transition-colors">
                  Call
                </a>
                {hosp.mapUrl && (
                  <a href={hosp.mapUrl} target="_blank" rel="noopener noreferrer" className="flex-1 border border-stone-200 py-2.5 flex items-center justify-center font-mono text-[9px] font-bold uppercase tracking-widest text-stone-900 hover:border-stone-900 transition-colors">
                    Map
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
