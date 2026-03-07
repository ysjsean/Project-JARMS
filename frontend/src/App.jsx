import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AlertButton from "./pages/AlertButton";

export default function App() {
  return (
    <BrowserRouter>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F8FAFC; }

        .nav {
          position: sticky; top: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          height: 56px; padding: 0 28px;
          background: #ffffff;
          border-bottom: 1px solid #E5E7EB;
          font-family: 'DM Mono', monospace;
        }

        .nav-brand {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; font-weight: 500;
          letter-spacing: 0.12em; color: #111827;
        }

        .nav-brand-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: linear-gradient(135deg, #F59E0B, #EF4444);
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
        }

        .nav-brand-sub {
          font-size: 9px; color: #9CA3AF;
          letter-spacing: 0.1em; display: block; margin-top: 1px;
        }

        .nav-links {
          display: flex; gap: 4px;
        }

        .nav-link {
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.07em; color: #6B7280;
          text-decoration: none;
          padding: 6px 14px; border-radius: 6px;
          transition: background 0.15s, color 0.15s;
        }

        .nav-link:hover {
          background: #F3F4F6; color: #111827;
        }

        .nav-link.active {
          background: #111827; color: #ffffff;
        }

        .nav-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 10px; font-weight: 700; letter-spacing: 0.06em;
          color: #DC2626;
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: 20px; padding: 4px 12px;
        }

        .nav-status-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #DC2626;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      <nav className="nav">
        <div className="nav-brand">
          <div className="nav-brand-icon">🛡</div>
          <div>
            GUARDIAN WATCH
            <span className="nav-brand-sub">ELDERLY ALERT SYSTEM</span>
          </div>
        </div>

        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            DASHBOARD
          </NavLink>
          <NavLink
            to="/alert"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            ALERT
          </NavLink>
        </div>

        <div className="nav-status">
          <div className="nav-status-dot" />7 URGENT ACTIVE
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alert" element={<AlertButton />} />
      </Routes>
    </BrowserRouter>
  );
}
