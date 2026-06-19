import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function AdminAuthGate({ children }) {
  const {
    user,
    loading,
    isAdmin,
    adminRestricted,
    signInWithGoogle,
    signOut
  } = useAuth();

  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="admin-badge">AUTH CHECK</span>
          <h1>Checking responder access</h1>
          <p>Verifying your Google session before opening the control room.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="admin-badge">RESPONDER ACCESS</span>
          <h1>Sign in to RoadSoS Admin</h1>
          <p>
            Use Google authentication to access live SOS cases, registered
            profiles, victim matching, and AI case briefs.
          </p>

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

  if (!isAdmin) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <span className="severity-pill critical">ACCESS DENIED</span>
          <h1>Responder access is restricted</h1>
          <p>
            You are signed in as <strong>{user.email}</strong>, but this account
            is not on the admin allowlist.
          </p>

          <div className="auth-note">
            {adminRestricted
              ? "Add this email to VITE_ADMIN_EMAILS if this responder should have access."
              : "Configure VITE_ADMIN_EMAILS to restrict access to approved responders."}
          </div>

          <div className="auth-actions">
            <button className="danger-light-btn" onClick={signOut}>
              Sign Out
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

export default AdminAuthGate;
