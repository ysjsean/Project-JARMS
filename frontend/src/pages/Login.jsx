import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)]">
      <div className="w-full max-w-md p-8 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
           <div className="w-16 h-16 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#ffb80033] to-[#ff2b3b33] border border-[#ffb8004d] shadow-[0_0_20px_rgba(255,43,59,0.1)] mb-4">
            <Shield size={32} color="#ffb800" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest text-white">GUARDIAN WATCH</h1>
          <span className="text-xs text-[var(--text-secondary)] tracking-widest uppercase font-mono mt-1">Operator Portal</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Agent ID</label>
            <input 
              type="text" 
              defaultValue="PRIYA_07"
              className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--panel-border)] rounded-lg text-white font-mono focus:outline-none focus:border-[var(--color-med)] transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Security Key</label>
            <input 
              type="password" 
              defaultValue="********"
              className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--panel-border)] rounded-lg text-white font-mono focus:outline-none focus:border-[var(--color-med)] transition-colors"
            />
          </div>
          <button 
            type="submit"
            className="w-full py-3 px-4 bg-[var(--color-med)] hover:bg-[#e6a600] text-black font-bold rounded-lg tracking-wider transition-colors shadow-[0_0_15px_rgba(255,184,0,0.3)]"
          >
            ENTER SYSTEM
          </button>
        </form>
      </div>
    </div>
  );
}
