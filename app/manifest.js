export default function manifest() {
  return {
    name: 'TripWise AI Travel Planner',
    short_name: 'TripWise',
    description: 'AI-powered travel planner with full offline itinerary, emergency info, and map access.',
    start_url: '/itinerary',
    display: 'standalone',
    background_color: '#FAF6F0',
    theme_color: '#FF6B2C',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
