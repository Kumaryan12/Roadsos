import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home-page">
      <div className="hero-card">
        <div className="brand-pill">RoadSoS Emergency Platform</div>

        <h1>RoadSoS</h1>

        <p className="tagline">
          Golden-hour emergency response for road accidents.
        </p>

        <p className="hero-description">
          RoadSoS connects accident victims, bystanders, and responders through
          location-based SOS, vehicle-based victim matching, medical ID, and a
          live admin dashboard.
        </p>

        <div className="mode-grid">
          <Link to="/safety" className="mode-card red-mode">
            <div className="mode-icon">🛡️</div>
            <h2>Personal Safety Mode</h2>
            <p>
              Create your RoadSoS profile, register vehicles, and send emergency
              help requests.
            </p>
          </Link>

          <Link to="/report" className="mode-card yellow-mode">
            <div className="mode-icon">🚨</div>
            <h2>Report Accident</h2>
            <p>
              For bystanders who witness an accident and want to alert responders
              quickly.
            </p>
          </Link>

          <Link to="/admin" className="mode-card dark-mode">
            <div className="mode-icon">📡</div>
            <h2>Responder Dashboard</h2>
            <p>
              Monitor incoming SOS cases, identify victims, and coordinate help.
            </p>
          </Link>
        </div>

        <div className="feature-strip">
          <span>📍 GPS SOS</span>
          <span>🚗 Vehicle Matching</span>
          <span>🏥 Nearby Hospitals</span>
          <span>👨‍👩‍👧 Emergency Contacts</span>
          <span>📊 Live Case Tracking</span>
        </div>
      </div>
    </div>
  );
}

export default Home;