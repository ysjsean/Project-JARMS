import './StatsBar.css';

export default function StatsBar({ stats }) {
  return (
    <div className="stats-bar">
      <div className="stat-card urgent-stat">
        <div className="stat-value mono">{stats.urgent}</div>
        <div className="stat-label">URGENT (True Positive)</div>
        <div className="stat-desc mono">Auto-deploy triggered</div>
      </div>
      
      <div className="stat-card med-stat">
        <div className="stat-value mono">{stats.med}</div>
        <div className="stat-label">MED (False Negative)</div>
        <div className="stat-desc mono">Silent / no keyword</div>
      </div>
      
      <div className="stat-card low-stat">
        <div className="stat-value mono">{stats.low}</div>
        <div className="stat-label">LOW (Negative)</div>
        <div className="stat-desc mono">BG noise / extra clicks</div>
      </div>
      
      <div className="stat-card total-stat">
        <div className="stat-value mono">{stats.total}</div>
        <div className="stat-label">TOTAL ACTIVE</div>
        <div className="stat-desc mono">All unresolved</div>
      </div>
    </div>
  );
}
