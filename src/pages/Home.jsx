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
          RoadSoS connects citizens and responders through location-based SOS,
          bystander accident reporting, vehicle-number-based victim matching,
          medical profiles, and live case tracking.
        </p>

        <div className="two-layer-grid">
          <Link to="/citizen" className="layer-card citizen-layer">
            <div className="layer-icon">👥</div>

            <h2>Citizen Portal</h2>

            <p>
              For victims and bystanders. Create a safety profile, send SOS, or
              report an accident for someone else.
            </p>

            <div className="layer-subfeatures">
              <span>Victim SOS</span>
              <span>Bystander Report</span>
              <span>Vehicle Details</span>
            </div>
          </Link>

          <Link to="/admin" className="layer-card admin-layer">
            <div className="layer-icon">📡</div>

            <h2>Admin / Responder Portal</h2>

            <p>
              For responders and authorities. View incoming SOS cases, match
              victims, check severity, and assign emergency help.
            </p>

            <div className="layer-subfeatures">
              <span>Live Cases</span>
              <span>Victim Matching</span>
              <span>Status Tracking</span>
            </div>
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