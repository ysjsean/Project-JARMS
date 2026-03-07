import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchInitialAlerts,
  selectAlert,
  closeDetail,
} from "../store/alertsSlice";
import Header from "../components/Header/Header";
import StatsBar from "../components/StatsBar/StatsBar";
import AlertList from "../components/AlertList/AlertList";
import AlertDetail from "../components/AlertDetail/AlertDetail";

export default function Dashboard() {
  const dispatch = useDispatch();
  const {
    items: alerts,
    selectedAlertId,
    status,
    currentUser,
  } = useSelector((state) => state.alerts);

  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (status === "idle" && currentUser) {
      dispatch(fetchInitialAlerts());
    }
  }, [status, dispatch, currentUser]);

  // Define tier priority order for sorting
  const TIER_PRIORITY = {
    life_threatening: 0,
    emergency: 1,
    requires_review: 2,
    minor_emergency: 3,
    non_emergency: 4,
  };

  // Sort alerts based on urgency classification and percentage
  const sortedAlerts = [...alerts].sort((a, b) => {
    const priorityA = TIER_PRIORITY[a.tier] ?? 99;
    const priorityB = TIER_PRIORITY[b.tier] ?? 99;

    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Secondary sort: queue_score (descending)
    return (b.queue_score || 0) - (a.queue_score || 0);
  });

  // Aggregate stats based on active (non-resolved) alerts
  const activeAlerts = alerts.filter(a => a.actionState !== 'resolved');
  const stats = {
    urgent: activeAlerts.filter((a) => a.tier === "life_threatening" || a.tier === "emergency").length,
    med: activeAlerts.filter((a) => a.tier === "requires_review").length,
    low: activeAlerts.filter((a) => a.tier === "minor_emergency" || a.tier === "non_emergency").length,
    total: activeAlerts.length,
  };

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-color)]">
      {/* Header */}
      <div className="flex-none border-b border-[var(--panel-border)]">
        <Header />
      </div>

      {/* Stats */}
      <div className="flex-none border-b border-[var(--panel-border)]">
        <StatsBar stats={stats} />
      </div>

      {/* Main Content Area: Split dynamically based on selection */}
      <div className="flex flex-1 overflow-hidden">
        {/* Alert List Container (grows) */}
        <div
          className={`flex flex-col ${selectedAlertId ? "w-full lg:w-[calc(100%-400px)] lg:border-r border-[var(--panel-border)]" : "w-full"} overflow-hidden transition-all duration-300`}
        >
          <AlertList
            alerts={sortedAlerts}
            selectedAlertId={selectedAlertId}
            onSelectAlert={(id) => dispatch(selectAlert(id))}
          />
        </div>

        {/* Alert Detail Side Panel (fixed width on desktop, overlays/slides on mobile ideally) */}
        {selectedAlertId && (
          <div className="w-[400px] flex-none bg-[var(--panel-bg)] overflow-y-auto hidden lg:block border-l border-[var(--panel-border)] animate-slideIn">
            <AlertDetail
              alert={selectedAlert}
              onClose={() => dispatch(closeDetail())}
            />
          </div>
        )}
      </div>
    </div>
  );
}
