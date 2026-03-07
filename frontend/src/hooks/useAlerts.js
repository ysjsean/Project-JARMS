import { useState, useEffect } from 'react';

const INITIAL_ALERTS = [
  {
    id: '156',
    tier: 'urgent',
    source: 'audio',
    keywords: ['வலிக்குது'], // Tamil for "it hurts"
    languages: ['Tamil'],
    location: 'Blk 102 #11-20, Bedok',
    pitch: 80,
    timeAgo: 40,
    actionState: 'unclaimed', // unclaimed, claimed
    metadata: {
      mlSource: 'Audio ML detection',
      pitchScoreDetail: 'Pitch score = ML model confidence based on audio volume, frequency spikes, and speech pattern vs background noise ratio.',
      dialectDetected: 'Tamil',
      falsePositiveAnalysis: {
        extraClicks: { passed: true, desc: 'Single press - not filtered' },
        backgroundNoise: { passed: true, desc: 'Clear audio channel' },
        silentAudio: { passed: true, desc: 'Audio present' }
      }
    }
  },
  {
    id: '155',
    tier: 'low',
    source: 'btn',
    keywords: ['background'],
    languages: ['Hokkien'],
    location: 'Blk 967 #13-76, Jurong West',
    pitch: 10,
    timeAgo: 1,
    actionState: 'unclaimed'
  },
  {
    id: '154',
    tier: 'urgent',
    source: 'btn',
    keywords: ['救命'], // Chinese for "help"
    languages: ['Hakka', 'Tamil'],
    location: 'Blk 046 #10-90, Bishan',
    pitch: 85,
    timeAgo: 8,
    actionState: 'unclaimed'
  },
  {
    id: '153',
    tier: 'low',
    source: 'btn',
    keywords: ['background'],
    languages: ['Malay', 'Mandarin'],
    location: 'Blk 144 #2-21, Woodlands',
    pitch: 5,
    timeAgo: 17,
    actionState: 'unclaimed'
  },
  {
    id: '152',
    tier: 'med',
    source: 'audio',
    keywords: ['silence'],
    languages: ['Teochew'],
    location: 'Blk 044 #20-55, Clementi',
    pitch: 20,
    timeAgo: 25,
    actionState: 'unclaimed'
  }
];

export default function useAlerts() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  
  // Calculate stats
  const stats = {
    urgent: alerts.filter(a => a.tier === 'urgent').length,
    med: alerts.filter(a => a.tier === 'med').length,
    low: alerts.filter(a => a.tier === 'low').length,
    total: alerts.length
  };

  return { alerts, stats };
}
