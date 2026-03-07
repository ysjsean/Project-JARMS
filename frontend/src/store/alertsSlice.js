import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const generatePastDate = (secondsAgo) => {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return d.toISOString();
};

const dummyData = [
  {
    id: '207',
    tier: 'med',
    source: 'audio',
    keywords: ['silence'],
    languages: ['Mandarin'],
    location: 'Blk 838 #8-24, Tampines',
    coordinates: '1.3711°N, 103.8451°E',
    pitch: 31,
    timeAgo: 10,
    timestamp: generatePastDate(10),
    actionState: 'new', // new, claimed, dispatched, resolved
    metadata: {
      mlSource: 'Audio ML detection',
      pitchScoreDetail: 'Pitch score = ML model confidence based on audio volume, frequency spikes, and speech pattern vs background noise ratio.',
      dialectDetected: 'Mandarin',
      falsePositiveAnalysis: {
        extraClicks: { passed: true, desc: 'Single press - not filtered' },
        backgroundNoise: { passed: true, desc: 'Clear audio channel' },
        silentAudio: { passed: false, desc: 'Flagged - no vocal input, may be incapacitated' }
      }
    }
  },
  {
    id: '156',
    tier: 'urgent',
    source: 'audio',
    keywords: ['வலிக்குது'], // Tamil for "it hurts"
    languages: ['Tamil'],
    location: 'Blk 102 #11-20, Bedok',
    coordinates: '1.3236°N, 103.9273°E',
    pitch: 80,
    timeAgo: 40,
    timestamp: generatePastDate(40),
    actionState: 'new',
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
    coordinates: '1.3404°N, 103.6968°E',
    pitch: 10,
    timeAgo: 60,
    timestamp: generatePastDate(60),
    actionState: 'claimed'
  },
  {
    id: '154',
    tier: 'urgent',
    source: 'btn',
    keywords: ['救命'], // Chinese for "help"
    languages: ['Hakka', 'Tamil'],
    location: 'Blk 046 #10-90, Bishan',
    coordinates: '1.3526°N, 103.8352°E',
    pitch: 85,
    timeAgo: 125,
    timestamp: generatePastDate(125),
    actionState: 'dispatched'
  }
];

// Async thunk to simulate fetching initial alerts from a dummy API
export const fetchInitialAlerts = createAsyncThunk(
  'alerts/fetchInitial',
  async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(dummyData);
      }, 1000); // simulate 1s network latency
    });
  }
);

const alertsSlice = createSlice({
  name: 'alerts',
  initialState: {
    items: [],
    selectedAlertId: null,
    status: 'idle', // idle, loading, succeeded, failed
    currentUser: { id: 'A1', name: 'Agent Priya' }, // simulated logged-in agent
  },
  reducers: {
    addAlert: (state, action) => {
      state.items.unshift(action.payload);
      // Ensure we don't have too many fake items, trim to last 30
      if (state.items.length > 30) {
        state.items.pop();
      }
    },
    selectAlert: (state, action) => {
      // Toggle selection: if clicking the same one, deselect it
      if (state.selectedAlertId === action.payload) {
        state.selectedAlertId = null;
      } else {
        state.selectedAlertId = action.payload;
      }
    },
    closeDetail: (state) => {
      state.selectedAlertId = null;
    },
    advanceAlertState: (state, action) => {
      const { id, agent } = action.payload;
      const alert = state.items.find(a => a.id === id);
      
      if (alert) {
        if (!alert.actionHistory) alert.actionHistory = [];

        const now = new Date().toISOString();
        
        if (alert.actionState === 'new') {
          alert.actionState = 'claimed';
        } else if (alert.actionState === 'claimed') {
          alert.actionState = 'dispatched';
        } else if (alert.actionState === 'dispatched') {
          alert.actionState = 'resolved';
        }

        alert.actionHistory.push({
          state: alert.actionState,
          agentId: agent.id,
          agentName: agent.name,
          timestamp: now
        });
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInitialAlerts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchInitialAlerts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchInitialAlerts.rejected, (state) => {
        state.status = 'failed';
      });
  }
});

export const { addAlert, selectAlert, closeDetail, advanceAlertState } = alertsSlice.actions;
export default alertsSlice.reducer;
