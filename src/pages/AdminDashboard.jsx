import { Link } from "react-router-dom";

function AdminDashboard() {
  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Responder Dashboard</h1>
          <p>
            Monitor SOS cases, match victims, view nearby services, and update
            response status.
          </p>
        </div>

        <Link to="/" className="small-link">
          Home
        </Link>
      </div>

      <div className="card">
        <h2>Phase 4 coming here</h2>
        <p>
          This dashboard will show live SOS cases, trigger type labels, matching
          victim profiles, recommended actions, and case status updates.
        </p>
      </div>
    </div>
  );
}

export default AdminDashboard;