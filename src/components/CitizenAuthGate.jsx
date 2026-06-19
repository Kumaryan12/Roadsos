import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function CitizenAuthGate({ children }) {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="admin-badge">CITIZEN ACCESS</span>
          <h1>Checking your RoadSoS session</h1>
          <p>Verifying your Google account before opening citizen services.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="admin-badge">CITIZEN ACCESS</span>
          <h1>Sign in to RoadSoS Citizen</h1>
          <p>
            Continue with Google first. After sign-in, choose whether you need
            help yourself or are reporting as a bystander.
          </p>

          <div className="auth-note">
            Phone numbers are still used for emergency contact and responder
            callbacks, but your Google account identifies the portal session.
          </div>

          <div className="auth-actions">
            <button className="primary-btn" onClick={signInWithGoogle}>
              Continue with Google
            </button>

            <Link to="/" className="secondary-btn">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

export default CitizenAuthGate;
