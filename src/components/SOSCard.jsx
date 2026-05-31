import { useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

import MapView from "./MapView";
import NearbyServices from "./NearbyServices";

function SOSCard({ sosCase, onStatusUpdate, onConfirmVictimMatch }) {
  const [matching, setMatching] = useState(false);
  const [matches, setMatches] = useState([]);

  const isBystanderReport = sosCase.triggerType === "BYSTANDER_REPORT";
  const isManualVictimSos = sosCase.triggerType === "MANUAL_VICTIM_SOS";

  const getSeverityClass = () => {
    if (sosCase.severity === "Critical") return "critical";
    if (sosCase.severity === "Moderate") return "moderate";
    return "low";
  };

  const getTriggerLabel = () => {
    if (sosCase.triggerType === "MANUAL_VICTIM_SOS") {
      return "Manual Victim SOS";
    }

    if (sosCase.triggerType === "BYSTANDER_REPORT") {
      return "Bystander Report";
    }

    if (sosCase.triggerType === "AUTO_ESCALATION") {
      return "Auto Escalation";
    }

    return sosCase.triggerType || "Unknown Trigger";
  };

  const getReporterTypeLabel = () => {
    if (sosCase.reporterType === "REGISTERED_ROADSOS_USER") {
      return "Registered RoadSoS User";
    }

    if (sosCase.reporterType === "GUEST_WITH_CONTACT") {
      return "Guest with Contact";
    }

    if (sosCase.reporterType === "ANONYMOUS_GUEST") {
      return "Anonymous Guest";
    }

    return "Not Applicable";
  };

  const getReporterIdentityLabel = () => {
    if (sosCase.reporterIdentityStatus === "KNOWN") {
      return "Known Reporter";
    }

    if (sosCase.reporterIdentityStatus === "PARTIALLY_KNOWN") {
      return "Partially Known";
    }

    if (sosCase.reporterIdentityStatus === "UNKNOWN") {
      return "Unknown Reporter";
    }

    return "Not Available";
  };

  const getConfidenceClass = () => {
    if (sosCase.confidenceLevel === "HIGH") return "high-confidence";
    if (sosCase.confidenceLevel === "MEDIUM") return "medium-confidence";
    return "low-confidence";
  };

  const isAgeMatch = (registeredAge, reportedAgeRange) => {
  if (!registeredAge || !reportedAgeRange || reportedAgeRange === "Unknown") {
    return false;
  }

  const age = Number(registeredAge);

  if (Number.isNaN(age)) return false;

  if (reportedAgeRange === "Below 18") return age < 18;
  if (reportedAgeRange === "18-25") return age >= 18 && age <= 25;
  if (reportedAgeRange === "26-35") return age >= 26 && age <= 35;
  if (reportedAgeRange === "36-50") return age >= 36 && age <= 50;
  if (reportedAgeRange === "Above 50") return age > 50;

  return false;
};

const getVictimMatchScore = (victim) => {
  let score = 0;
  const reasons = [];

  const reportedVehicle = sosCase.reportedVehicleNumberNormalized;

  const vehicleMatched =
    reportedVehicle &&
    victim.vehicleNumbersNormalized?.includes(reportedVehicle);

  if (vehicleMatched) {
    score += 70;
    reasons.push("Vehicle number matched");
  }

  if (
    sosCase.gender &&
    sosCase.gender !== "Unknown" &&
    victim.gender &&
    sosCase.gender === victim.gender
  ) {
    score += 10;
    reasons.push("Gender matched");
  }

  if (isAgeMatch(victim.age, sosCase.approxAge)) {
    score += 10;
    reasons.push("Age range matched");
  }

  const matchingVehicle = victim.vehicles?.find(
    (vehicle) =>
      vehicle.vehicleNumberNormalized === sosCase.reportedVehicleNumberNormalized
  );

  if (
    matchingVehicle &&
    sosCase.vehicleType &&
    matchingVehicle.vehicleType === sosCase.vehicleType
  ) {
    score += 10;
    reasons.push("Vehicle type matched");
  }

  return {
    score: Math.min(score, 100),
    reasons,
    matchingVehicle
  };
};

const getMatchClass = (score) => {
  if (score >= 85) return "high-confidence";
  if (score >= 60) return "medium-confidence";
  return "low-confidence";
};

  const findVictimByVehicle = async () => {
  if (!sosCase.reportedVehicleNumberNormalized) {
    alert("No vehicle number was provided in this bystander report.");
    return;
  }

  setMatching(true);

  try {
    const q = query(
      collection(db, "registered_users"),
      where(
        "vehicleNumbersNormalized",
        "array-contains",
        sosCase.reportedVehicleNumberNormalized
      )
    );

    const snapshot = await getDocs(q);

    const results = snapshot.docs.map((docItem) => {
      const victim = {
        id: docItem.id,
        ...docItem.data()
      };

      const matchDetails = getVictimMatchScore(victim);

      return {
        ...victim,
        matchScore: matchDetails.score,
        matchReasons: matchDetails.reasons,
        matchingVehicle: matchDetails.matchingVehicle || null
      };
    });

    results.sort((a, b) => b.matchScore - a.matchScore);

    setMatches(results);

    if (results.length === 0) {
      alert("No registered RoadSoS user matched this vehicle number.");
    }
  } catch (error) {
    console.error(error);
    alert("Failed to search registered users.");
  }

  setMatching(false);
};

  const getLocationLink = () => {
    if (!sosCase.location) return "#";
    return `https://www.google.com/maps?q=${sosCase.location.latitude},${sosCase.location.longitude}`;
  };

  const notifyEmergencyContact = (victim) => {
    const mapsLink = getLocationLink();

    const message = `RoadSoS Alert: ${victim.name} may be involved in a road accident. Location: ${mapsLink}`;

    const phone = victim.emergencyContact;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const renderReporterBox = () => {
    if (!isBystanderReport) return null;

    const bystander = sosCase.bystander || {};

    return (
      <div className="reporter-box">
        <h3>Reporter Verification</h3>

        <div className="reporter-status-row">
          <span className={`confidence-chip ${getConfidenceClass()}`}>
            Confidence: {sosCase.confidenceScore ?? "N/A"}/100
          </span>

          <span className="verification-chip">
            {sosCase.verificationRequired
              ? "Verification Required"
              : "Verification Not Required"}
          </span>
        </div>

        <div className="case-info-grid">
          <div>
            <span>Reporter Type</span>
            <strong>{getReporterTypeLabel()}</strong>
          </div>

          <div>
            <span>Reporter Identity</span>
            <strong>{getReporterIdentityLabel()}</strong>
          </div>

          <div>
            <span>Reporter Name</span>
            <strong>{bystander.name || "Not provided"}</strong>
          </div>

          <div>
            <span>Reporter Phone</span>
            <strong>{bystander.phone || "Not provided"}</strong>
          </div>

          <div>
            <span>Reporter Profile Source</span>
            <strong>{bystander.profileSource || "Not available"}</strong>
          </div>

          <div>
            <span>Reporter RoadSoS ID</span>
            <strong>{bystander.roadSosId || "Not available"}</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderVictimProfile = () => {
    if (isManualVictimSos && sosCase.user) {
      return (
        <div className="victim-profile-box">
          <h3>Known Victim Profile</h3>

          <div className="profile-detail-grid">
            <div>
              <span>Name</span>
              <strong>{sosCase.user.name}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{sosCase.user.phone}</strong>
            </div>

            <div>
              <span>RoadSoS ID</span>
              <strong>{sosCase.user.roadSosId || "Not available"}</strong>
            </div>

            <div>
              <span>Blood Group</span>
              <strong>{sosCase.user.bloodGroup}</strong>
            </div>

            <div>
              <span>Emergency Contact</span>
              <strong>{sosCase.user.emergencyContact}</strong>
            </div>

            <div>
              <span>Medical Conditions</span>
              <strong>{sosCase.user.medicalConditions}</strong>
            </div>

            <div>
              <span>Allergies</span>
              <strong>{sosCase.user.allergies}</strong>
            </div>

            <div>
              <span>Registered Vehicles</span>
              <strong>
                {sosCase.user.vehicles && sosCase.user.vehicles.length > 0
                  ? sosCase.user.vehicles
                      .map(
                        (vehicle) =>
                          `${vehicle.vehicleNumber} (${vehicle.vehicleType})`
                      )
                      .join(", ")
                  : "Not provided"}
              </strong>
            </div>
          </div>
        </div>
      );
    }

    if (sosCase.matchedVictim) {
      return (
        <div className="victim-profile-box">
          <h3>Matched Victim Profile</h3>

          <div className="profile-detail-grid">
            <div>
              <span>Name</span>
              <strong>{sosCase.matchedVictim.name}</strong>
            </div>

            <div>
              <span>Phone</span>
              <strong>{sosCase.matchedVictim.phone}</strong>
            </div>

            <div>
              <span>RoadSoS ID</span>
              <strong>{sosCase.matchedVictim.roadSosId || "Not available"}</strong>
            </div>

            <div>
              <span>Blood Group</span>
              <strong>{sosCase.matchedVictim.bloodGroup}</strong>
            </div>

            <div>
              <span>Emergency Contact</span>
              <strong>{sosCase.matchedVictim.emergencyContact}</strong>
            </div>

            <div>
              <span>Medical Conditions</span>
              <strong>{sosCase.matchedVictim.medicalConditions}</strong>
            </div>

            <div>
              <span>Allergies</span>
              <strong>{sosCase.matchedVictim.allergies}</strong>
            </div>

            <div>
              <span>Registered Vehicles</span>
              <strong>
                {sosCase.matchedVictim.vehicles &&
                sosCase.matchedVictim.vehicles.length > 0
                  ? sosCase.matchedVictim.vehicles
                      .map(
                        (vehicle) =>
                          `${vehicle.vehicleNumber} (${vehicle.vehicleType})`
                      )
                      .join(", ")
                  : "Not provided"}
              </strong>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="sos-case-card">
      <div className="case-top-row">
        <div>
          <span className="case-id">Case ID: {sosCase.id}</span>
          <h2>{getTriggerLabel()}</h2>
        </div>

        <span className={`severity-pill ${getSeverityClass()}`}>
          {sosCase.severity || "Unknown"}
        </span>
      </div>

      <div className="case-label-row">
        <span>Status: {sosCase.status || "New"}</span>
        <span>Victim Identity: {sosCase.victimIdentityStatus || "Unknown"}</span>
        <span>Confidence: {sosCase.confidenceLevel || "No Label"}</span>
      </div>

      <div className="case-summary-box">
        <h3>Situation Summary</h3>
        <p>
          {sosCase.victimSituationSummary ||
            sosCase.situationSummary ||
            "No situation summary available."}
        </p>
      </div>

      <div className="case-info-grid">
        <div>
          <span>Recommended Action</span>
          <strong>{sosCase.recommendedAction || "Not available"}</strong>
        </div>

        <div>
          <span>Trigger Type</span>
          <strong>{sosCase.triggerType || "Not available"}</strong>
        </div>

        <div>
          <span>Detection Source</span>
          <strong>{sosCase.detectionSource || "Not available"}</strong>
        </div>

        <div>
          <span>SOS Source</span>
          <strong>{sosCase.sosSource || "Not available"}</strong>
        </div>
      </div>

      {renderReporterBox()}

      {isBystanderReport && (
        <div className="bystander-match-box">
          <h3>Victim Identification from Bystander Report</h3>

          <div className="case-info-grid">
            <div>
              <span>Reported Vehicle</span>
              <strong>
                {sosCase.reportedVehicleNumber || "Not provided"}
              </strong>
            </div>

            <div>
              <span>Normalized Vehicle</span>
              <strong>
                {sosCase.reportedVehicleNumberNormalized || "Not available"}
              </strong>
            </div>

            <div>
              <span>Approx Victim Age</span>
              <strong>{sosCase.approxAge || "Unknown"}</strong>
            </div>

            <div>
              <span>Victim Gender</span>
              <strong>{sosCase.gender || "Unknown"}</strong>
            </div>

            <div>
              <span>Vehicle Type</span>
              <strong>{sosCase.vehicleType || "Unknown"}</strong>
            </div>

            <div>
              <span>Victims Count</span>
              <strong>{sosCase.victimsCount || "Unknown"}</strong>
            </div>
          </div>

          <button
            className="secondary-btn full"
            onClick={findVictimByVehicle}
            disabled={matching}
          >
            {matching ? "Searching..." : "Find Victim Match by Vehicle Number"}
          </button>

          {matches.length > 0 && (
            <div className="matches-box">
              <h3>Possible Victim Matches</h3>

              {matches.map((victim) => (
                <div className="match-card" key={victim.id}>
                  <div>
                    <h4>{victim.name}</h4>

                    <p>
                      {victim.bloodGroup} • {victim.gender} • Age {victim.age}
                    </p>

                    <p>
                      Emergency Contact:{" "}
                      <strong>{victim.emergencyContact}</strong>
                    </p>

                    <p>
                      Vehicles:{" "}
                      <strong>
                        {victim.vehicles && victim.vehicles.length > 0
                          ? victim.vehicles
                              .map(
                                (vehicle) =>
                                  `${vehicle.vehicleNumber} (${vehicle.vehicleType})`
                              )
                              .join(", ")
                          : "Not provided"}
                      </strong>
                    </p>
                  </div>

                  <div className="match-actions">
                    <button
                      className="primary-btn"
                      onClick={() => onConfirmVictimMatch(sosCase.id, victim)}
                    >
                      Confirm Match
                    </button>

                    <button
                      className="secondary-btn"
                      onClick={() => notifyEmergencyContact(victim)}
                    >
                      Notify Contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {renderVictimProfile()}

      <div className="card-inner-map">
        <h3>Accident Location</h3>

        <a href={getLocationLink()} target="_blank" rel="noreferrer">
          Open in Google Maps
        </a>

        <MapView
          latitude={sosCase.location?.latitude}
          longitude={sosCase.location?.longitude}
          height="260px"
        />
      </div>

      <NearbyServices location={sosCase.location} />

      <div className="status-action-box">
        <h3>Update Case Status</h3>

        <div className="status-buttons">
          <button onClick={() => onStatusUpdate(sosCase.id, "Verified")}>
            Verified
          </button>

          <button onClick={() => onStatusUpdate(sosCase.id, "Help Assigned")}>
            Help Assigned
          </button>

          <button onClick={() => onStatusUpdate(sosCase.id, "Reached Location")}>
            Reached Location
          </button>

          <button onClick={() => onStatusUpdate(sosCase.id, "Resolved")}>
            Resolved
          </button>
        </div>
      </div>
    </div>
  );
}

export default SOSCard;