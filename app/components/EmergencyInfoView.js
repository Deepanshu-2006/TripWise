'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink, Navigation, RefreshCw, PhoneCall, ShieldAlert, AlertTriangle, Stethoscope, MapPin } from 'lucide-react';
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
        <div className="w-5 h-5 border-[2px] border-[#F0EFEB] border-t-[#1E1C1A] rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#8B8682]">Gathering Data...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-20 text-center font-sans px-6">
        <h3 className="text-lg font-serif font-black text-[#1E1C1A] mb-2">Directory Unavailable</h3>
        <p className="text-sm text-[#8B8682]">
          Unable to retrieve safety data for this destination. In an emergency, dial local services directly.
        </p>
      </div>
    );
  }

  const { emergencyNumbers, embassy, hospitals } = data;
  const isLiveLocation = hospitals.locationSource === 'live';

  return (
    <div className="flex flex-col gap-10 font-sans pb-12 pt-2">
      
      {/* HEADER / DISCLAIMER */}
      <div className="flex flex-col text-left mb-2">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5B1D] animate-pulse" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#8B8682]">
            Official Directory • {data.countryMatched}
          </span>
          {data.criticalForOffline && (
            <>
              <span className="text-[#D1CECA]">•</span>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-600">
                Offline Ready
              </span>
            </>
          )}
        </div>
        <h2 className="text-3xl sm:text-4xl font-serif font-black tracking-tight text-[#1E1C1A] mb-3 leading-none">
          Emergency<br />Contacts
        </h2>
        <p className="text-sm text-[#8B8682] max-w-sm leading-relaxed">
          In a critical emergency, dial local services directly. Information is provided by official local authorities.
        </p>
      </div>

      {/* SECTION 1: LOCAL EMERGENCY NUMBERS */}
      <div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: 'Police', number: emergencyNumbers.police, icon: ShieldAlert },
            { label: 'Fire', number: emergencyNumbers.fire, icon: AlertTriangle },
            { label: 'Medical', number: emergencyNumbers.ambulance, icon: Stethoscope }
          ].map((service, i) => (
            <div key={i} className="bg-white border border-[#F0EFEB] rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between hover:border-[#FF5B1D]/40 transition-colors shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <span className="font-mono text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-[#8B8682]">
                  {service.label}
                </span>
                <service.icon className="w-3.5 h-3.5 text-[#D1CECA] hidden sm:block" strokeWidth={2} />
              </div>
              <div className="text-2xl sm:text-3xl font-serif font-black text-[#1E1C1A] tracking-tighter mb-4 sm:mb-5">
                {service.number}
              </div>
              <a
                href={`tel:${service.number.split('/')[0].trim()}`}
                className="w-full py-2.5 rounded-full bg-[#1E1C1A] text-white flex items-center justify-center gap-1.5 font-mono text-[9.5px] font-bold tracking-widest uppercase hover:bg-[#FF5B1D] active:scale-95 transition-all"
              >
                <PhoneCall className="w-3 h-3 hidden sm:block" /> Dial
              </a>
            </div>
          ))}
        </div>
        {emergencyNumbers.note && (
          <p className="text-center font-mono text-[9px] text-[#8B8682] mt-4 uppercase tracking-widest bg-[#F0EFEB]/50 py-1.5 rounded-full mx-auto inline-block px-4 border border-[#F0EFEB]">
            Note: {emergencyNumbers.note}
          </p>
        )}
      </div>

      {/* SECTION 2: EMBASSY */}
      <div>
        <div className="flex items-end justify-between mb-4 border-b border-[#F0EFEB] pb-3">
          <h3 className="font-serif text-lg font-black tracking-tight text-[#1E1C1A]">
            Diplomatic Mission
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] text-[#8B8682] uppercase tracking-widest">Passport:</span>
            <span className="font-mono text-[9.5px] font-bold text-[#1E1C1A] uppercase bg-white border border-[#F0EFEB] px-2 py-0.5 rounded-md shadow-sm">
              {passportNationality || 'Not Set'}
            </span>
            <Link href="/settings" className="font-mono text-[9px] text-[#FF5B1D] uppercase tracking-widest hover:underline ml-1">
              Edit
            </Link>
          </div>
        </div>

        {!passportNationality ? (
          <div className="py-8 bg-white border border-[#F0EFEB] rounded-2xl flex flex-col items-center text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] px-4">
            <p className="text-sm text-[#8B8682] mb-4 max-w-xs">Select your passport nationality to view your official diplomatic mission details.</p>
            <Link href="/settings" className="font-mono text-[10px] font-bold tracking-widest uppercase text-white bg-[#1E1C1A] rounded-full px-6 py-2.5 hover:bg-[#FF5B1D] transition-colors">
              Set Nationality
            </Link>
          </div>
        ) : !embassy.coverage ? (
          <div className="py-6 px-5 bg-white border border-[#F0EFEB] rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <p className="text-sm text-[#8B8682] mb-4">{embassy.message}</p>
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${passportNationality} Embassy ${destinationName}`)}`} target="_blank" rel="noopener noreferrer" className="font-mono text-[10px] font-bold tracking-widest uppercase text-[#1E1C1A] flex items-center gap-2 hover:text-[#FF5B1D] transition-colors">
              Search via Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          <div className="bg-white border border-[#F0EFEB] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex-1 sm:pr-5 sm:border-r border-[#F0EFEB] sm:mb-0 mb-4 pb-4 sm:pb-0 border-b sm:border-b-0">
              <h4 className="font-black text-[15px] text-[#1E1C1A] mb-2 leading-tight">
                {embassy.data.name}
              </h4>
              <p className="text-[13px] text-[#8B8682] mb-4 max-w-sm flex items-start gap-1.5 leading-relaxed">
                <MapPin className="w-3.5 h-3.5 text-[#D1CECA] shrink-0 mt-0.5" />
                <span>{embassy.data.address}</span>
              </p>
              {embassy.data.phone && (
                <a href={`tel:${embassy.data.phone.split('/')[0].trim()}`} className="inline-flex items-center gap-1.5 font-mono text-[10.5px] font-bold tracking-widest uppercase text-[#1E1C1A] hover:text-[#FF5B1D] transition-colors">
                  <PhoneCall className="w-3.5 h-3.5" /> Tel: {embassy.data.phone}
                </a>
              )}
            </div>
            <div className="flex sm:flex-col gap-2 min-w-[140px] sm:pl-5">
              {embassy.data.website && (
                <a href={embassy.data.website} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full border border-[#F0EFEB] py-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] font-bold tracking-widest uppercase text-[#1E1C1A] hover:border-[#1E1C1A] transition-colors">
                  Website <ExternalLink className="w-3 h-3 text-[#D1CECA]" />
                </a>
              )}
              {embassy.data.mapUrl && (
                <a href={embassy.data.mapUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full bg-[#1E1C1A] text-white py-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] font-bold tracking-widest uppercase hover:bg-[#FF5B1D] transition-colors">
                  Directions <Navigation className="w-3 h-3 text-white/70" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: HOSPITALS */}
      <div>
        <div className="flex items-end justify-between mb-4 border-b border-[#F0EFEB] pb-3">
          <h3 className="font-serif text-lg font-black tracking-tight text-[#1E1C1A]">
            Medical Facilities
          </h3>
          <button onClick={requestLiveLocation} disabled={geoLoading} className="font-mono text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 transition-colors text-[#8B8682] hover:text-[#1E1C1A] cursor-pointer bg-white border border-[#F0EFEB] px-2.5 py-1.5 rounded-full shadow-sm">
            {geoLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Navigation className={`w-3 h-3 ${isLiveLocation ? 'text-emerald-500 fill-emerald-500' : ''}`} />}
            {isLiveLocation ? 'Live GPS Active' : 'Use GPS'}
          </button>
        </div>

        {!isLiveLocation && (
          <p className="text-xs text-[#8B8682] mb-4">Showing facilities near {destinationName} center.</p>
        )}
        {geoError && (
          <p className="text-[10px] font-mono text-[#FF5B1D] mb-4 px-2 py-1.5 bg-[#FF5B1D]/10 rounded-lg inline-block border border-[#FF5B1D]/20">⚠️ {geoError}</p>
        )}

        <div className="flex flex-col gap-3 sm:gap-4">
          {hospitals.items.map((hosp, idx) => (
            <div key={idx} className="bg-white border border-[#F0EFEB] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#FF5B1D]/40 transition-colors group">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h4 className="font-black text-[15px] text-[#1E1C1A] leading-tight">
                    {hosp.name}
                  </h4>
                  {hosp.is24Hours && <span className="font-mono text-[8.5px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">24/7 ER</span>}
                  {hosp.traumaCenter && <span className="font-mono text-[8.5px] font-bold uppercase tracking-widest text-[#FF5B1D] bg-[#FF5B1D]/5 border border-[#FF5B1D]/10 px-2 py-0.5 rounded-md">Trauma Center</span>}
                </div>
                
                <p className="text-[13px] text-[#8B8682] mb-3 flex items-start gap-1.5 leading-relaxed">
                   <MapPin className="w-3.5 h-3.5 text-[#D1CECA] shrink-0 mt-0.5" />
                   <span>{hosp.address}</span>
                </p>

                <div className="flex items-center gap-3 font-mono text-[9px] font-bold text-[#D1CECA] uppercase tracking-widest">
                  <span className="flex items-center gap-1.5"><PhoneCall className="w-3 h-3" /> {hosp.phone}</span>
                  <span className="w-1 h-1 rounded-full bg-[#EBE8E0]" />
                  <span>{hosp.distanceStr}</span>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2 min-w-[130px] shrink-0">
                <a href={`tel:${hosp.phone.split('/')[0].trim()}`} className="flex-1 rounded-full border border-[#F0EFEB] bg-white py-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest text-[#1E1C1A] group-hover:border-[#1E1C1A] transition-colors">
                  <PhoneCall className="w-3 h-3 text-[#8B8682]" /> Call
                </a>
                {hosp.mapUrl && (
                  <a href={hosp.mapUrl} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full bg-[#1E1C1A] text-white py-2.5 flex items-center justify-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest hover:bg-[#FF5B1D] transition-colors">
                    <Navigation className="w-3 h-3 text-white/70" /> Map
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
