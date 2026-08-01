'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { Book, Save, CheckCircle2, AlertCircle, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePreferenceEngine } from '../hooks/usePreferenceEngine';

const NATIONALITIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'IN', name: 'India' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
];

export default function SettingsPage() {
  const router = useRouter();
  const [nationality, setNationality] = useState('');
  const [liveAssistant, setLiveAssistant] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { profile, resetProfile, updateAffinity } = usePreferenceEngine();

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('tripwise_passport_nationality');
    if (saved) {
      setNationality(saved);
    }
    const savedLiveAssist = localStorage.getItem('tripwise_live_assistant_enabled');
    if (savedLiveAssist === 'true') {
      setLiveAssistant(true);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate a network request to save to a database
    setTimeout(() => {
      localStorage.setItem('tripwise_passport_nationality', nationality);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => {
        router.push('/itinerary?tab=visa');
      }, 1000); // Redirect after 1 second
    }, 600);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col font-sans">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="pt-28 md:pt-36" />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pb-12 md:px-12">
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-serif font-black text-[#1E1C1A] tracking-tight mb-4">
            Account Settings
          </h1>
          <p className="text-[#7A7268] text-lg max-w-2xl">
            Manage your personal details and travel preferences.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6DFD5] shadow-sm overflow-hidden">
          <div className="p-8 md:p-10 border-b border-[#E6DFD5] flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0">
              <Book className="w-6 h-6 text-[#FF6B2C]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-serif font-bold text-[#1E1C1A] mb-2">Travel Documents</h2>
              <p className="text-sm text-[#7A7268] leading-relaxed mb-6">
                Your passport nationality is used to automatically fetch accurate visa requirements, travel advisories, and border entry rules for your trips.
              </p>
              
              <div className="max-w-md">
                <label className="block text-xs font-mono uppercase tracking-widest text-[#5F5E5A] font-bold mb-2">
                  Passport Nationality
                </label>
                <div className="relative">
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full appearance-none bg-[#FAF6F0] border border-[#E6DFD5] text-[#1E1C1A] text-sm font-bold rounded-xl px-4 py-3.5 pr-10 focus:outline-hidden focus:border-[#FF6B2C] transition-colors"
                  >
                    <option value="" disabled>Select your nationality...</option>
                    {NATIONALITIES.map(nat => (
                      <option key={nat.code} value={nat.code}>{nat.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-4 h-4 text-[#7A7268]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={handleSave}
                  disabled={!nationality || isSaving}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E1C1A] text-[#FAF6F0] hover:bg-[#FF6B2C] text-sm font-bold transition-all shadow-md disabled:opacity-50 disabled:hover:bg-[#1E1C1A]"
                >
                  {isSaving ? (
                    <span className="inline-block w-4 h-4 border-2 border-[#FAF6F0]/30 border-t-[#FAF6F0] rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
                
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="flex items-center gap-2 text-green-600 text-sm font-bold"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </div>
          
          <div className="p-8 md:p-10 bg-[#FAF6F0]/50 flex items-start gap-3 border-t border-[#E6DFD5]">
            <AlertCircle className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
            <p className="text-xs text-[#7A7268] leading-relaxed">
              <strong>Privacy Notice:</strong> Your passport nationality is only used to query visa databases. We do not require or store your passport number, expiry date, or sensitive biometrics.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6DFD5] shadow-sm overflow-hidden mt-8">
          <div className="p-8 md:p-10 border-b border-[#E6DFD5] flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-[#FF6B2C]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-serif font-bold text-[#1E1C1A] mb-2">Privacy & Location</h2>
              <p className="text-sm text-[#7A7268] leading-relaxed mb-6">
                Manage how TripWise accesses your location data during your trips.
              </p>
              
              <div className="max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-bold text-[#1E1C1A] mb-1">
                      Live Day-Of Assistant
                    </label>
                    <p className="text-xs text-[#7A7268]">
                      Periodically checks your location against the itinerary on active trip days to offer smart re-planning if you run behind schedule. Location is only accessed while the app is open.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={liveAssistant}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setLiveAssistant(val);
                        localStorage.setItem('tripwise_live_assistant_enabled', val ? 'true' : 'false');
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B2C]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E6DFD5] shadow-sm overflow-hidden mt-8">
          <div className="p-8 md:p-10 border-b border-[#E6DFD5] flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-[#FAF6F0] border border-[#E6DFD5] flex items-center justify-center shrink-0">
              <Heart className="w-6 h-6 text-[#FF6B2C]" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-serif font-bold text-[#1E1C1A] mb-2">Your Travel Preferences</h2>
              <p className="text-sm text-[#7A7268] leading-relaxed mb-6">
                TripWise learns from your trip choices (ratings, skips, and bookings) to improve future suggestions. These preferences are stored locally on your device.
              </p>
              
              <div className="max-w-md">
                <div className="flex flex-col gap-4">
                  {Object.entries(profile?.categoryAffinities || {}).length > 0 ? (
                    Object.entries(profile.categoryAffinities).map(([category, score]) => (
                      <div key={category} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-bold text-[#1E1C1A] capitalize">{category}</label>
                          <span className="text-xs text-[#7A7268] font-mono">{(score * 100).toFixed(0)}% Affinity</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={score}
                          onChange={(e) => updateAffinity(category, parseFloat(e.target.value))}
                          className="w-full h-2 bg-[#FAF6F0] rounded-lg appearance-none cursor-pointer accent-[#FF6B2C]"
                        />
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-[#FAF6F0] rounded-xl border border-[#E6DFD5]">
                      <p className="text-xs text-[#7A7268] italic">No preferences learned yet. Complete a trip to start building your profile.</p>
                    </div>
                  )}

                  {profile?.explicitDislikes?.length > 0 && (
                    <div className="mt-4 p-4 bg-[#FF6B2C]/5 rounded-xl border border-[#FF6B2C]/20">
                      <h4 className="text-sm font-bold text-[#1E1C1A] mb-2">Categories you tend to skip:</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.explicitDislikes.map(dislike => (
                          <span key={dislike} className="px-2.5 py-1 rounded-md bg-white border border-[#FF6B2C]/30 text-xs font-mono text-[#FF6B2C]">{dislike}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 border-t border-[#E6DFD5] pt-6">
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to reset all learned preferences? This cannot be undone.")) {
                          resetProfile();
                        }
                      }}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors text-xs font-bold cursor-pointer"
                    >
                      Reset Learned Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
