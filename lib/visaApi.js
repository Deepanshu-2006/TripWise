/**
 * Visa Requirements Mock API
 * 
 * IMPORTANT: In a production environment, this should be replaced with a real
 * data provider like Sherpa, VisaHQ, or Timatic.
 * NEVER use an LLM to guess visa requirements as it presents a severe legal/safety risk.
 */

const mockDatabase = {
  // US Passport Holders
  'US': {
    'Japan': {
      required: 'Not Required',
      details: 'Visa-free entry for tourism up to 90 days.',
      processingTime: null,
      passportValidity: 'Must be valid for the duration of stay.',
      proofOfOnwardTravel: true,
      minimumFunds: null,
      embassyLink: 'https://jp.usembassy.gov/',
    },
    'Rome': {
      required: 'ETIAS (Coming Soon)',
      details: 'Starting mid-2025, US citizens will need an ETIAS for short-term stays in the Schengen Area (Italy).',
      processingTime: 'Usually within minutes',
      passportValidity: 'Must be valid for at least 3 months beyond your planned date of departure from the Schengen area.',
      proofOfOnwardTravel: true,
      minimumFunds: 'Sufficient means of subsistence',
      embassyLink: 'https://it.usembassy.gov/',
    },
    'France': {
      required: 'ETIAS (Coming Soon)',
      details: 'Starting mid-2025, US citizens will need an ETIAS for short-term stays in the Schengen Area.',
      processingTime: 'Usually within minutes',
      passportValidity: 'Must be valid for at least 3 months beyond your planned date of departure from the Schengen area.',
      proofOfOnwardTravel: true,
      minimumFunds: 'Sufficient means of subsistence',
      embassyLink: 'https://fr.usembassy.gov/',
    },
    'China': {
      required: 'Required',
      details: 'A valid visa is required before arrival. Tourist (L) visas are typically issued for 10 years.',
      processingTime: '4-5 business days',
      passportValidity: 'Must be valid for at least 6 months with at least two blank visa pages.',
      proofOfOnwardTravel: true,
      minimumFunds: 'Not strictly defined for tourists, but hotel bookings required.',
      embassyLink: 'http://us.china-embassy.gov.cn/',
    }
  },
  // Indian Passport Holders
  'IN': {
    'UAE': {
      required: 'E-Visa Available',
      details: 'Indian nationals can apply for a pre-arranged e-visa or get a visa on arrival if they hold a valid US visa or Green Card.',
      processingTime: '3-5 business days for standard e-visa',
      passportValidity: 'Must be valid for at least 6 months from the date of entry.',
      proofOfOnwardTravel: true,
      minimumFunds: null,
      embassyLink: 'https://www.uae-embassy.org/embassy/india',
    },
    'Japan': {
      required: 'Required',
      details: 'Indian citizens require a tourist visa to enter Japan.',
      processingTime: '5-7 business days',
      passportValidity: 'Must be valid for the duration of stay.',
      proofOfOnwardTravel: true,
      minimumFunds: 'Bank statements required for the last 6 months.',
      embassyLink: 'https://www.in.emb-japan.go.jp/',
    },
    'Rome': {
      required: 'Schengen Visa Required',
      details: 'Indian citizens must apply for a Schengen Visa (Type C) for short stays up to 90 days in Italy.',
      processingTime: '15-30 calendar days',
      passportValidity: 'Must be valid for at least 3 months beyond the departure date from the Schengen Area.',
      proofOfOnwardTravel: true,
      minimumFunds: 'Proof of sufficient funds required (approx. €30/day).',
      embassyLink: 'https://ambnewdelhi.esteri.it/en/',
    }
  },
  // UK Passport Holders
  'GB': {
    'USA': {
      required: 'ESTA (Electronic System for Travel Authorization)',
      details: 'UK citizens can travel to the US under the Visa Waiver Program with an approved ESTA.',
      processingTime: 'Usually within 72 hours',
      passportValidity: 'Must be valid for at least 6 months beyond the period of intended stay (exemptions apply to UK passports).',
      proofOfOnwardTravel: true,
      minimumFunds: null,
      embassyLink: 'https://uk.usembassy.gov/',
    },
    'Rome': {
      required: 'ETIAS (Coming Soon)',
      details: 'Starting mid-2025, UK citizens will need an ETIAS for short-term stays in the Schengen Area (Italy).',
      processingTime: 'Usually within minutes',
      passportValidity: 'Must be valid for at least 3 months beyond your planned date of departure from the Schengen area.',
      proofOfOnwardTravel: true,
      minimumFunds: 'Sufficient means of subsistence',
      embassyLink: 'https://www.gov.uk/foreign-travel-advice/italy',
    }
  }
};

/**
 * Fetches visa requirements for a given nationality and destination.
 * 
 * @param {string} nationalityCode - ISO 2-letter country code (e.g., 'US', 'IN')
 * @param {string} destinationName - Name of the destination country
 * @returns {Promise<Object>} Visa requirements data
 */
export async function fetchVisaRequirements(nationalityCode, destinationName) {
  // Simulate network latency (500ms - 1500ms)
  const delay = Math.floor(Math.random() * 1000) + 500;
  await new Promise(resolve => setTimeout(resolve, delay));

  if (!nationalityCode || !destinationName) {
    throw new Error('Nationality and destination are required.');
  }

  // Find exact match or partial match in our mock DB
  const upperNat = nationalityCode.toUpperCase();
  const natData = mockDatabase[upperNat];
  
  if (!natData) {
    return { coverage: false };
  }

  // Try to find a matching destination key (case-insensitive, substring match for robustness)
  const destKey = Object.keys(natData).find(
    k => destinationName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(destinationName.toLowerCase())
  );

  if (!destKey) {
    return { coverage: false };
  }

  return {
    coverage: true,
    data: natData[destKey]
  };
}
