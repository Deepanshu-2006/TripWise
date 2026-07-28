'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { Book, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('tripwise_passport_nationality');
    if (saved) {
      setNationality(saved);
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
          
          <div className="p-8 md:p-10 bg-[#FAF6F0]/50 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#FF6B2C] shrink-0 mt-0.5" />
            <p className="text-xs text-[#7A7268] leading-relaxed">
              <strong>Privacy Notice:</strong> Your passport nationality is only used to query visa databases. We do not require or store your passport number, expiry date, or sensitive biometrics.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
