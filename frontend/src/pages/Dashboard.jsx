import { Link } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  return (
    <main className="home">
      <div className="home-grid-bg" aria-hidden />
      <div className="home-content">
        <p className="home-eyebrow">Personal Safety System</p>
        <h1 className="home-title">SafeSignal</h1>
        <p className="home-desc">
          One tap. Instant audio capture.
          <br />
          Your voice, transmitted in seconds.
        </p>
        <Link to="/alert" className="home-cta">
          Go to Alert Panel →
        </Link>
      </div>
    </main>
  );
}
