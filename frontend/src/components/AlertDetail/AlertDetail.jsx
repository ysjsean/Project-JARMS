import { useState, useRef, useEffect } from 'react';
import { X, CheckSquare, Square, Mic, Volume2, Play, Pause, HeartPulse, ShieldAlert, Phone, Building2, BellRing, MapPin } from 'lucide-react';
import './AlertDetail.css';

export default function AlertDetail({ alert, onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef(null);

  // Reset audio state when alert changes
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [alert?.id]);

  if (!alert) return null;

  const isUrgent = alert.tier === 'urgent';
  const headerClass = `detail-header tier-${alert.tier}`;

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      setProgress((current / duration) * 100 || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="alert-detail h-full flex flex-col">
      <div className={headerClass}>
        <div className="detail-header-content">
          <span className="alert-id mono">ALERT #{alert.id}</span>
          <h2 className="alert-title">{alert.tier.toUpperCase()} ALERT</h2>
        </div>
        <button className="btn-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="detail-content flex-1 overflow-y-auto">
        {/* Audio Player Section (Now unconditional) */}
        <section className="detail-section p-4 bg-black/40 rounded-xl border border-[var(--panel-border)] mb-4">
          <h3 className="section-title mono !border-none !pb-0 !mb-4">AUDIO PLAYBACK</h3>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[var(--color-active)] flex items-center justify-center text-black hover:bg-white transition-colors flex-shrink-0"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            
            <div className="flex-1">
              <div className="h-2 bg-[var(--panel-border)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--color-active)] transition-all duration-100 ease-linear"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-[var(--text-secondary)] mono">
                <span>{isPlaying ? 'PLAYING...' : 'READY'}</span>
                <span>{alert.timeAgo}s REC</span>
              </div>
            </div>
          </div>
          <audio 
            ref={audioRef}
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            className="hidden"
          />
        </section>

        {/* Signal Intelligence Section */}
        <section className="detail-section">
          <h3 className="section-title mono">SIGNAL INTELLIGENCE</h3>
          
          <div className="info-row">
            <span className="info-label">Trigger Source</span>
            <span className="info-value highlight-red">
              {alert.source === 'audio' ? <Mic size={14} className="inline-icon" /> : ''} 
              {alert.metadata?.mlSource || 'Hardware Button'}
            </span>
          </div>
          
          <div className="info-row" style={{ marginTop: '12px' }}>
            <span className="info-label">Keyword Detected</span>
            <span className="info-value highlight-red" style={{ fontSize: '18px' }}>
              {alert.keywords ? `"${alert.keywords.join(', ')}"` : 'None'}
            </span>
          </div>

          <div className="pitch-score-container">
            <div className="pitch-score-header">
              <span className="info-label">Audio Pitch Score</span>
              <div className="pitch-bars flex-center">
                {[...Array(15)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`audio-bar ${isPlaying ? 'animate-pulse' : ''}`} 
                    style={{ 
                      height: `${Math.max(10, Math.random() * (alert.pitch || 50))}px`,
                      backgroundColor: isUrgent ? 'var(--color-urgent)' : 'var(--color-med)'
                    }} 
                  />
                ))}
                <span className="mono highlight-red" style={{ marginLeft: '12px' }}>{alert.pitch || 0}%</span>
              </div>
            </div>
            <p className="helper-text">{alert.metadata?.pitchScoreDetail || 'Pitch score based on volume and frequency.'}</p>
          </div>
        </section>

        {/* Language Section */}
        <section className="detail-section">
          <h3 className="section-title mono">LANGUAGE / DIALECT DETECTED</h3>
          <div className="pill pill-lang large-pill">
            {alert.metadata?.dialectDetected || alert.languages?.[0] || 'Unknown'}
          </div>
          <p className="helper-text" style={{ marginTop: '12px' }}>
            Multi-dialect NLP model covers: English, Mandarin, Hokkien, Cantonese, Malay, Tamil, Teochew, Hakka.<br/>
            Dialect detection improves keyword recall for elderly who may not use standard English or Mandarin in distress.
          </p>
        </section>

        {/* False Positive Section */}
        <section className="detail-section">
          <h3 className="section-title mono">FALSE POSITIVE ANALYSIS</h3>
          
          <div className="checklist">
            {['extraClicks', 'backgroundNoise', 'silentAudio'].map(key => {
              const item = alert.metadata?.falsePositiveAnalysis?.[key];
              if (!item) return null;
              
              const passed = item.passed;
              const title = key === 'extraClicks' ? 'Extra button clicks' 
                          : key === 'backgroundNoise' ? 'Background noise only'
                          : 'Silent Audio (false neg)';
              
              return (
                <div key={key} className="check-item">
                  <div className="check-icon">
                    {passed ? <CheckSquare size={18} color="#10b981" /> : (key === 'silentAudio' && !passed ? <span className="text-[#ffb800] text-lg leading-none mt-[-4px]">⚠️</span> : <Square size={18} color="#666" />)}
                  </div>
                  <div className="check-content">
                    <div className={passed ? "check-title check-passed" : (key === 'silentAudio' && !passed ? "check-title text-[#ffb800]" : "check-title")}>{title}</div>
                    <div className="check-desc">{item.desc || 'Passed filter'}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="helper-text" style={{ marginTop: '16px' }}>
            Button sensor uses 300ms debounce to suppress accidental presses. Audio sensor filters ambient noise below 45dB baseline.
          </p>
        </section>

        {/* Beneficiary Profile Section (NEW PHASE 5) */}
        {alert.beneficiary && (
          <section className="detail-section mb-4">
            <h3 className="section-title mono flex items-center justify-between">
              <span>BENEFICIARY PROFILE</span>
              <span className="text-[10px] bg-[#333] px-2 py-0.5 rounded text-[var(--color-med)]">PAB DB Match</span>
            </h3>
            
            <div className="bg-[#111] p-3 rounded-lg border border-[#333]">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold text-lg">{alert.beneficiary.full_name}</div>
                  <div className="text-xs text-[var(--text-secondary)] font-mono">NRIC: {alert.beneficiary.nric} • Age {alert.beneficiary.age}</div>
                </div>
                {alert.beneficiary.DNR_status === 'ACTIVE' && (
                  <div className="bg-red-900/30 text-[var(--color-urgent)] border border-[var(--color-urgent)] px-2 py-1 rounded text-xs font-bold animate-pulse">
                    DNR ACTIVE
                  </div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs border-b border-[#222] pb-1">
                  <span className="text-[var(--text-secondary)] font-mono">Primary Language</span>
                  <span>{alert.beneficiary.primary_language}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-[#222] pb-1">
                  <span className="text-[var(--text-secondary)] font-mono">Phone</span>
                  <span className="text-[var(--color-med)]">{alert.beneficiary.phone_number}</span>
                </div>
                <div className="flex justify-between text-xs border-b border-[#222] pb-1">
                  <span className="text-[var(--text-secondary)] font-mono">Emergency Contact</span>
                  <span className="text-[var(--color-med)]">{alert.beneficiary.emergency_contact_name} ({alert.beneficiary.emergency_contact})</span>
                </div>
                <div className="flex justify-between text-xs border-b border-[#222] pb-1">
                  <span className="text-[var(--text-secondary)] font-mono">Primary Hospital</span>
                  <span>{alert.beneficiary.primary_hospital} (Ward {alert.beneficiary.insurance_ward_class})</span>
                </div>
              </div>

              <div className="mt-4 p-2 bg-[#1a1a1a] rounded border border-[#222]">
                <div className="text-[10px] text-[var(--text-secondary)] font-mono mb-1 uppercase tracking-wider flex items-center gap-1">
                  <HeartPulse size={12} /> Medical Summary
                </div>
                <p className="text-sm leading-relaxed text-[#eee]">
                  {alert.beneficiary.patient_medical_summary}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* AI Action Outreach Orchestrator (NEW PHASE 5) */}
        <section className="detail-section mb-4">
          <h3 className="section-title mono flex items-center justify-between">
            <span>AI ORCHESTRATOR</span>
            <span className="text-[10px] bg-[#10b981]/20 px-2 py-0.5 rounded text-[#10b981] border border-[#10b981]/50">Policy Applied</span>
          </h3>
          
          <div className="text-xs text-[var(--text-secondary)] mb-3">
             Recommended actions dynamically generated for human confirmation based on beneficiary matrix:
          </div>
          
          <div className="grid gap-2">
            <div className="p-3 bg-black/40 border border-[#333] rounded hover:border-[var(--color-med)] cursor-pointer transition-colors flex items-center gap-3">
               <ShieldAlert size={18} className="text-[#a855f7]" />
               <div className="flex flex-col flex-1">
                 <span className="text-sm font-bold">Insurance Agent Override</span>
                 <span className="text-[10px] text-[var(--text-secondary)]">Ping registered agent.</span>
               </div>
            </div>
            
            <div className="p-3 bg-black/40 border border-[var(--color-urgent)]/50 rounded hover:border-[var(--color-urgent)] cursor-pointer transition-colors flex items-center gap-3">
               <Phone size={18} className="text-[var(--color-urgent)]" />
               <div className="flex flex-col flex-1">
                 <span className="text-sm font-bold">Family / Emergency Contact</span>
                 <span className="text-[10px] text-[var(--text-secondary)]">Auto-dial {alert.beneficiary?.emergency_contact_name || 'NOK'}</span>
               </div>
            </div>

            <div className="p-3 bg-black/40 border border-[#333] rounded hover:border-[var(--color-med)] cursor-pointer transition-colors flex items-center gap-3">
               <MapPin size={18} className="text-[#3b82f6]" />
               <div className="flex flex-col flex-1">
                 <span className="text-sm font-bold flex gap-2">SecureSG Volunteers <span className="bg-[#3b82f6]/20 px-1 rounded text-[#3b82f6] text-[9px]">3 Nearby</span></span>
                 <span className="text-[10px] text-[var(--text-secondary)]">Filtered by: Location • First-Aid Skillset • {alert.beneficiary?.primary_language || 'English'}</span>
               </div>
            </div>

            <div className="p-3 bg-black/40 border border-[#333] rounded hover:border-[var(--color-med)] cursor-pointer transition-colors flex items-center gap-3">
               <Building2 size={18} className="text-[#10b981]" />
               <div className="flex flex-col flex-1">
                 <span className="text-sm font-bold">Ambulance Services</span>
                 <span className="text-[10px] text-[var(--text-secondary)]">Route: {alert.beneficiary?.primary_hospital || 'Public'} • Capacity OK • Ward {alert.beneficiary?.insurance_ward_class || 'C'}</span>
               </div>
            </div>

            <div className="p-3 bg-black/40 border border-[#333] rounded hover:border-[var(--color-med)] cursor-pointer transition-colors flex items-center gap-3">
               <BellRing size={18} className="text-[#f59e0b]" />
               <div className="flex flex-col flex-1">
                 <span className="text-sm font-bold">LifeSG & Lift Lobby Notification</span>
                 <span className="text-[10px] text-[var(--text-secondary)]">Broadcast SOS to immediate block lobby screens.</span>
               </div>
            </div>
          </div>
        </section>

        {/* Location & Time */}
        <section className="detail-section">
          <h3 className="section-title mono">LOCATION & TIME</h3>
          <div className="w-full text-xs text-[var(--text-secondary)]">
            <div className="flex justify-between py-3 border-b border-[var(--panel-border)]">
              <span>Address</span>
              <span className="text-[var(--text-primary)] font-mono">{alert.location}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-[var(--panel-border)]">
              <span>Coordinates</span>
              <span className="text-[var(--text-primary)] font-mono">{alert.coordinates || 'Unknown'}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-[var(--panel-border)]">
              <span>Alert Time</span>
              <span className="text-[var(--text-primary)] font-mono">
                {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }).toLowerCase() : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between py-3 border-b border-[var(--panel-border)]">
              <span>Date</span>
              <span className="text-[var(--text-primary)] font-mono">
                {alert.timestamp ? new Date(alert.timestamp).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Unknown'}
              </span>
            </div>
          </div>
        </section>

        {/* Responder Action Section */}
        <section className="detail-section">
          <h3 className="section-title mono">RESPONDER ACTION</h3>
          <div className="flex flex-col gap-2">
            <span className="text-[var(--color-med)] font-mono text-xs font-bold flex items-center gap-2">
              ⏳ Awaiting agent verification.
            </span>
            <span className="text-[#ffb800] text-xs font-mono font-bold leading-relaxed">
              {isUrgent ? 'Auto-deploy protocol active - Dispatch immediately.' : 'No auto-deploy - silent alert requires manual callback.'}
            </span>
            <span className="text-[#ffb800] text-xs font-mono font-bold">
              Recommend: call resident's phone or next-of-kin.
            </span>
          </div>
        </section>

        {/* Agent Actions Container */}
        <section className="detail-section mb-12">
           <h3 className="section-title mono">AGENT ACTIONS</h3>
           
           <ActionController alert={alert} />

        </section>
      </div>
    </div>
  );
}

// Sub-component for Action Controller to keep it clean
import { useDispatch, useSelector } from 'react-redux';
import { advanceAlertState } from '../../store/alertsSlice';
import { Truck, CheckCircle2, UserCheck, PlusCircle } from 'lucide-react';

function ActionController({ alert }) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.alerts.currentUser);
  
  const steps = [
    { key: 'new', label: 'New', icon: PlusCircle, activeColor: 'var(--color-med)' },
    { key: 'claimed', label: 'Claimed', icon: UserCheck, activeColor: '#a855f7' },
    { key: 'dispatched', label: 'Dispatched', icon: Truck, activeColor: 'var(--color-urgent)' },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle2, activeColor: '#10b981' }
  ];

  const currentIndex = steps.findIndex(s => s.key === (alert.actionState || 'new'));
  
  const handleAdvance = () => {
    dispatch(advanceAlertState({ id: alert.id, agent: currentUser }));
  };

  const getButtonProps = () => {
    switch(alert.actionState || 'new') {
      case 'new': return { text: 'CLAIM ALERT', classes: 'border-2 border-[var(--color-med)] text-[var(--color-med)] hover:bg-[var(--color-med-dim)] hover:scale-[1.02] shadow-[0_0_15px_rgba(255,184,0,0.15)] bg-black/50' };
      case 'claimed': return { text: 'DISPATCH UNIT', classes: 'bg-[var(--color-urgent)] text-white hover:bg-red-600 border border-transparent hover:scale-[1.02] shadow-[0_0_15px_rgba(255,51,102,0.3)]' };
      case 'dispatched': return { text: 'RESOLVE CASE', classes: 'bg-[#10b981] text-white hover:bg-green-600 border border-transparent hover:scale-[1.02] shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
      case 'resolved': return { text: 'CASE CLOSED', classes: 'bg-[var(--panel-border)] text-[var(--text-secondary)] opacity-50 cursor-not-allowed border border-transparent', disabled: true };
      default: return { text: 'CLAIM ALERT', classes: 'border-2 border-[var(--color-med)] text-[var(--color-med)]' };
    }
  };

  const btn = getButtonProps();

  return (
    <div className="flex flex-col gap-8 w-full">
      <button 
        onClick={handleAdvance}
        disabled={btn.disabled}
        className={`w-full py-4 px-6 rounded-lg font-mono font-bold tracking-widest text-sm transition-all duration-200 uppercase ${btn.classes}`}
      >
        {btn.text}
      </button>

      {/* Progress Tracker */}
      <div className="relative flex items-center justify-between w-full max-w-[300px] mt-4">
        {/* Connecting Lines */}
        <div className="absolute top-4 left-0 w-full h-[1px] bg-[var(--panel-border)] -z-10" />
        
        {steps.map((step, idx) => {
          const isCompleted = currentIndex >= idx;
          const isCurrent = currentIndex === idx;
          const Icon = step.icon;
          
          // Look for history logs that match the exact state (so if this is the "claimed" step, look for "claimed" log)
          const historyEntry = alert.actionHistory?.find(h => h.state === step.key);

          return (
            <div key={step.key} className="flex flex-col items-center gap-2 bg-[var(--panel-bg)] z-10 w-16 relative">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted ? 'border-transparent' : 'border-[#333]'}`}
                style={{ backgroundColor: isCompleted ? step.activeColor : 'var(--bg-color)' }}
              >
                <Icon size={14} color={isCompleted ? '#000' : '#666'} strokeWidth={isCurrent ? 3 : 2} />
              </div>
              <span className={`text-[9px] font-mono tracking-wider ${isCurrent ? 'text-white' : 'text-[#666]'}`}>
                {step.label}
              </span>
              
              {/* Agent History Tag (Shown if this step has been completed) */}
              {historyEntry && (
                <div className="absolute top-14 flex flex-col items-center mt-2 w-[120px]">
                   <span className="text-[9px] text-[var(--color-med)] font-mono whitespace-nowrap">{historyEntry.agentName || historyEntry.agentId}</span>
                   <span className="text-[8px] text-[var(--text-secondary)] font-mono whitespace-nowrap">
                     {new Date(historyEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                   </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
