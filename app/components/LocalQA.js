'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOCK_THREADS = [
  {
    id: 1,
    destination: 'Kyoto',
    question: 'Are there any temples open late for evening photography that aren\'t overcrowded?',
    asker: 'lenscrafter9',
    timestamp: '2 hours ago',
    replies: [
      {
        id: 101,
        author: 'Kenji S.',
        isVerified: true,
        text: 'Yes! Check out Kodai-ji during their illumination events. Also, Yasaka Shrine is open 24/7 and the lanterns look incredible at night. Shoren-in is another hidden gem that stays quiet.'
      },
      {
        id: 102,
        author: 'travelbug22',
        isVerified: false,
        text: 'Fushimi Inari is open 24 hours too, but go really late to avoid the crowds.'
      }
    ]
  },
  {
    id: 2,
    destination: 'Rome',
    question: 'Where can I find the most authentic cacio e pepe away from the tourist traps?',
    asker: 'pasta_hunter',
    timestamp: '5 hours ago',
    replies: [
      {
        id: 201,
        author: 'Elena R.',
        isVerified: true,
        text: 'Head to Testaccio! Flavio al Velavevodetto is fantastic, but my personal favorite is Da Felice. You must book in advance though.'
      }
    ]
  },
  {
    id: 3,
    destination: 'Patagonia',
    question: 'Do I need to book campsites in Torres del Paine months in advance for the W Trek?',
    asker: 'hiker_dan',
    timestamp: '1 day ago',
    replies: [
      {
        id: 301,
        author: 'Sam Rivera',
        isVerified: true,
        text: 'Absolutely. The CONAF, Fantastico Sur, and Vertice sites fill up up to 6 months in advance for the high season (Dec-Feb). Do not arrive without reservations.'
      },
      {
        id: 302,
        author: 'mountaingirl',
        isVerified: false,
        text: 'Can confirm. I had to change my entire trip last year because I waited too long to book.'
      }
    ]
  }
];

export default function LocalQA() {
  const [expandedId, setExpandedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
        <div>
          <h2 className="text-[#F4703C] font-mono font-bold text-xs uppercase tracking-[0.2em] mb-3">
            Local Q&A
          </h2>
          <h3 className="text-3xl font-serif font-bold text-stone-900 mb-2 leading-tight">
            Ask a Local Expert
          </h3>
          <p className="text-stone-500 text-sm">Get real answers from verified locals.</p>
        </div>
        
        {/* Premium Outline Button with Fill Hover */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative px-7 py-3.5 bg-white text-[#F4703C] hover:text-white font-extrabold text-xs font-mono uppercase tracking-[0.15em] rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(244,112,60,0.3)] transition-all duration-500 overflow-hidden border border-[#F4703C]/30 hover:border-transparent hover:-translate-y-0.5"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#F4703C] to-[#E25C27] translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
          <span className="relative z-10 flex items-center gap-2">
            Ask a Question
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </span>
        </button>
      </div>

      {/* Thread List */}
      <div className="flex flex-col space-y-6">
        {MOCK_THREADS.map(thread => {
          const isExpanded = expandedId === thread.id;
          return (
            <div key={thread.id} className="group/card relative bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(244,112,60,0.15)] hover:-translate-y-1.5 transition-all duration-500 border border-white overflow-hidden">
              
              {/* Subtle hover gradient behind card */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#F4703C]/0 via-transparent to-[#F4703C]/0 group-hover/card:from-[#F4703C]/5 group-hover/card:to-transparent transition-colors duration-500 pointer-events-none" />
              
              {/* Question Row */}
              <div 
                onClick={() => toggleExpand(thread.id)}
                className="relative z-10 p-6 md:p-8 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-grow pr-4">
                  <div className="flex items-center gap-3 mb-4">
                    {/* Glowing Destination Pill */}
                    <div className="inline-flex items-center gap-1.5 bg-white shadow-sm border border-stone-100 text-stone-600 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest group-hover/card:border-[#F4703C]/30 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#F4703C] animate-pulse" />
                      {thread.destination}
                    </div>
                    <span className="text-stone-400 text-xs font-mono">
                      Asked by <span className="text-stone-500 font-bold">@{thread.asker}</span> &middot; {thread.timestamp}
                    </span>
                  </div>
                  <h4 className="text-xl md:text-2xl font-serif font-bold text-stone-900 group-hover/card:text-[#F4703C] transition-colors duration-300 leading-snug">
                    {thread.question}
                  </h4>
                </div>
                
                <div className="flex items-center gap-4 text-stone-400 shrink-0 group-hover/card:text-stone-600 transition-colors">
                  {/* Interactive Reply Bubble */}
                  <div className="flex items-center gap-1.5 font-mono text-sm font-bold bg-stone-50 group-hover/card:bg-[#F4703C]/10 group-hover/card:text-[#F4703C] px-4 py-2 rounded-full transition-colors duration-300">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover/card:-scale-x-100 transition-transform duration-300">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {thread.replies.length}
                  </div>
                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </motion.div>
                </div>
              </div>

              {/* Answers Area */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-stone-50 border-t border-stone-100"
                  >
                    <div className="p-6 md:p-8 pl-12 md:pl-16 space-y-6">
                      {thread.replies.map((reply, index) => (
                        <div key={reply.id} className="relative group/reply">
                          {/* Top connector for the very first reply to connect to the question */}
                          {index === 0 && (
                            <div className="absolute left-[-28px] md:left-[-32px] top-[-24px] md:top-[-32px] h-[40px] md:h-[48px] w-px bg-stone-200" />
                          )}

                          {/* Thread connector line going down */}
                          <div className={`absolute left-[-28px] md:left-[-32px] top-8 w-px ${index === thread.replies.length - 1 ? 'bottom-[-24px] bg-stone-200' : 'bottom-[-40px] bg-stone-200'}`} />
                          
                          {/* Avatar connector curve */}
                          <div className="absolute left-[-28px] md:left-[-32px] top-4 w-6 md:w-8 h-4 border-l border-b border-stone-200 rounded-bl-xl" />
                          
                          <div className="flex items-start gap-3 md:gap-4">
                            {/* Author Avatar */}
                            <div className="relative shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-stone-200 to-stone-300 flex items-center justify-center text-stone-600 font-bold font-serif text-sm border-2 border-white shadow-sm z-10 group-hover/reply:shadow-md transition-shadow">
                              {reply.author.charAt(0)}
                            </div>
                            
                            {/* Message Bubble */}
                            <div className="flex-grow bg-white border border-stone-100 p-4 md:p-5 rounded-2xl rounded-tl-sm shadow-[0_2px_10px_rgba(0,0,0,0.02)] group-hover/reply:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-300">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                                <span className="font-bold text-sm text-stone-900">{reply.author}</span>
                                {reply.isVerified && (
                                  <span className="bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest shadow-sm">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                    Verified Local
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-600 text-sm md:text-base leading-relaxed">
                                {reply.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="relative pt-2">
                        {/* Connector to reply input */}
                        <div className="absolute left-[-28px] md:left-[-32px] top-0 h-1/2 w-px bg-stone-200" />
                        <div className="absolute left-[-28px] md:left-[-32px] top-1/2 w-6 md:w-8 h-px border-b border-stone-200" />
                        
                        <div className="flex items-center gap-3 md:gap-4">
                          {/* User Avatar Placeholder */}
                          <div className="shrink-0 w-8 h-8 rounded-full bg-stone-100 border-2 border-white border-dashed shadow-sm flex items-center justify-center z-10">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          </div>
                          
                          {/* Real Input Field */}
                          <div className="flex-grow relative flex items-center group/input">
                            <input 
                              type="text" 
                              placeholder="Write a reply..." 
                              className="w-full bg-white border border-stone-200 pl-5 pr-12 py-3 text-sm text-stone-900 placeholder-stone-400 rounded-full hover:border-[#F4703C]/40 hover:shadow-sm focus:border-[#F4703C] focus:ring-1 focus:ring-[#F4703C] focus:shadow-md transition-all outline-none font-sans"
                            />
                            <button className="absolute right-1.5 w-8 h-8 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-[#F4703C] hover:text-white transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F4703C] focus:ring-offset-1">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[1px] translate-y-[1px]">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Ask a Question Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-lg"
            >
              <h2 className="text-2xl font-serif font-bold text-stone-900 mb-6">Ask the Community</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Destination</label>
                  <select className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F4703C] focus:ring-1 focus:ring-[#F4703C]/20 transition-all">
                    <option>Select a destination...</option>
                    <option>Kyoto</option>
                    <option>Rome</option>
                    <option>Patagonia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-widest text-stone-500 mb-2">Your Question</label>
                  <textarea 
                    rows={4}
                    placeholder="e.g. What are the best hidden cafes in..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F4703C] focus:ring-1 focus:ring-[#F4703C]/20 transition-all resize-none"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-stone-500 hover:text-stone-700 text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-[#F4703C] hover:bg-[#E25C27] text-white font-bold text-sm rounded-full shadow-sm transition-all"
                  >
                    Post Question
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
