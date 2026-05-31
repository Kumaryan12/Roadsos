import { Link } from "react-router-dom";

function CitizenPortal() {
  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Citizen Portal</h1>
          <p>
            Choose whether you need help for yourself or want to report an
            accident for someone else.
          </p>
        </div>

        <Link to="/" className="small-link">
          Home
        </Link>
      </div>

      <div className="citizen-hero-card">
        <span className="citizen-badge">CITIZEN ACCESS</span>

        <h2>Emergency help starts from the citizen side</h2>

        <p>
          RoadSoS supports both accident victims and bystanders. If you are
          injured, use Personal Safety Mode. If you see someone else in an
          accident, use Bystander Report.
        </p>
      </div>

      <div className="portal-choice-grid">
        <Link to="/safety" className="portal-choice-card victim-choice">
          <div className="portal-choice-icon">🆘</div>

          <h2>I Need Help</h2>

          <p>
            Use this if you are the victim and need emergency help. Your saved
            RoadSoS profile, location, and condition summary will be sent to
            responders.
          </p>

          <div className="choice-points">
            <span>Saved medical profile</span>
            <span>Location-based SOS</span>
            <span>First-person emergency details</span>
          </div>
        </Link>

        <Link to="/report" className="portal-choice-card bystander-choice">
          <div className="portal-choice-icon">👥</div>

          <h2>Report Accident</h2>

          <p>
            Use this if you are a bystander. Submit accident location, vehicle
            number, approximate victim details, and visible severity conditions.
          </p>

          <div className="choice-points">
            <span>Vehicle-number-based identification</span>
            <span>Bystander accident report</span>
            <span>Responder dashboard alert</span>
          </div>
        </Link>
      </div>

      <div className="card">
        <h2>How RoadSoS uses citizen reports</h2>

        <div className="flow-row">
          <div>
            <strong>1. Citizen submits case</strong>
            <p>Victim SOS or bystander report is submitted with location.</p>
          </div>

          <div>
            <strong>2. Case reaches admin</strong>
            <p>Responder dashboard receives the case in real time.</p>
          </div>

          <div>
            <strong>3. Help is coordinated</strong>
            <p>Admin verifies, matches victim if needed, and assigns help.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CitizenPortal;