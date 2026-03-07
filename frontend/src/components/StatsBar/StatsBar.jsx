import './StatsBar.css';

export default function StatsBar({ stats }) {
  return (
    <div className="stats-bar">
      <div className="stat-card urgent-stat">
        <div className="stat-value mono">{stats.urgent}</div>
        <div className="stat-label">CRITICAL</div>
        <div className="stat-desc mono">Requires Immediate Action</div>
      </div>
      
      <div className="stat-card med-stat">
        <div className="stat-value mono">{stats.med}</div>
        <div className="stat-label">ASSESSMENT NEEDED</div>
        <div className="stat-desc mono">Review Signal Integrity</div>
      </div>
      
      <div className="stat-card low-stat">
        <div className="stat-value mono">{stats.low}</div>
        <div className="stat-label">NON-URGENT</div>
        <div className="stat-desc mono">Environmental / Testing</div>
      </div>
      
      <div className="stat-card total-stat">
        <div className="stat-value mono">{stats.total}</div>
        <div className="stat-label">TOTAL ACTIVE</div>
        <div className="stat-desc mono">Cases in Queue</div>
      </div>
    </div>
  );
}
