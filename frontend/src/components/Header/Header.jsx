import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/alertsSlice';
import './Header.css';

export default function Header() {
  const [time, setTime] = useState(new Date());
  const [dbOnline, setDbOnline] = useState(null); // null = checking
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const alerts = useSelector((state) => state.alerts.items);
  const currentUser = useSelector((state) => state.alerts.currentUser);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Ping backend to check connectivity
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/cases/`, { signal: AbortSignal.timeout(5000) });
        setDbOnline(res.ok);
      } catch {
        setDbOnline(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // re-check every 30s
    return () => clearInterval(interval);
  }, []);

  const urgentCount = alerts.filter(a => 
    (a.tier === 'life_threatening' || a.tier === 'emergency') && 
    a.actionState !== 'resolved'
  ).length;

  const timeString = time.toLocaleTimeString('en-US', { hour12: false });
  const dateString = time.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo-icon">
          <Shield size={24} color="#ffb800" />
        </div>
        <div className="brand">
          <h1>GUARDIAN WATCH</h1>
          <span className="subtitle mono">ELDERLY ALERT SYSTEM</span>
        </div>
      </div>

      <div className="header-center flex flex-col items-center gap-2">
        <div className="global-status">
          <span className="status-dot"></span>
          <span className="mono">{urgentCount} URGENT ACTIVE</span>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest opacity-70 mt-1">
          <div className={`w-1.5 h-1.5 rounded-full ${
            dbOnline === null ? 'bg-gray-400 animate-pulse' 
            : dbOnline ? 'bg-[#10b981] animate-pulse' 
            : 'bg-red-500'
          }`} />
          <span className={dbOnline === null ? 'text-gray-400' : dbOnline ? 'text-[#10b981]' : 'text-red-400'}>
            {dbOnline === null ? 'CHECKING...' : dbOnline ? 'DATABASE : ONLINE' : 'DATABASE : OFFLINE'}
          </span>
        </div>
      </div>

      <div className="header-right">
        <div className="agent-info">
          <span className="agent-name">{currentUser?.username || 'Guest Agent'}</span>
          <div className="clock mono">
            {timeString} <span className="date">· {dateString}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="ml-6 p-2 rounded-full border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[#ff2b3b] hover:border-[#ff2b3b] hover:bg-[#ff2b3b]/10 transition-all bg-[var(--panel-bg)] hover:shadow-[0_0_15px_rgba(255,43,59,0.3)]"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
