/**
 * useAlerts.js
 * 
 * NOTE: This hook is deprecated as the primary data source.
 * All alert data is fetched from the backend API and managed by Redux (alertsSlice.js).
 * Real-time updates are handled by useAlertWebSocket.js.
 * 
 * Kept as a stub for any legacy components that may still import it.
 */
export default function useAlerts() {
  return { alerts: [], stats: { urgent: 0, med: 0, low: 0, total: 0 } };
}
