import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, LogOut } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import './Header.css';

export default function Header() {
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString('en-US', { hour12: false });
  const dateString = time.toLocaleDateString('en-US', { 
    weekday: 'short', 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });

  const handleLogout = () => {
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

      <div className="header-center flex flex-col items-center">
        <div className="global-status mb-1">
          <span className="status-dot"></span>
          <span className="mono">10 URGENT ACTIVE</span>
        </div>
        
        {/* Connection Status Indicator */}
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest mt-1 opacity-70">
           <div className={`w-1.5 h-1.5 rounded-full ${supabase ? 'bg-[#10b981] animate-pulse' : 'bg-[#ffb800]'}`} />
           <span className={supabase ? 'text-[#10b981]' : 'text-[#ffb800]'}>
             {supabase ? 'SUPABASE REALTIME : CONNECTED' : 'LOCAL MOCK : OFFLINE'}
           </span>
        </div>
      </div>

      <div className="header-right">
        <div className="agent-info">
          <span className="agent-name">Agent Priya</span>
          <div className="clock mono">
            {timeString} <span className="date">· {dateString}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="ml-6 p-2 rounded-full border border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-white hover:border-white transition-colors bg-[var(--panel-bg)]"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
