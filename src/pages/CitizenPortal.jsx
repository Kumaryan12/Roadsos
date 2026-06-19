import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

// --- Clean, Professional SVG Icons ---
const IconArrowLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"></line>
    <polyline points="12 19 5 12 12 5"></polyline>
  </svg>
);

const IconShieldAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M12 8v4"/>
    <path d="M12 16h.01"/>
  </svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

function CitizenPortal() {
  const { user, signOut } = useAuth();

  return (
    <div className="container" style={{ minHeight: '100vh', paddingTop: '3rem' }}>

      {/* Top Header & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Citizen Portal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px' }}>
            You are signed in with Google. Choose whether you need help for
            yourself or want to report an accident for someone else.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div className="admin-account-card">
            {user?.photoURL && (
              <img
                className="admin-avatar"
                src={user.photoURL}
                alt=""
                referrerPolicy="no-referrer"
              />
            )}
            <div>
              <span>Google Account</span>
              <strong>{user?.displayName || "RoadSoS Citizen"}</strong>
              <small>{user?.email}</small>
            </div>
          </div>

          <button className="danger-light-btn" onClick={signOut}>
            Sign Out
          </button>

          <Link to="/" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconArrowLeft /> Return Home
          </Link>
        </div>
      </div>

      {/* Hero Info Card */}
      <div className="card mb-3" style={{ borderLeft: '4px solid var(--color-navy)' }}>
        <span className="badge badge-navy" style={{ marginBottom: '1rem' }}>CITIZEN ACCESS</span>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Emergency help starts after verified citizen sign-in</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          RoadSoS supports both accident victims and bystanders. Your Google
          account identifies the portal session, while phone numbers remain
          useful for emergency contacts and responder callbacks.
        </p>
      </div>

      {/* Portal Choices Grid */}
      <div className="grid-2 mb-3">

        {/* Victim Choice (Red/Emergency) */}
        <Link
          to="/safety"
          className="card card-emergency"
          style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ marginBottom: '1.5rem', color: 'var(--color-red)', filter: 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.4))' }}>
            <IconShieldAlert />
          </div>

          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.75rem' }}>I Need Help</h2>

          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', flexGrow: 1 }}>
            Use this if you are the victim and need emergency help. Your saved
            RoadSoS profile, location, and condition summary will be sent to
            responders.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-red">Saved Medical Profile</span>
            <span className="badge badge-red">GPS SOS</span>
            <span className="badge badge-red">1st-Person Details</span>
          </div>
        </Link>

        {/* Bystander Choice (Amber/Warning) */}
        <Link
          to="/report"
          className="card"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '4px solid var(--color-amber)',
            background: 'linear-gradient(145deg, rgba(245, 158, 11, 0.1), rgba(30, 41, 59, 0.5))',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-glow-amber)';
            e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
            e.currentTarget.style.transform = 'translateY(-4px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{ marginBottom: '1.5rem', color: 'var(--color-amber)', filter: 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))' }}>
            <IconEye />
          </div>

          <h2 style={{ marginBottom: '0.75rem', fontSize: '1.75rem' }}>Report Accident</h2>

          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', flexGrow: 1 }}>
            Use this if you are a bystander. Submit accident location, vehicle
            number, approximate victim details, and visible severity conditions.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge badge-amber">Vehicle Identification</span>
            <span className="badge badge-amber">Bystander Report</span>
            <span className="badge badge-amber">Dashboard Alert</span>
          </div>
        </Link>

      </div>

      {/* How it Works Section */}
      <div className="card" style={{ background: 'rgba(30, 41, 59, 0.3)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', textAlign: 'center' }}>How RoadSoS processes citizen reports</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>

          <div style={{ padding: '1rem', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700' }}>STEP 01</div>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Citizen Submits Case</strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Victim SOS or bystander report is submitted with precise GPS coordinates.</p>
          </div>

          <div style={{ padding: '1rem', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700' }}>STEP 02</div>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Case Reaches Admin</strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>The responder command dashboard receives and highlights the case in real time.</p>
          </div>

          <div style={{ padding: '1rem', borderLeft: '2px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '700' }}>STEP 03</div>
            <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Help is Coordinated</strong>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Admin verifies the report, matches the victim if needed, and deploys emergency services.</p>
          </div>

        </div>
      </div>

    </div>
  );
}

export default CitizenPortal;
