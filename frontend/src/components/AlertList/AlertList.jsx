import { Mic, CircleDot } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { advanceAlertState } from '../../store/alertsSlice';
import './AlertList.css';

export default function AlertList({ alerts, selectedAlertId, onSelectAlert }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.alerts.currentUser);
  
  const renderPill = (text, type, idx) => {
    let className = 'pill ';
    if (type === 'keyword') {
      className += text.match(/[\u0B80-\u0BFF\u4E00-\u9FFF]/) ? 'pill-keyword-foreign ' : 'pill-keyword ';
    } else {
      className += 'pill-lang ';
    }

    return (
      <span key={idx} className={className}>
        {text}
      </span>
    );
  };

  const getSourceIcon = (source) => {
    if (source === 'audio') return <Mic size={14} className="icon-source icon-mic" />;
    return <CircleDot size={14} className="icon-source icon-btn" />;
  };

  return (
    <div className="alert-list-container">
      <div className="alert-list-header mono">
        <div>TIER</div>
        <div>SOURCE</div>
        <div>KEYWORDS | LANGUAGES</div>
        <div>LOCATION</div>
        <div>PITCH</div>
        <div>TIME</div>
        <div style={{ textAlign: 'right' }}>ACTION</div>
      </div>

      <div className="alert-list-body">
        {alerts.map((alert) => {
          const isSelected = alert.id === selectedAlertId;
          const rowClass = `alert-row tier-${alert.tier} ${isSelected ? 'selected' : ''}`;
          
          return (
            <div 
              key={alert.id} 
              className={rowClass}
              onClick={() => onSelectAlert(alert.id)}
            >
              {/* Tier Column */}
              <div className="cell-tier flex-center">
                <span className={`badge badge-${alert.tier}`}>
                  {alert.tier.toUpperCase()}
                </span>
                {alert.tier === 'urgent' && <div className="pulse-dot"></div>}
              </div>

              {/* Source Column */}
              <div className="cell-source flex-center-col">
                {getSourceIcon(alert.source)}
                <span className="source-text">{alert.source === 'btn' ? 'hq noise' : 'silence'}</span>
              </div>

              {/* Keywords & Languages Column */}
              <div className="cell-keywords">
                <div className="pill-container">
                  {alert.keywords.map((kw, i) => renderPill(`"${kw}"`, 'keyword', i))}
                  {alert.languages.map((lang, i) => renderPill(lang, 'language', i))}
                </div>
              </div>

              {/* Location Column */}
              <div className="cell-location">
                <span className="location-text">{alert.location}</span>
              </div>

              {/* Pitch Column */}
              <div className="cell-pitch flex-center-col">
                <div className="pitch-value mono">{alert.pitch}% urgent</div>
                <div className="pitch-bar-container">
                  <div className={`pitch-bar fill-${alert.tier}`} style={{ width: `${alert.pitch}%` }}></div>
                </div>
              </div>

              {/* Time Column */}
              <div className="cell-time flex-center">
                <span className="time-text mono">{alert.timeAgo}s ago</span>
              </div>

              {/* Action Column */}
              <div className="cell-action flex-center">
                <div className="action-wrapper">
                  <button 
                    className={`btn-action mono state-${alert.actionState || 'new'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (alert.actionState !== 'resolved') {
                        dispatch(advanceAlertState({ id: alert.id, agent: currentUser }));
                      }
                    }}
                  >
                    {alert.actionState === 'new' || !alert.actionState ? 'CLAIM' 
                     : alert.actionState === 'claimed' ? 'DISPATCH'
                     : alert.actionState === 'dispatched' ? 'RESOLVE'
                     : 'CLOSED'}
                  </button>
                  <div className="action-dots">
                    <span className={`dot ${alert.actionState === 'new' || !alert.actionState ? 'dot-active' : ''}`}></span>
                    <span className={`dot ${alert.actionState === 'claimed' ? 'dot-active' : ''}`}></span>
                    <span className={`dot ${alert.actionState === 'dispatched' ? 'dot-active' : ''}`}></span>
                    <span className={`dot ${alert.actionState === 'resolved' ? 'dot-active' : ''}`}></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
