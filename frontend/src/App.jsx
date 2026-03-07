import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AlertButton from "./pages/AlertButton";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <nav className="nav">
        <span className="nav-brand">⬡ SafeSignal</span>
        <div className="nav-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/alert"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Alert
          </NavLink>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/alert" element={<AlertButton />} />
      </Routes>
    </BrowserRouter>
  );
}
