import { useState, useEffect, useRef } from 'react';

// Haversine formula to calculate distance between two coordinates in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let [_, hours, mins, period] = match;
  hours = parseInt(hours, 10);
  mins = parseInt(mins, 10);
  if (period?.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

export function useLiveAssistant(activeDayData, dayIndex, tripStartDate, itineraryCoordinates) {
  const [showNudge, setShowNudge] = useState(false);
  const [weatherNudge, setWeatherNudge] = useState(null);
  const [lastKnownLocation, setLastKnownLocation] = useState(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  
  const timerRef = useRef(null);

  // 1. Initial Activation Checks & Live Location Schedule Delta
  useEffect(() => {
    const checkActivation = () => {
      // Offline check
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsLiveActive(false);
        return false;
      }

      // Settings toggle check
      const enabled = localStorage.getItem('tripwise_live_assistant_enabled') === 'true';
      if (!enabled) {
        setIsLiveActive(false);
        return false;
      }

      // Snoozed for today check
      const snoozeDate = localStorage.getItem('tripwise_live_assistant_snooze_date');
      const todayStr = new Date().toDateString();
      if (snoozeDate === todayStr) {
        setIsLiveActive(false);
        return false;
      }

      // Active day match check
      if (!tripStartDate) return false;
      const start = new Date(tripStartDate);
      const activeDate = new Date(start);
      activeDate.setDate(activeDate.getDate() + dayIndex);
      
      const isToday = activeDate.toDateString() === new Date().toDateString();
      setIsLiveActive(isToday);
      return isToday;
    };

    const isActive = checkActivation();
    if (!isActive) return;

    // Core Logic Loop
    const evaluateSchedule = () => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLastKnownLocation({ lat: latitude, lng: longitude });

        // Delta Calculation
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();

        if (!activeDayData || !activeDayData.activities) return;

        // Find the activity we *should* be at or heading to right now
        let expectedStop = null;

        for (let i = 0; i < activeDayData.activities.length; i++) {
          const act = activeDayData.activities[i];
          const actMins = parseTimeToMinutes(act.time);
          if (currentMins >= actMins) {
            expectedStop = act;
          }
        }

        if (expectedStop && expectedStop.coordinates) {
          const expectedMins = parseTimeToMinutes(expectedStop.time);
          const timeDelta = currentMins - expectedMins; // Minutes late
          
          const distKm = calculateDistance(
            latitude, longitude, 
            expectedStop.coordinates.lat, expectedStop.coordinates.lng
          );

          // Thresholds: >15 mins late AND >1km away
          if (timeDelta > 15 && distKm > 1.0) {
            const lastNudge = localStorage.getItem('tripwise_last_nudge_timestamp');
            const TWO_HOURS = 2 * 60 * 60 * 1000;
            
            if (!lastNudge || (now.getTime() - parseInt(lastNudge, 10) > TWO_HOURS)) {
              setShowNudge(true);
            }
          }
        }
      }, (err) => {
        console.warn("Location permission denied or unavailable for Live Assistant", err);
      }, {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 10000
      });
    };

    evaluateSchedule();
    timerRef.current = setInterval(evaluateSchedule, 10 * 60 * 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeDayData, dayIndex, tripStartDate]);

  // 2. Weather Check Logic
  useEffect(() => {
    if (!isLiveActive || !activeDayData || !itineraryCoordinates) return;

    const checkWeather = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const weatherNudgeDate = localStorage.getItem('tripwise_weather_nudge_date');
      const todayStr = new Date().toDateString();
      if (weatherNudgeDate === todayStr) return;

      try {
        const { lat, lng } = itineraryCoordinates;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation_probability,temperature_2m&timezone=auto&forecast_days=2`);
        if (!res.ok) return;
        const data = await res.json();
        
        if (!data || !data.hourly) return;
        
        for (const act of activeDayData.activities) {
          if (act.indoorOutdoor === 'Outdoor') {
            const actMins = parseTimeToMinutes(act.time);
            const actHour = Math.floor(actMins / 60);
            const today = new Date();
            
            const forecastIndex = data.hourly.time.findIndex(timeStr => {
              const d = new Date(timeStr);
              return d.getDate() === today.getDate() && d.getHours() === actHour;
            });

            if (forecastIndex !== -1) {
              const precipProb = data.hourly.precipitation_probability[forecastIndex];
              const temp = data.hourly.temperature_2m[forecastIndex];
              
              if (precipProb >= 60 || temp > 35 || temp < 0) {
                setWeatherNudge({
                  activity: act,
                  forecast: { precipProb, temp, type: precipProb >= 60 ? 'rain' : 'extreme_temp' }
                });
                break;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Weather fetch failed, silently skipping weather nudge", err);
      }
    };

    checkWeather();
  }, [isLiveActive, activeDayData, itineraryCoordinates]);

  const snoozeNudges = () => {
    localStorage.setItem('tripwise_live_assistant_snooze_date', new Date().toDateString());
    setShowNudge(false);
  };

  const dismissWeatherNudge = () => {
    localStorage.setItem('tripwise_weather_nudge_date', new Date().toDateString());
    setWeatherNudge(null);
  };

  const markNudgeShown = () => {
    localStorage.setItem('tripwise_last_nudge_timestamp', Date.now().toString());
    setShowNudge(false);
  };

  return {
    showNudge,
    weatherNudge,
    isLiveActive,
    lastKnownLocation,
    snoozeNudges,
    dismissWeatherNudge,
    markNudgeShown,
    dismissNudge: () => setShowNudge(false)
  };
}
