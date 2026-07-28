export const generatePackingList = (itinerary) => {
  const list = {
    Clothing: [],
    Documents: [],
    Electronics: [],
    Toiletries: [],
    ActivitySpecific: []
  };

  if (!itinerary || !itinerary.days || itinerary.days.length === 0) {
    return list;
  }

  // Calculate duration
  const duration = itinerary.days.length;
  
  // Baseline Clothing (scaled by duration)
  const shirts = Math.min(Math.ceil(duration * 1.2), 14); // Max 14
  const underwear = Math.min(Math.ceil(duration * 1.5), 14);
  const socks = Math.min(Math.ceil(duration * 1.5), 14);
  const pants = Math.min(Math.ceil(duration / 2.5) + 1, 5);
  const sleepwear = Math.min(Math.ceil(duration / 4) + 1, 3);
  
  list.Clothing.push(
    { id: 'c-1', text: `${shirts}x Shirts / Tops`, checked: false, generated: true },
    { id: 'c-2', text: `${underwear}x Underwear`, checked: false, generated: true },
    { id: 'c-3', text: `${socks}x Pairs of Socks`, checked: false, generated: true },
    { id: 'c-4', text: `${pants}x Pants / Shorts`, checked: false, generated: true },
    { id: 'c-5', text: `${sleepwear}x Sleepwear`, checked: false, generated: true },
    { id: 'c-6', text: 'Comfortable Walking Shoes', checked: false, generated: true },
    { id: 'c-7', text: 'Lightweight Jacket / Layer', checked: false, generated: true }
  );

  // Documents
  list.Documents.push(
    { id: 'd-1', text: 'Passport / ID', checked: false, generated: true },
    { id: 'd-2', text: 'Boarding Passes', checked: false, generated: true },
    { id: 'd-3', text: 'Travel Insurance Info', checked: false, generated: true },
    { id: 'd-4', text: 'Credit Cards & Cash', checked: false, generated: true }
  );

  // Electronics
  list.Electronics.push(
    { id: 'e-1', text: 'Smartphone & Charger', checked: false, generated: true },
    { id: 'e-2', text: 'Universal Power Adapter', checked: false, generated: true },
    { id: 'e-3', text: 'Power Bank', checked: false, generated: true },
    { id: 'e-4', text: 'Headphones / Earbuds', checked: false, generated: true }
  );

  // Toiletries
  list.Toiletries.push(
    { id: 't-1', text: 'Toothbrush & Toothpaste', checked: false, generated: true },
    { id: 't-2', text: 'Deodorant', checked: false, generated: true },
    { id: 't-3', text: 'Shampoo & Body Wash', checked: false, generated: true },
    { id: 't-4', text: 'Sunscreen (SPF 30+)', checked: false, generated: true },
    { id: 't-5', text: 'Basic First Aid & Meds', checked: false, generated: true }
  );

  // Activity-Specific logic
  const keywordsFound = new Set();
  
  // Basic climate inference (very rough, based on destination string if needed, but here we just look at activities)
  itinerary.days.forEach(day => {
    (day.activities || []).forEach(act => {
      const text = `${act.title || ''} ${act.description || ''} ${act.category || ''} ${act.type || ''}`.toLowerCase();
      
      if (text.includes('hike') || text.includes('trek') || text.includes('mountain') || text.includes('trail')) {
        keywordsFound.add('hiking');
      }
      if (text.includes('beach') || text.includes('swim') || text.includes('pool') || text.includes('boat') || text.includes('snorkeling')) {
        keywordsFound.add('water');
      }
      if (text.includes('dinner') || text.includes('fine dining') || text.includes('michelin') || text.includes('elegant') || text.includes('theatre') || text.includes('opera')) {
        keywordsFound.add('formal');
      }
      if (text.includes('snow') || text.includes('ski') || text.includes('glacier') || text.includes('winter')) {
        keywordsFound.add('cold');
      }
      if (text.includes('rain') || text.includes('monsoon') || text.includes('tropical')) {
        keywordsFound.add('rain');
      }
      if (text.includes('church') || text.includes('temple') || text.includes('mosque') || text.includes('vatican') || text.includes('shrine') || text.includes('cathedral')) {
         keywordsFound.add('modest');
      }
      if (text.includes('photography') || text.includes('photo') || text.includes('camera')) {
        keywordsFound.add('camera');
      }
    });
  });

  if (keywordsFound.has('hiking')) {
    list.ActivitySpecific.push({ id: 'a-1', text: 'Hiking Boots / Trail Shoes', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-2', text: 'Moisture-wicking layers', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-3', text: 'Daypack', checked: false, generated: true });
  }
  if (keywordsFound.has('water')) {
    list.ActivitySpecific.push({ id: 'a-4', text: 'Swimwear', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-5', text: 'Quick-dry towel', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-6', text: 'Waterproof phone pouch', checked: false, generated: true });
  }
  if (keywordsFound.has('formal')) {
    list.ActivitySpecific.push({ id: 'a-7', text: 'Formal Attire (Evening)', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-8', text: 'Dress Shoes', checked: false, generated: true });
  }
  if (keywordsFound.has('cold')) {
    list.ActivitySpecific.push({ id: 'a-9', text: 'Heavy Coat / Parka', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-10', text: 'Gloves, Beanie & Scarf', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-11', text: 'Thermal base layers', checked: false, generated: true });
  }
  if (keywordsFound.has('rain')) {
    list.ActivitySpecific.push({ id: 'a-12', text: 'Raincoat / Poncho', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-13', text: 'Travel Umbrella', checked: false, generated: true });
  }
  if (keywordsFound.has('modest')) {
    list.ActivitySpecific.push({ id: 'a-14', text: 'Scarf / Shawl (for covering shoulders)', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-15', text: 'Pants / Long skirt (for religious sites)', checked: false, generated: true });
  }
  if (keywordsFound.has('camera')) {
    list.ActivitySpecific.push({ id: 'a-16', text: 'Camera & Lenses', checked: false, generated: true });
    list.ActivitySpecific.push({ id: 'a-17', text: 'Extra SD Cards & Batteries', checked: false, generated: true });
  }
  
  return list;
};
