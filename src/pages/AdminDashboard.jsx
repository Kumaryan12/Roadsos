import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { db } from "../firebase";

import SOSCard from "../components/SOSCard";

function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [cases, setCases] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("cases");

  useEffect(() => {
    const q = query(collection(db, "sos_cases"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveCases = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));

      setCases(liveCases);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "registered_users"), (snapshot) => {
      const users = snapshot.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data()
      }));

      setRegisteredUsers(users);
    });

    return () => unsubscribe();
  }, []);

  const updateCaseStatus = async (caseId, newStatus) => {
    try {
      await updateDoc(doc(db, "sos_cases", caseId), {
        status: newStatus,
        lastUpdatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(error);
      alert("Failed to update case status.");
    }
  };

  const confirmVictimMatch = async (caseId, matchedVictim) => {
    try {
      await updateDoc(doc(db, "sos_cases", caseId), {
        matchedVictim,
        victimIdentityStatus: "MATCH_CONFIRMED",
        confidenceLevel: "HIGH",
        status: "Verified",
        emergencyContactNotified: true,
        lastUpdatedAt: new Date().toISOString()
      });

      alert("Victim match confirmed and case marked as verified.");
    } catch (error) {
      console.error(error);
      alert("Failed to confirm victim match.");
    }
  };

  const newCases = cases.filter((item) => item.status === "New");
  const needsVerificationCases = cases.filter(
    (item) => item.status === "Needs Verification"
  );
  const verifiedCases = cases.filter((item) => item.status === "Verified");
  const helpAssignedCases = cases.filter(
    (item) => item.status === "Help Assigned"
  );
  const resolvedCases = cases.filter((item) => item.status === "Resolved");
  const criticalCases = cases.filter((item) => item.severity === "Critical");
  const bystanderCases = cases.filter(
    (item) => item.triggerType === "BYSTANDER_REPORT"
  );

  const renderCases = () => {
    if (cases.length === 0) {
      return (
        <div className="card">
          <h2>No SOS cases yet</h2>
          <p>
            Create a manual victim SOS or bystander report to test the dashboard.
          </p>
        </div>
      );
    }

    return (
      <div className="case-list">
        {cases.map((sosCase) => (
          <SOSCard
            key={sosCase.id}
            sosCase={sosCase}
            onStatusUpdate={updateCaseStatus}
            onConfirmVictimMatch={confirmVictimMatch}
          />
        ))}
      </div>
    );
  };

  const renderRegisteredUsers = () => {
    if (registeredUsers.length === 0) {
      return (
        <div className="card">
          <h2>No registered users yet</h2>
          <p>
            Create and save a RoadSoS profile from the Citizen Portal to see it
            here.
          </p>
        </div>
      );
    }

    return (
      <div className="registered-users-grid">
        {registeredUsers.map((user) => (
          <div className="registered-user-card" key={user.id}>
            <div className="registered-user-header">
              <div>
                <span className="case-id">User ID: {user.id}</span>
                <h2>{user.name}</h2>
              </div>

              <span className="user-status-chip">
                {user.profileStatus || "ACTIVE"}
              </span>
            </div>

            <div className="profile-detail-grid">
              <div>
                <span>RoadSoS ID</span>
                <strong>{user.roadSosId || "Not available"}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{user.phone || "Not available"}</strong>
              </div>

              <div>
                <span>Google Account</span>
                <strong>{user.googleEmail || "Not available"}</strong>
              </div>

              <div>
                <span>Age / Gender</span>
                <strong>
                  {user.age || "?"} / {user.gender || "Not available"}
                </strong>
              </div>

              <div>
                <span>Blood Group</span>
                <strong>{user.bloodGroup || "Not available"}</strong>
              </div>

              <div>
                <span>Emergency Contact</span>
                <strong>{user.emergencyContact || "Not available"}</strong>
              </div>

              <div>
                <span>Vehicle Keys</span>
                <strong>
                  {user.vehicleNumbersNormalized &&
                  user.vehicleNumbersNormalized.length > 0
                    ? user.vehicleNumbersNormalized.join(", ")
                    : "Not available"}
                </strong>
              </div>

              <div>
                <span>Medical Conditions</span>
                <strong>{user.medicalConditions || "None provided"}</strong>
              </div>

              <div>
                <span>Allergies</span>
                <strong>{user.allergies || "None provided"}</strong>
              </div>
            </div>

            <div className="vehicles-database-box">
              <h3>Registered Vehicles</h3>

              {user.vehicles && user.vehicles.length > 0 ? (
                user.vehicles.map((vehicle, index) => (
                  <div className="vehicle-db-row" key={index}>
                    <strong>{vehicle.vehicleNumber}</strong>
                    <span>{vehicle.vehicleType}</span>
                    <span>{vehicle.vehicleName || "No model name"}</span>
                    {vehicle.primary && <span className="primary-chip">Primary</span>}
                  </div>
                ))
              ) : (
                <p className="muted-text">No vehicles registered.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Responder Dashboard</h1>
          <p>
            Monitor incoming SOS cases, verify bystander reports, match victims,
            and coordinate emergency help.
          </p>
        </div>

        <div className="admin-account-card">
          {user?.photoURL && (
            <img src={user.photoURL} alt="" className="admin-avatar" />
          )}

          <div>
            <span>Signed in</span>
            <strong>{user?.displayName || user?.email}</strong>
            <small>{user?.email}</small>
          </div>

          <button className="danger-light-btn" onClick={signOut}>
            Sign Out
          </button>

          <Link to="/" className="small-link">
            Home
          </Link>
        </div>
      </div>

      <div className="admin-hero-card">
        <span className="admin-badge">LIVE CONTROL ROOM</span>

        <h2>RoadSoS Emergency Response Console</h2>

        <p>
          Every incoming case is labelled by trigger type, severity, reporter
          trust, victim identity status, and recommended action so responders can
          act quickly.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h2>{cases.length}</h2>
          <p>Total Cases</p>
        </div>

        <div className="stat-card red">
          <h2>{criticalCases.length}</h2>
          <p>Critical Cases</p>
        </div>

        <div className="stat-card yellow">
          <h2>{newCases.length}</h2>
          <p>New Cases</p>
        </div>

        <div className="stat-card orange">
          <h2>{needsVerificationCases.length}</h2>
          <p>Needs Verification</p>
        </div>

        <div className="stat-card blue">
          <h2>{verifiedCases.length}</h2>
          <p>Verified Cases</p>
        </div>

        <div className="stat-card blue">
          <h2>{helpAssignedCases.length}</h2>
          <p>Help Assigned</p>
        </div>

        <div className="stat-card purple">
          <h2>{bystanderCases.length}</h2>
          <p>Bystander Reports</p>
        </div>

        <div className="stat-card green">
          <h2>{resolvedCases.length}</h2>
          <p>Resolved</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === "cases" ? "active-tab" : ""}
          onClick={() => setActiveTab("cases")}
        >
          Live SOS Cases
        </button>

        <button
          className={activeTab === "users" ? "active-tab" : ""}
          onClick={() => setActiveTab("users")}
        >
          Registered Users Database
        </button>
      </div>

      {activeTab === "cases" && (
        <>
          <div className="card">
            <h2>Live SOS Cases</h2>

            <p className="muted-text">
              Admin can verify reports, match victims using vehicle numbers,
              assign help, and resolve cases.
            </p>
          </div>

          {renderCases()}
        </>
      )}

      {activeTab === "users" && (
        <>
          <div className="card">
            <h2>Registered RoadSoS Users Database</h2>

            <p className="muted-text">
              This database contains all saved citizen profiles. It is used by
              the admin to identify possible victims when bystanders submit
              vehicle-number-based accident reports.
            </p>
          </div>

          {renderRegisteredUsers()}
        </>
      )}
    </div>
  );
}

export default AdminDashboard;
