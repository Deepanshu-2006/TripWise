import React from 'react';
import Header from '../components/Header';
import CommunityFeed from '../components/CommunityFeed';
import LocalQA from '../components/LocalQA';
import HiddenGemsWall from '../components/HiddenGemsWall';
import TopContributors from '../components/TopContributors';
import EmptyCommunityState from '../components/EmptyCommunityState';
import CommunityFAQ from '../components/CommunityFAQ';
import CommunityCTA from '../components/CommunityCTA';

export default function CommunityPage() {
  return (
    <div className="bg-[#FDFBF7] min-h-screen">
      <Header isLightPage={true} />
      
      {/* Spacer to account for fixed header */}
      <div className="pt-24 md:pt-32" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        
        {/* 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-12 relative">
          
          {/* Main Content Column */}
          <div className="w-full lg:w-2/3 flex flex-col space-y-24">
            <section>
              <CommunityFeed />
            </section>
            
            <section>
              <LocalQA />
            </section>

            <section>
              <HiddenGemsWall />
            </section>
            
            <section>
              <CommunityFAQ />
            </section>
          </div>

          {/* Sidebar Column */}
          <div className="w-full lg:w-1/3 relative">
            {/* The TopContributors component itself has 'sticky top-[100px]' */}
            <TopContributors />
          </div>
        </div>

        {/* Empty State Demo (Kept for reference as requested initially) */}
        <section className="py-24 border-t border-stone-200 mt-24">
          <div className="text-center mb-8">
            <span className="bg-stone-100 text-stone-500 border border-stone-200 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
              Demo: Empty State View
            </span>
          </div>
          <div className="max-w-4xl mx-auto">
            <EmptyCommunityState />
          </div>
        </section>
        
      </main>

      {/* Community Specific Footer Sections */}
      <CommunityCTA />
    </div>
  );
}
