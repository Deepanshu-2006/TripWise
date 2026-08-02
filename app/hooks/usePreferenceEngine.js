import { useState, useEffect } from 'react';

const STORAGE_KEY = 'tripwise_user_profile';

const DEFAULT_PROFILE = {
  categoryAffinities: {},
  explicitDislikes: [],
  pacePreference: 'balanced',
  priceToleranceSignal: 'standard',
  skipCounts: {},
  lastUpdated: null,
};

export function usePreferenceEngine() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setProfile({ ...DEFAULT_PROFILE, ...parsed });
        } catch (e) {
          console.error("Failed to parse user preference profile", e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

  const saveProfile = (newProfile) => {
    newProfile.lastUpdated = Date.now();
    setProfile(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
    }
  };

  const recordSkip = (category) => {
    if (!category) return;
    const catUpper = category.toUpperCase().trim();
    
    const currentSkips = profile.skipCounts[catUpper] || 0;
    const newSkips = currentSkips + 1;
    
    const newProfile = { ...profile, skipCounts: { ...profile.skipCounts, [catUpper]: newSkips } };
    
    // Auto-Dislike logic
    if (newSkips >= 3 && !newProfile.explicitDislikes.includes(catUpper)) {
      newProfile.explicitDislikes = [...newProfile.explicitDislikes, catUpper];
    }
    
    saveProfile(newProfile);
  };

  const recordTripSignals = (ratings, bookedStops, engagedStops, journalEntries = []) => {
    const newProfile = { ...profile };
    
    // Convert arrays of full activity objects to arrays of category strings for easier matching
    const bookedCategories = bookedStops.map(a => (a.category || '').toUpperCase().trim());
    const engagedCategories = engagedStops.map(a => (a.category || '').toUpperCase().trim());
    
    // Map journal entries to their activities' categories
    // We assume the caller passes journalEntries as [{ activity: { category: '...' }, entry: { ... } }, ...]
    const journaledCategories = journalEntries.map(j => (j.activity?.category || '').toUpperCase().trim());


    // 1. Calculate the signal score for each category seen in this trip
    // Score based on: 
    // Star rating: 1-5 maps to 0.0-1.0
    // Booked: +0.2
    // Engaged (Expanded): +0.1
    // Unengaged (Not rated, not booked, not expanded): 0.2 (baseline low interest)

    const signalScores = {}; // category -> { totalScore: 0, count: 0 }

    Object.keys(ratings).forEach(activityId => {
      const act = ratings[activityId].activity;
      const cat = (act.category || '').toUpperCase().trim();
      const rating = ratings[activityId].rating; // 1 to 5
      
      if (!cat) return;
      if (!signalScores[cat]) signalScores[cat] = { totalScore: 0, count: 0 };
      
      let score = (rating - 1) / 4; // Map 1-5 to 0.0-1.0
      
      // Boost based on journal engagement
      if (journaledCategories.includes(cat)) score += 0.4;
      else if (bookedCategories.includes(cat)) score += 0.2;
      else if (engagedCategories.includes(cat)) score += 0.1;
      
      score = Math.min(Math.max(score, 0), 1); // Clamp to 0-1
      
      signalScores[cat].totalScore += score;
      signalScores[cat].count += 1;
    });

    // Handle activities that were NOT explicitly rated but were in the itinerary
    bookedStops.forEach(act => {
      const cat = (act.category || '').toUpperCase().trim();
      if (!cat || signalScores[cat]) return; // already handled by rating logic
      if (!signalScores[cat]) signalScores[cat] = { totalScore: 0, count: 0 };
      
      let baseScore = 0.7; // Implicit positive signal
      if (journaledCategories.includes(cat)) baseScore += 0.2; // Extra boost if journaled
      
      signalScores[cat].totalScore += baseScore;
      signalScores[cat].count += 1;
    });

    // 2. Apply Exponential Moving Average (EMA) to Affinities
    const updatedAffinities = { ...newProfile.categoryAffinities };
    
    Object.keys(signalScores).forEach(cat => {
      const averageSignal = signalScores[cat].totalScore / signalScores[cat].count;
      const oldScore = updatedAffinities[cat];
      
      if (oldScore !== undefined) {
        updatedAffinities[cat] = (oldScore * 0.7) + (averageSignal * 0.3);
      } else {
        updatedAffinities[cat] = averageSignal;
      }

      // If they booked something from this category, reset the skip count and remove from explicit dislikes
      if (bookedCategories.includes(cat)) {
        newProfile.skipCounts[cat] = 0;
        newProfile.explicitDislikes = newProfile.explicitDislikes.filter(d => d !== cat);
      }
    });

    newProfile.categoryAffinities = updatedAffinities;
    saveProfile(newProfile);
  };

  const updateAffinity = (category, score) => {
    const catUpper = category.toUpperCase().trim();
    const newProfile = { ...profile };
    newProfile.categoryAffinities[catUpper] = score;
    // If manually boosting above 0.5, remove from explicit dislikes
    if (score >= 0.5) {
      newProfile.explicitDislikes = newProfile.explicitDislikes.filter(d => d !== catUpper);
      newProfile.skipCounts[catUpper] = 0;
    }
    saveProfile(newProfile);
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return {
    profile,
    isLoaded,
    recordSkip,
    recordTripSignals,
    updateAffinity,
    resetProfile
  };
}
