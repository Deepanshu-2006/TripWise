'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    question: "How do I fork someone else's itinerary?",
    answer: "Simply click the 'Fork This Itinerary' button on any Trip Card. It will copy the entire itinerary into your personal Trip Planner where you can modify dates, add new stops, or adjust the budget to suit your needs."
  },
  {
    question: "How do I become a Verified Local?",
    answer: "Verified Local status is awarded to community members who have consistently provided highly-upvoted answers in the Local Q&A for a specific destination, or who have shared itineraries that have been forked by more than 50 users."
  },
  {
    question: "What happens to my points on the leaderboard?",
    answer: "You earn points for every upvote on your itineraries, Q&A answers, and Hidden Gem submissions. Top Contributors are featured on the community sidebar and get early access to new AI planner features and exclusive partner discounts."
  },
  {
    question: "Can I remove content I submitted?",
    answer: "Yes, you have full control over your data. You can delete any of your shared trips, Q&A answers, or Hidden Gems at any time from your account dashboard."
  }
];

export default function CommunityFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full">
      <div>
        
        {/* Header */}
        <div className="mb-10 text-left">
          <h2 className="text-[#F4703C] font-mono font-bold text-xs uppercase tracking-[0.2em] mb-3">
            Community Guidelines
          </h2>
          <h3 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 mb-4 leading-tight">
            Common Questions
          </h3>
          <p className="text-stone-500 text-sm md:text-base max-w-xl">
            Everything you need to know about sharing, forking, and contributing to the TripWise community.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-5">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index}
                className="group relative bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.02)] hover:shadow-[0_15px_35px_rgba(244,112,60,0.12)] hover:-translate-y-1 transition-all duration-500"
              >
                {/* Subtle hover gradient behind card */}
                <div className={`absolute inset-0 bg-gradient-to-br from-[#F4703C]/0 via-transparent to-[#F4703C]/0 group-hover:from-[#F4703C]/5 group-hover:to-transparent transition-colors duration-500 pointer-events-none ${isOpen ? 'from-[#F4703C]/5 to-transparent' : ''}`} />
                
                <button
                  onClick={() => toggleFaq(index)}
                  className="relative z-10 w-full px-8 py-7 md:px-10 flex items-center justify-between text-left focus:outline-none cursor-pointer"
                >
                  <span className={`font-serif font-bold text-xl md:text-2xl transition-colors duration-300 pr-6 leading-snug ${isOpen ? 'text-[#F4703C]' : 'text-stone-900 group-hover:text-[#F4703C]'}`}>
                    {faq.question}
                  </span>
                  
                  {/* Premium Chevron Bubble */}
                  <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                    isOpen 
                      ? 'bg-gradient-to-r from-[#F4703C] to-[#E25C27] text-white shadow-[0_4px_12px_rgba(244,112,60,0.4)]' 
                      : 'bg-stone-50 border border-stone-200/60 text-stone-400 group-hover:bg-[#F4703C]/10 group-hover:text-[#F4703C] group-hover:border-transparent'
                  }`}>
                    <motion.svg 
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </motion.svg>
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="relative z-10"
                    >
                      <div className="px-8 md:px-10 pb-8 pt-2">
                        <div className="p-6 bg-stone-50/50 rounded-2xl border border-stone-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.01)]">
                          <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
