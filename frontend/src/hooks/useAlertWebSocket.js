import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setAlerts, mapCase } from '../store/alertsSlice';
import { supabase } from '../services/supabaseClient';

/**
 * Custom hook managing live alert data via Supabase Realtime + Backend API.
 * Supabase is used strictly as an event emitter — all data comes from the REST API.
 * No mock/simulated data is used.
 * 
 * Includes:
 * - Error handling and logging for subscription failures
 * - Automatic reconnection on subscription drop
 * - Polling fallback (every 5 seconds) if realtime fails
 * - Proper cleanup on unmount
 */
export default function useAlertWebSocket() {
  const dispatch = useDispatch();
  const channelRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const pollingTimeoutRef = useRef(null);
  const isUnmountedRef = useRef(false);
  const isSubscribedRef = useRef(false);
  const lastFetchRef = useRef(0);

  const fetchActiveCases = async () => {
    try {
      const now = Date.now();
      // Debounce rapid fetches (max once per 500ms)
      if (now - lastFetchRef.current < 500) {
        return;
      }
      lastFetchRef.current = now;

      console.log('[useAlertWebSocket] Re-fetching from Backend API...');
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/cases/`);
      if (!response.ok) throw new Error(`API fetch failed: ${response.status}`);

      const data = await response.json();
      const mappedData = (data.items || []).map(mapCase);
      dispatch(setAlerts(mappedData));
      console.log('[useAlertWebSocket] Successfully fetched and updated', mappedData.length, 'cases');
    } catch (err) {
      console.error('[useAlertWebSocket] Failed to fetch cases:', err);
    }
  };

  const startPollingFallback = () => {
    if (isUnmountedRef.current) return;
    
    console.log('[useAlertWebSocket] Starting polling fallback (every 5 seconds)...');
    const poll = () => {
      if (!isUnmountedRef.current) {
        fetchActiveCases();
        pollingTimeoutRef.current = setTimeout(poll, 5000);
      }
    };
    pollingTimeoutRef.current = setTimeout(poll, 5000);
  };

  const stopPollingFallback = () => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  };

  const setupSubscription = () => {
    if (!supabase) {
      console.warn('[useAlertWebSocket] Supabase not configured. Using polling fallback.');
      startPollingFallback();
      return;
    }

    if (isUnmountedRef.current) {
      console.log('[useAlertWebSocket] Component unmounted, skipping subscription setup.');
      return;
    }

    console.log('[useAlertWebSocket] Setting up Supabase realtime subscription...');

    // Create a new channel for listening to cases table changes
    const channel = supabase
      .channel('public-cases-changes', {
        config: {
          broadcast: { self: true },
          presence: { key: 'cases' },
        },
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'cases' },
        (payload) => {
          console.log('[useAlertWebSocket] New case inserted:', payload.new.case_id);
          fetchActiveCases();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cases' },
        (payload) => {
          console.log('[useAlertWebSocket] Case updated:', payload.new.case_id);
          fetchActiveCases();
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'cases' },
        (payload) => {
          console.log('[useAlertWebSocket] Case deleted:', payload.old.case_id);
          fetchActiveCases();
        }
      )
      .subscribe((status) => {
        console.log('[useAlertWebSocket] Subscription status:', status);
        if (status === 'CLOSED') {
          console.warn('[useAlertWebSocket] Subscription closed, attempting to reconnect...');
          isSubscribedRef.current = false;
          // Attempt reconnection after 3 seconds
          if (!isUnmountedRef.current) {
            retryTimeoutRef.current = setTimeout(setupSubscription, 3000);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useAlertWebSocket] Channel error, reconnecting...');
          isSubscribedRef.current = false;
          // Start polling as fallback
          startPollingFallback();
          if (!isUnmountedRef.current) {
            retryTimeoutRef.current = setTimeout(setupSubscription, 3000);
          }
        } else if (status === 'SUBSCRIBED') {
          console.log('[useAlertWebSocket] ✓ Successfully subscribed to cases table');
          isSubscribedRef.current = true;
          // Stop polling when realtime is working
          stopPollingFallback();
        }
      });

    channelRef.current = channel;
  };

  useEffect(() => {
    isUnmountedRef.current = false;
    isSubscribedRef.current = false;

    // Initial data load
    fetchActiveCases();

    // Setup subscription
    setupSubscription();

    return () => {
      isUnmountedRef.current = true;
      
      // Clear any pending retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      // Stop polling fallback
      stopPollingFallback();

      // Unsubscribe from channel
      if (supabase && channelRef.current) {
        console.log('[useAlertWebSocket] Cleaning up subscription...');
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [dispatch]);
}
