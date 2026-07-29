'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Bell, Plane, Hotel, AlertCircle, TrendingDown, Clock, MapPin, Loader2, ArrowRight, CheckCircle2, Star, SlidersHorizontal, ExternalLink, Info, Sparkles } from 'lucide-react';
import { activateTracking, getTrackingState, clearUnreadDrops, searchFlights, searchHotels, saveTrackingSelection, saveTrackingState } from '../../lib/priceTrackingApi';
import { getBookingLinkInfo } from '../../lib/bookingPartners';

export default function PriceTracker({ tripId, destinationName, startDate, endDate, hotelMode: propHotelMode, basecampHotel: propBasecampHotel, onReoptimize, onToast }) {
  const [trackingState, setTrackingState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [config, setConfig] = useState({ trackFlights: true, trackHotels: true, origin: 'JFK' });
  const [error, setError] = useState(null);

  // Search Results & Selection State
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [redirectingType, setRedirectingType] = useState(null); // 'flight' | 'hotel' | null
  const [isReoptimizing, setIsReoptimizing] = useState(false);

  // Sorting & Filtering State
  const [flightSort, setFlightSort] = useState('price'); // price, duration, departure
  const [flightStops, setFlightStops] = useState('any'); // any, nonstop, 1stop
  const [hotelSort, setHotelSort] = useState('price'); // price, rating, distance
  const [hotelRating, setHotelRating] = useState('any'); // any, 3, 4, 5

  useEffect(() => {
    const state = getTrackingState(tripId);
    if (state) {
      setTrackingState(state);
      if (state.unreadDrops) {
        clearUnreadDrops(tripId);
      }
    }
    setIsLoading(false);
  }, [tripId]);

  useEffect(() => {
    if (trackingState) {
      const fetchResults = async () => {
        setIsLoadingResults(true);
        if (trackingState.config.trackFlights && !trackingState.selectedFlight && flights.length === 0) {
          const res = await searchFlights(destinationName, trackingState.config.origin, { startDate, endDate });
          setFlights(res);
        }
        if (trackingState.config.trackHotels && !trackingState.selectedHotel && hotels.length === 0) {
          const res = await searchHotels(destinationName, { startDate, endDate });
          setHotels(res);
        }
        setIsLoadingResults(false);
      };
      fetchResults();
    }
  }, [trackingState, destinationName, startDate, endDate]);

  const handleStartTracking = async () => {
    if (!config.trackFlights && !config.trackHotels) return;
    
    setIsActivating(true);
    setError(null);
    try {
      const state = await activateTracking(tripId, destinationName, {
        startDate,
        ...config
      });
      setTrackingState(state);
    } catch (err) {
      setError(err.message || 'Failed to activate tracking.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleStopTracking = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`tw_price_tracking_${tripId}`);
    }
    setTrackingState(null);
    setFlights([]);
    setHotels([]);
  };

  const handleSelectFlight = (flight) => {
    saveTrackingSelection(tripId, 'flight', flight);
    setTrackingState(getTrackingState(tripId));
  };

  const handleSelectHotel = (hotel) => {
    saveTrackingSelection(tripId, 'hotel', hotel);
    const state = getTrackingState(tripId);
    if (state) {
      state.hotelMode = 'basecamp';
      state.basecampHotel = hotel.name;
      saveTrackingState(tripId, state);
    }
    setTrackingState(getTrackingState(tripId));

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tripwise_itinerary');
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.hotelMode = 'basecamp';
          parsed.basecampHotel = hotel.name;
          localStorage.setItem('tripwise_itinerary', JSON.stringify(parsed));
        }
      } catch (e) {}
    }
  };

  const handleClearSelection = (type) => {
    saveTrackingSelection(tripId, type, null);
    setTrackingState(getTrackingState(tripId));
  };

  const handleRedirect = (type, linkInfo) => {
    setRedirectingType(type);
    setTimeout(() => {
      setRedirectingType(null);
      if (typeof window !== 'undefined' && linkInfo?.url) {
        window.open(linkInfo.url, '_blank', 'noopener,noreferrer');
      }
    }, 650);
  };

  if (!destinationName) return null;

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center p-12 text-[#7A7268]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // Calculate Stay Nights for Hotel Total
  const getStayNights = () => {
    if (!startDate || !endDate) return 4;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 4;
  };
  const stayNights = getStayNights();

  // Active Tracking View
  if (trackingState) {
    const destShort = destinationName.split(',')[0];

    // Compute Flight Metrics for Badges
    const minFlightPrice = flights.length > 0 ? Math.min(...flights.map(f => f.price)) : 0;
    const minFlightDuration = flights.length > 0 ? Math.min(...flights.map(f => f.durationMinutes || 999)) : 0;
    const bestValueFlightId = flights.length > 0 ? flights.reduce((best, f) => {
      if (!best) return f.id;
      const currentBest = flights.find(x => x.id === best);
      const fScore = f.price + (f.stops * 100) + ((f.durationMinutes || 0) * 0.4);
      const bestScore = currentBest.price + (currentBest.stops * 100) + ((currentBest.durationMinutes || 0) * 0.4);
      return fScore < bestScore ? f.id : best;
    }, null) : null;

    // Compute Hotel Metrics for Badges
    const minHotelPrice = hotels.length > 0 ? Math.min(...hotels.map(h => h.price)) : 0;
    const bestValueHotelId = hotels.length > 0 ? hotels.reduce((best, h) => {
      if (!best) return h.id;
      const currentBest = hotels.find(x => x.id === best);
      const hScore = h.price / (h.rating * h.rating);
      const bestScore = currentBest.price / (currentBest.rating * currentBest.rating);
      return hScore < bestScore ? h.id : best;
    }, null) : null;

    const sortedFlights = [...flights]
      .filter(f => flightStops === 'any' ? true : flightStops === 'nonstop' ? f.stops === 0 : f.stops === 1)
      .sort((a, b) => {
        if (flightSort === 'price') return a.price - b.price;
        if (flightSort === 'duration') return (a.durationMinutes || 0) - (b.durationMinutes || 0);
        if (flightSort === 'best') return (a.id === bestValueFlightId ? -1 : 1);
        return 0;
    });

    const sortedHotels = [...hotels]
      .filter(h => hotelRating === 'any' ? true : h.rating >= parseInt(hotelRating))
      .sort((a, b) => {
        if (hotelSort === 'price') return a.price - b.price;
        if (hotelSort === 'rating') return b.rating - a.rating;
        if (hotelSort === 'best') return (h.id === bestValueHotelId ? -1 : 1);
        return 0;
    });

    return (
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-black text-[#1E1C1A] tracking-tight">Active Price Tracking</h2>
            <p className="text-sm font-sans text-[#7A7268] mt-1">
              Tracking <span className="font-semibold text-[#1E1C1A]">{trackingState.config.origin} <ArrowRight className="w-3 h-3 inline mx-1" /> {destShort}</span>
            </p>
          </div>
          <button 
            onClick={handleStopTracking}
            className="px-4 py-2 text-xs font-bold font-sans text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors border border-red-100"
          >
            Stop Tracking
          </button>
        </div>

        <div className="space-y-6">
          {/* FLIGHTS SECTION */}
          {trackingState.config.trackFlights && (
            <div className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Plane className="w-6 h-6 text-[#FF6B2C]" />
                  <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">Flights</h3>
                </div>
                {trackingState.selectedFlight && (
                  <button onClick={() => handleClearSelection('flight')} className="text-xs font-semibold text-[#7A7268] hover:text-[#1E1C1A] underline">
                    Change Selection
                  </button>
                )}
              </div>

              {trackingState.selectedFlight ? (() => {
                const flightLinkInfo = getBookingLinkInfo(destinationName, 'flight', trackingState.selectedFlight, {
                  origin: trackingState.config?.origin,
                  startDate
                });

                return (
                  <div className="bg-white rounded-2xl border border-[#FF6B2C] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-[#FF6B2C] text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-sm">Selected Flight</span>
                        <span className="text-sm font-bold text-[#1E1C1A]">{trackingState.selectedFlight.airline}</span>
                        <span className="text-[11px] font-mono text-[#7A7268] bg-[#F5F0E8] px-1.5 py-0.5 rounded">{trackingState.selectedFlight.flightNumber}</span>
                      </div>
                      <div className="text-xs font-medium text-[#7A7268] flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1E1C1A]">{trackingState.selectedFlight.departureTime} – {trackingState.selectedFlight.arrivalTime}</span>
                        <span>&middot;</span>
                        <span>{trackingState.selectedFlight.duration}</span>
                        <span>&middot;</span>
                        <span className={trackingState.selectedFlight.stops === 0 ? 'text-emerald-700 font-bold' : 'text-[#4A443E]'}>
                          {trackingState.selectedFlight.stops === 0 ? 'Nonstop' : `1 Stop ${trackingState.selectedFlight.via ? `via ${trackingState.selectedFlight.via}` : ''}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="text-right">
                          <div className="text-2xl font-serif font-black text-[#1E1C1A]">${trackingState.selectedFlight.price}</div>
                          <div className="text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Round Trip</div>
                        </div>
                        <button 
                          onClick={() => handleRedirect('flight', flightLinkInfo)}
                          disabled={redirectingType === 'flight'}
                          className="bg-[#1E1C1A] hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-75"
                        >
                          {redirectingType === 'flight' ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
                              <span>Refreshing price...</span>
                            </>
                          ) : (
                            <>
                              <span>{flightLinkInfo.buttonText}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                      {flightLinkInfo.disclosureNote && (
                        <div className="text-[11px] text-[#7A7268] font-medium flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>{flightLinkInfo.disclosureNote}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })() : (
                <>
                  {/* Segmented Controls for Flights */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3 p-3 bg-white/70 rounded-2xl border border-[#E6DFD5]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Sort:</span>
                      <button 
                        onClick={() => setFlightSort('price')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightSort === 'price' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Cheapest
                      </button>
                      <button 
                        onClick={() => setFlightSort('duration')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightSort === 'duration' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Fastest
                      </button>
                      <button 
                        onClick={() => setFlightSort('best')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightSort === 'best' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Best Value
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Stops:</span>
                      <button 
                        onClick={() => setFlightStops('any')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightStops === 'any' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        All
                      </button>
                      <button 
                        onClick={() => setFlightStops('nonstop')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightStops === 'nonstop' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        Nonstop
                      </button>
                      <button 
                        onClick={() => setFlightStops('1stop')} 
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${flightStops === '1stop' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                      >
                        1 Stop
                      </button>
                    </div>
                  </div>

                  {isLoadingResults ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white/80 animate-pulse rounded-2xl border border-[#E6DFD5] p-5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-10 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                            <div className="space-y-2 flex-1">
                              <div className="h-4 w-1/3 bg-[#E6DFD5]/60 rounded-md" />
                              <div className="h-3 w-1/2 bg-[#E6DFD5]/40 rounded-md" />
                            </div>
                          </div>
                          <div className="w-24 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                        </div>
                      ))}
                    </div>
                  ) : flights.length > 0 ? (
                    <div className="space-y-3">
                      {sortedFlights.slice(0, 6).map(flight => {
                        const isSelected = trackingState.selectedFlight?.id === flight.id;
                        const isBestValue = flight.id === bestValueFlightId;
                        const isCheapest = flight.price === minFlightPrice;
                        const isFastest = flight.durationMinutes === minFlightDuration;

                        return (
                          <div 
                            key={flight.id} 
                            className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                              isSelected
                                ? 'bg-[#FFF9F5] border-2 border-[#FF6B2C] shadow-md ring-2 ring-[#FF6B2C]/20'
                                : isBestValue
                                ? 'bg-[#FFFBF7] border-2 border-[#FF6B2C]/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                                : 'bg-white border border-[#E6DFD5] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-md'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                                {isBestValue && (
                                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B2C] text-white shadow-xs">
                                    ★ Best Value
                                  </span>
                                )}
                                {isCheapest && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    Cheapest
                                  </span>
                                )}
                                {isFastest && (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                                    Fastest
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3">
                                <img 
                                  src={flight.logo} 
                                  alt={flight.airline} 
                                  className="w-7 h-7 object-contain rounded-md bg-white border border-[#E6DFD5] p-0.5 shrink-0 shadow-xs" 
                                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                <div>
                                  <div className="text-sm font-bold text-[#1E1C1A] flex items-center gap-2">
                                    <span>{flight.airline}</span>
                                    <span className="text-[11px] font-mono text-[#7A7268] bg-[#F5F0E8] px-1.5 py-0.5 rounded">{flight.flightNumber}</span>
                                  </div>
                                  <div className="text-xs font-medium text-[#7A7268] mt-0.5 flex flex-wrap items-center gap-2">
                                    <span className="font-semibold text-[#1E1C1A]">{flight.departureTime} – {flight.arrivalTime}</span>
                                    <span>&middot;</span>
                                    <span>{flight.duration}</span>
                                    <span>&middot;</span>
                                    <span className={flight.stops === 0 ? 'text-emerald-700 font-bold' : 'text-[#4A443E]'}>
                                      {flight.stops === 0 ? 'Nonstop' : `1 Stop ${flight.via ? `via ${flight.via}` : ''}`}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#E6DFD5]/60 pt-3 md:pt-0">
                              <div className="text-right">
                                <div className="text-2xl font-serif font-black text-[#1E1C1A]">${flight.price}</div>
                                <div className="text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Round Trip</div>
                              </div>
                              {isSelected ? (
                                <button onClick={() => handleClearSelection('flight')} className="bg-[#FF6B2C] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#e0591e] transition-colors">
                                  <CheckCircle2 className="w-4 h-4" /> Selected
                                </button>
                              ) : (
                                <button onClick={() => handleSelectFlight(flight)} className="bg-[#F5F0E8] hover:bg-[#E6DFD5] text-[#1E1C1A] px-4.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]">
                                  Select
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#7A7268] text-sm">No flights found for these dates. Try adjusting your itinerary.</div>
                  )}
                </>
              )}
            </div>
          )}

          {/* HOTELS SECTION */}
          {trackingState.config.trackHotels && (() => {
            const currentHotelMode = trackingState?.hotelMode || propHotelMode || (propBasecampHotel ? 'basecamp' : 'undecided');
            const currentBasecampHotel = trackingState?.basecampHotel || propBasecampHotel;

            // MODE A: "basecamp" - Hotel already specified at planning time
            if (currentHotelMode === 'basecamp' && !trackingState?.selectedHotel) {
              const basecampLinkInfo = getBookingLinkInfo(destinationName, 'hotel', { name: currentBasecampHotel }, { startDate, endDate });

              return (
                <div className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Hotel className="w-6 h-6 text-[#FF6B2C]" />
                      <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">Hotels & Stay</h3>
                    </div>
                    <span className="bg-[#FF6B2C] text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-full shadow-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Basecamp Confirmed
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#E6DFD5] p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-[#FAF6F0] border border-[#FF6B2C]/30 rounded-2xl flex items-center justify-center text-2xl shrink-0">
                        🏨
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-extrabold text-[#FF6B2C] uppercase tracking-wider mb-1">
                          Confirmed Basecamp Stay
                        </div>
                        <h4 className="text-xl font-serif font-bold text-[#1E1C1A]">
                          {currentBasecampHotel || "Your Booked Hotel"}
                        </h4>
                        <p className="text-xs text-[#7A7268] mt-1 flex items-center gap-1 leading-relaxed">
                          <MapPin className="w-3.5 h-3.5 text-[#FF6B2C] shrink-0" />
                          <span>Your itinerary activity routing and travel times are optimized around this stay.</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => handleRedirect('hotel', basecampLinkInfo)}
                        disabled={redirectingType === 'hotel'}
                        className="w-full md:w-auto bg-[#1E1C1A] hover:bg-black text-white px-5 py-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-2 shadow-sm disabled:opacity-75"
                      >
                        {redirectingType === 'hotel' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
                            <span>Opening partner...</span>
                          </>
                        ) : (
                          <>
                            <span>{basecampLinkInfo.buttonText}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 p-3.5 bg-white/60 rounded-xl border border-[#E6DFD5] text-xs text-[#7A7268] flex items-center justify-between flex-wrap gap-2">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-[#FF6B2C] shrink-0" />
                      Want to change your stay? Edit your basecamp hotel in the AI Planner to re-optimize your itinerary.
                    </span>
                    <Link 
                      href="/ai-planner/new?step=destination" 
                      className="text-xs font-bold text-[#1E1C1A] hover:text-[#FF6B2C] underline transition-colors"
                    >
                      Edit in Planner &rarr;
                    </Link>
                  </div>
                </div>
              );
            }

            // MODE B: "undecided" - Browse & Select Hotels
            return (
              <div className="bg-[#FAF6F0] rounded-3xl border border-[#E6DFD5] p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Hotel className="w-6 h-6 text-[#FF6B2C]" />
                    <h3 className="font-serif text-xl font-bold text-[#1E1C1A]">Hotels</h3>
                  </div>
                  {trackingState.selectedHotel && (
                    <button onClick={() => handleClearSelection('hotel')} className="text-xs font-semibold text-[#7A7268] hover:text-[#1E1C1A] underline">
                      Change Selection
                    </button>
                  )}
                </div>

                {trackingState.selectedHotel ? (() => {
                  const hotelLinkInfo = getBookingLinkInfo(destinationName, 'hotel', trackingState.selectedHotel, {
                    startDate,
                    endDate
                  });

                  return (
                    <div className="space-y-4">
                      <div className="bg-white rounded-2xl border border-[#FF6B2C] p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-4">
                          <img src={trackingState.selectedHotel.image} alt="Hotel" className="w-20 h-20 rounded-xl object-cover border border-[#E6DFD5]" />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-[#FF6B2C] text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-sm">Selected Hotel</span>
                              <span className="text-sm font-bold text-[#1E1C1A]">{trackingState.selectedHotel.name}</span>
                            </div>
                            <div className="text-xs font-medium text-[#7A7268] flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {trackingState.selectedHotel.rating}.0 Stars &middot; {trackingState.selectedHotel.distance}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 w-full md:w-auto">
                          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <div className="text-2xl font-serif font-black text-[#1E1C1A]">${trackingState.selectedHotel.price}</div>
                              <div className="text-[10px] text-[#7A7268] uppercase font-bold tracking-wider">Per Night</div>
                            </div>
                            <button 
                              onClick={() => handleRedirect('hotel', hotelLinkInfo)}
                              disabled={redirectingType === 'hotel'}
                              className="bg-[#1E1C1A] hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-75"
                            >
                              {redirectingType === 'hotel' ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-[#FF6B2C]" />
                                  <span>Refreshing price...</span>
                                </>
                              ) : (
                                <>
                                  <span>{hotelLinkInfo.buttonText}</span>
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                          </div>
                          {hotelLinkInfo.disclosureNote && (
                            <div className="text-[11px] text-[#7A7268] font-medium flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{hotelLinkInfo.disclosureNote}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Re-optimize Itinerary Prompt Banner */}
                      <div className="bg-[#FFF9F5] rounded-2xl border-2 border-[#FF6B2C] p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#FF6B2C]/10 rounded-xl flex items-center justify-center text-xl shrink-0 font-bold">
                            ⚡
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-[#1E1C1A]">
                              Selected: {trackingState.selectedHotel.name}
                            </h4>
                            <p className="text-xs text-[#7A7268] mt-0.5">
                              Want us to re-optimize your itinerary activities and routing around {trackingState.selectedHotel.name}?
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (onReoptimize) {
                              setIsReoptimizing(true);
                              await onReoptimize(trackingState.selectedHotel.name);
                              setIsReoptimizing(false);
                            }
                          }}
                          disabled={isReoptimizing}
                          className="w-full md:w-auto bg-[#FF6B2C] hover:bg-[#e0591e] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 disabled:opacity-75 cursor-pointer"
                        >
                          {isReoptimizing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-white" />
                              <span>Re-optimizing Routing...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Re-optimize Itinerary Around Hotel</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <>
                    {/* Segmented Controls for Hotels */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-3 p-3 bg-white/70 rounded-2xl border border-[#E6DFD5]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Sort:</span>
                        <button 
                          onClick={() => setHotelSort('price')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelSort === 'price' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          Cheapest
                        </button>
                        <button 
                          onClick={() => setHotelSort('rating')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelSort === 'rating' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          Top Rated
                        </button>
                        <button 
                          onClick={() => setHotelSort('best')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelSort === 'best' ? 'bg-[#1E1C1A] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          Best Value
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-[#7A7268] uppercase tracking-wider mr-1">Rating:</span>
                        <button 
                          onClick={() => setHotelRating('any')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelRating === 'any' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          All
                        </button>
                        <button 
                          onClick={() => setHotelRating('4')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelRating === '4' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          4+ Stars
                        </button>
                        <button 
                          onClick={() => setHotelRating('5')} 
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${hotelRating === '5' ? 'bg-[#FF6B2C] text-white shadow-xs' : 'bg-white text-[#4A443E] hover:bg-[#F5F0E8] border border-[#E6DFD5]'}`}
                        >
                          5 Stars
                        </button>
                      </div>
                    </div>

                    {isLoadingResults ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="bg-white/80 animate-pulse rounded-2xl border border-[#E6DFD5] p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="w-24 h-24 bg-[#E6DFD5]/60 rounded-xl" />
                              <div className="space-y-2 flex-1">
                                <div className="h-4 w-1/3 bg-[#E6DFD5]/60 rounded-md" />
                                <div className="h-3 w-1/2 bg-[#E6DFD5]/40 rounded-md" />
                              </div>
                            </div>
                            <div className="w-24 h-10 bg-[#E6DFD5]/60 rounded-xl" />
                          </div>
                        ))}
                      </div>
                    ) : hotels.length > 0 ? (
                      <div className="space-y-3">
                        {sortedHotels.slice(0, 6).map(hotel => {
                          const isSelected = trackingState.selectedHotel?.id === hotel.id;
                          const isBestValue = hotel.id === bestValueHotelId;
                          const isCheapest = hotel.price === minHotelPrice;

                          return (
                            <div 
                              key={hotel.id} 
                              className={`relative rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 ${
                                isSelected
                                  ? 'bg-[#FFF9F5] border-2 border-[#FF6B2C] shadow-md ring-2 ring-[#FF6B2C]/20'
                                  : isBestValue
                                  ? 'bg-[#FFFBF7] border-2 border-[#FF6B2C]/70 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
                                  : 'bg-white border border-[#E6DFD5] hover:border-[#FF6B2C]/40 hover:-translate-y-0.5 hover:shadow-md'
                              }`}
                            >
                              <div className="flex items-center gap-4 flex-1">
                                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-[#F5F0E8] shrink-0 border border-[#E6DFD5]">
                                  <img 
                                    src={hotel.image} 
                                    alt={hotel.name} 
                                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                                    onError={(e) => {
                                      e.currentTarget.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=350&fit=crop';
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                    {isBestValue && (
                                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#FF6B2C] text-white shadow-xs">
                                        ★ Best Value
                                      </span>
                                    )}
                                    {isCheapest && (
                                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Cheapest
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-base font-bold text-[#1E1C1A] mb-1">{hotel.name}</div>
                                  <div className="text-xs font-medium text-[#7A7268] flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md border border-amber-200/60 font-bold">
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {hotel.rating}.0
                                    </span>
                                    <span>&middot;</span>
                                    <span>{hotel.distance}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#E6DFD5]/60 pt-3 md:pt-0">
                                <div className="text-right">
                                  <div className="flex items-baseline justify-end gap-1">
                                    <span className="text-2xl font-serif font-black text-[#1E1C1A]">${hotel.price}</span>
                                    <span className="text-xs text-[#7A7268] font-bold">/night</span>
                                  </div>
                                  <div className="text-xs font-medium text-[#7A7268] mt-0.5">
                                    <span className="font-bold text-[#1E1C1A]">${hotel.price * stayNights}</span> total ({stayNights} nights)
                                  </div>
                                </div>
                                {isSelected ? (
                                  <button onClick={() => handleClearSelection('hotel')} className="bg-[#FF6B2C] text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-sm hover:bg-[#e0591e] transition-colors">
                                    <CheckCircle2 className="w-4 h-4" /> Selected
                                  </button>
                                ) : (
                                  <button onClick={() => handleSelectHotel(hotel)} className="bg-[#F5F0E8] hover:bg-[#E6DFD5] text-[#1E1C1A] px-4.5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]">
                                    Select
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#7A7268] text-sm">No hotels found for these dates. Try adjusting your itinerary.</div>
                    )}
                  </>
                )}
              </div>
            );
          })()}
        </div>

        <div className="flex items-start gap-2 bg-[#F5F0E8] rounded-xl p-4 mt-6">
          <Bell className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A443E] leading-relaxed">
            <span className="font-bold text-[#1E1C1A]">Price Drop Alerts:</span> We're actively tracking your {trackingState.selectedFlight || trackingState.selectedHotel ? 'selected items' : 'route/city baseline'}. If prices drop by <span className="font-bold text-[#1E1C1A]">10%+</span>, we'll send you an immediate notification.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#7A7268] mt-4 ml-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Last checked: Just now &middot; Next check in 22 hours</span>
        </div>
      </div>
    );
  }

  // Unactivated Prompt View
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border border-[#E6DFD5] p-8 text-center shadow-xs">
      <div className="w-16 h-16 bg-[#FAF6F0] border border-[#FF6B2C]/20 rounded-full flex items-center justify-center mx-auto mb-5">
        <Bell className="w-8 h-8 text-[#FF6B2C]" />
      </div>
      
      <h2 className="text-2xl font-serif font-black text-[#1E1C1A] mb-3">Search & Track Prices</h2>
      <p className="text-[#7A7268] mb-8 font-sans max-w-md mx-auto">
        Activate price tracking to browse flights and hotels for {destinationName}. Select your preferred options and we'll notify you when their prices drop.
      </p>

      <div className="max-w-xs mx-auto text-left space-y-4 mb-8">
        <div>
          <label className="block text-xs font-bold text-[#4A443E] uppercase tracking-wider mb-1.5">Origin Airport</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A7268]" />
            <input 
              type="text" 
              value={config.origin}
              onChange={(e) => setConfig({ ...config, origin: e.target.value.toUpperCase() })}
              maxLength={3}
              className="w-full pl-9 pr-3 py-2.5 bg-[#F5F0E8] border border-[#E6DFD5] rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#FF6B2C] transition-colors"
              placeholder="JFK"
            />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2 text-[#4A443E] group-hover:text-[#1E1C1A] transition-colors">
              <Plane className="w-4 h-4" />
              <span className="text-sm font-semibold">Flights</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${config.trackFlights ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'}`}>
              <input type="checkbox" className="sr-only" checked={config.trackFlights} onChange={() => setConfig({ ...config, trackFlights: !config.trackFlights })} />
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.trackFlights ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2 text-[#4A443E] group-hover:text-[#1E1C1A] transition-colors">
              <Hotel className="w-4 h-4" />
              <span className="text-sm font-semibold">Hotels</span>
            </div>
            <div className={`w-10 h-6 rounded-full transition-colors relative ${config.trackHotels ? 'bg-[#FF6B2C]' : 'bg-[#E6DFD5]'}`}>
              <input type="checkbox" className="sr-only" checked={config.trackHotels} onChange={() => setConfig({ ...config, trackHotels: !config.trackHotels })} />
              <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${config.trackHotels ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-center gap-1.5 text-red-600 text-xs mb-4">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <button 
        onClick={handleStartTracking}
        disabled={isActivating || (!config.trackFlights && !config.trackHotels)}
        className="w-full max-w-xs mx-auto bg-[#1E1C1A] text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
      >
        {isActivating ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Starting...</>
        ) : (
          'Search & Track'
        )}
      </button>
    </div>
  );
}
