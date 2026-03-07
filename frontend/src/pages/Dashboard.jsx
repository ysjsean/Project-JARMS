import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  } = useSelector((state) => state.alerts);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchInitialAlerts());
    }
  }, [status, dispatch]);

  // Aggregate stats based on current alerts
  const stats = {
    urgent: alerts.filter((a) => a.tier === "urgent").length,
    med: alerts.filter((a) => a.tier === "med").length,
    low: alerts.filter((a) => a.tier === "low").length,
    total: alerts.length,
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
            alerts={alerts}
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
