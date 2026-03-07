import { useState, useEffect } from 'react';
import { Shield, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setOperator } from '../store/alertsSlice';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [operators, setOperators] = useState([]);
  const [selectedOp, setSelectedOp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOps = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
        const res = await fetch(`${backendUrl}/cases/operators`);
        const data = await res.json();
        setOperators(data.operators || []);
        if (data.operators?.length > 0) {
          setSelectedOp(data.operators[0]);
        }
      } catch (err) {
        console.error('Failed to fetch operators:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOps();
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (selectedOp) {
      dispatch(setOperator(selectedOp));
      navigate('/dashboard');
    }
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
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Select Operator Account</label>
            <div className="relative">
              <select 
                value={selectedOp?.operator_id || ''}
                onChange={(e) => {
                  const op = operators.find(o => o.operator_id === e.target.value);
                  setSelectedOp(op);
                }}
                className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--panel-border)] rounded-lg text-white font-mono focus:outline-none focus:border-[var(--color-med)] transition-colors appearance-none cursor-pointer"
              >
                {loading ? (
                  <option>Loading operators...</option>
                ) : (
                  operators.map(op => (
                    <option key={op.operator_id} value={op.operator_id}>
                      {op.username} ({op.role})
                    </option>
                  ))
                )}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Security Key</label>
            <input 
              type="password" 
              placeholder="ENTER SYSTEM KEY"
              className="w-full px-4 py-3 bg-[var(--bg-color)] border border-[var(--panel-border)] rounded-lg text-white font-mono focus:outline-none focus:border-[var(--color-med)] transition-colors"
            />
            <p className="text-[10px] text-[var(--text-secondary)] mt-2 opacity-50 italic">* No password required for dev stage.</p>
          </div>
          <button 
            type="submit"
            disabled={!selectedOp || loading}
            className="w-full py-3 px-4 bg-[var(--color-med)] hover:bg-[#e6a600] text-black font-bold rounded-lg tracking-wider transition-all shadow-[0_0_15px_rgba(255,184,0,0.3)] hover:shadow-[0_0_25px_rgba(255,184,0,0.6)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'INITIALIZING...' : 'ENTER SYSTEM'}
          </button>
        </form>
      </div>
    </div>
  );
}
