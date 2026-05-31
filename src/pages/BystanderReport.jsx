import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";

import MapView from "../components/MapView";
import NearbyServices from "../components/NearbyServices";

function BystanderReport() {
  const [bystander, setBystander] = useState({
    name: "",
    phone: ""
  });

  const [report, setReport] = useState({
    vehicleNumber: "",
    vehicleType: "Two-wheeler",
    approxAge: "",
    gender: "",
    victimsCount: "1",
    note: ""
  });

  const [conditionAnswers, setConditionAnswers] = useState({
    victimUnconscious: false,
    victimBleeding: false,
    victimCannotMove: false,
    roadBlocked: false,
    fireOrSmoke: false,
    multipleVictims: false
  });

  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportCreated, setReportCreated] = useState(null);

  const normalizeVehicleNumber = (vehicleNumber) => {
    return vehicleNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

  const normalizePhoneNumber = (phone) => {
    return phone.replace(/[^0-9]/g, "");
  };

  const updateBystander = (field, value) => {
    setBystander((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateReport = (field, value) => {
    setReport((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateCondition = (field) => {
    setConditionAnswers((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      () => {
        alert("Unable to get location. Please allow location permission.");
      }
    );
  };

  const calculateSeverity = () => {
    const score =
      Number(conditionAnswers.victimUnconscious) +
      Number(conditionAnswers.victimBleeding) +
      Number(conditionAnswers.victimCannotMove) +
      Number(conditionAnswers.roadBlocked) +
      Number(conditionAnswers.fireOrSmoke) +
      Number(conditionAnswers.multipleVictims);

    if (
      conditionAnswers.victimUnconscious ||
      conditionAnswers.fireOrSmoke ||
      score >= 4
    ) {
      return "Critical";
    }

    if (
      conditionAnswers.victimBleeding ||
      conditionAnswers.victimCannotMove ||
      score >= 2
    ) {
      return "Moderate";
    }

    return "Low";
  };

  const hasAccidentDetails = () => {
    const anyConditionSelected = Object.values(conditionAnswers).some(Boolean);
    return (
      anyConditionSelected ||
      report.vehicleNumber.trim().length > 0 ||
      report.note.trim().length > 0
    );
  };

  const getBystanderSituationSummary = () => {
    const selected = [];

    if (report.vehicleNumber.trim()) {
      selected.push(`Vehicle number visible: ${report.vehicleNumber.trim()}`);
    }

    if (report.vehicleType) {
      selected.push(`Vehicle type: ${report.vehicleType}`);
    }

    if (report.approxAge) {
      selected.push(`Approx victim age: ${report.approxAge}`);
    }

    if (report.gender) {
      selected.push(`Victim gender: ${report.gender}`);
    }

    if (conditionAnswers.victimUnconscious) {
      selected.push("Victim appears unconscious");
    }

    if (conditionAnswers.victimBleeding) {
      selected.push("Victim appears to be bleeding");
    }

    if (conditionAnswers.victimCannotMove) {
      selected.push("Victim cannot move properly");
    }

    if (conditionAnswers.roadBlocked) {
      selected.push("Road is blocked");
    }

    if (conditionAnswers.fireOrSmoke) {
      selected.push("Fire, smoke, or fuel leakage is visible");
    }

    if (conditionAnswers.multipleVictims) {
      selected.push("Multiple victims may be involved");
    }

    if (report.note.trim()) {
      selected.push(`Additional note: ${report.note.trim()}`);
    }

    return selected.join(". ");
  };

  const getRecommendedAction = (severity) => {
    if (severity === "Critical") {
      return "Dispatch ambulance immediately, notify police, route to nearest trauma centre, and verify victim identity using vehicle number.";
    }

    if (severity === "Moderate") {
      return "Dispatch nearby medical support, check road blockage, and verify victim identity.";
    }

    return "Verify report, provide first-aid guidance, and monitor case.";
  };

  const validateReport = () => {
    if (!location) {
      alert("Please detect accident location first.");
      return false;
    }

    if (!hasAccidentDetails()) {
      alert(
        "Please enter vehicle number, select at least one condition, or write a short note."
      );
      return false;
    }

    if (!report.approxAge) {
      alert("Please select approximate victim age.");
      return false;
    }

    if (!report.gender) {
      alert("Please select victim gender.");
      return false;
    }

    return true;
  };

  const submitBystanderReport = async () => {
    if (!validateReport()) return;

    setSubmitting(true);

    try {
      const severity = calculateSeverity();
      const reportedVehicleNumberNormalized = normalizeVehicleNumber(
        report.vehicleNumber
      );

      const situationSummary = getBystanderSituationSummary();

      const reportData = {
        triggerType: "BYSTANDER_REPORT",
        detectionSource: "BYSTANDER_APP_OPEN",
        sosSource: "BYSTANDER",

        victimIdentityStatus: reportedVehicleNumberNormalized
          ? "UNVERIFIED_VEHICLE_PROVIDED"
          : "UNKNOWN",
        confidenceLevel: reportedVehicleNumberNormalized ? "MEDIUM" : "LOW",
        emergencyContactNotified: false,

        bystander: {
          name: bystander.name.trim() || "Anonymous bystander",
          phone: bystander.phone.trim(),
          phoneNormalized: normalizePhoneNumber(bystander.phone)
        },

        reportedVehicleNumber: report.vehicleNumber.trim(),
        reportedVehicleNumberNormalized,
        vehicleType: report.vehicleType,
        approxAge: report.approxAge,
        gender: report.gender,
        victimsCount: report.victimsCount,

        location,
        severity,
        conditionAnswers,
        situationSummary,
        note: report.note.trim(),

        possibleVictimMatches: [],
        matchedVictim: null,

        recommendedAction: getRecommendedAction(severity),

        status: "New",
        timeline: [
          {
            label: "Bystander Report Created",
            description:
              "A bystander submitted an accident report with observed victim and vehicle details.",
            time: new Date().toISOString()
          }
        ],

        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "sos_cases"), reportData);

      const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

      setReportCreated({
        id: docRef.id,
        severity,
        mapsLink,
        situationSummary
      });

      alert("Bystander accident report submitted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit accident report.");
    }

    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Bystander Accident Report</h1>
          <p>
            Report an accident for someone else using location, vehicle number,
            approximate victim details, and visible emergency conditions.
          </p>
        </div>

        <Link to="/" className="small-link">
          Home
        </Link>
      </div>

      <div className="bystander-hero-card">
        <span className="bystander-badge">BYSTANDER MODE</span>

        <h2>Help someone even if you do not know them</h2>

        <p>
          If the victim cannot use their phone, your report can help responders
          identify the victim through vehicle number and dispatch help faster.
        </p>
      </div>

      <div className="card">
        <h2>Step 1: Accident Location</h2>

        <p className="muted-text">
          Detect the location where the accident happened. This location will be
          sent to the responder dashboard.
        </p>

        <button className="secondary-btn full" onClick={getLocation}>
          Detect Accident Location
        </button>

        {location && (
          <p className="success-text">
            Accident location detected: {location.latitude.toFixed(4)},{" "}
            {location.longitude.toFixed(4)}
          </p>
        )}
      </div>

      <div className="card">
        <h2>Step 2: Bystander Details</h2>

        <p className="muted-text">
          Optional, but useful if responders need to call you back for
          clarification.
        </p>

        <input
          placeholder="Your name, optional"
          value={bystander.name}
          onChange={(e) => updateBystander("name", e.target.value)}
        />

        <input
          placeholder="Your phone number, optional"
          value={bystander.phone}
          onChange={(e) => updateBystander("phone", e.target.value)}
        />
      </div>

      <div className="card">
        <h2>Step 3: Victim / Vehicle Details</h2>

        <p className="muted-text">
          Vehicle number helps the admin match the victim with a registered
          RoadSoS profile.
        </p>

        <input
          placeholder="Vehicle Number, e.g. GA 03 AB 1234"
          value={report.vehicleNumber}
          onChange={(e) => updateReport("vehicleNumber", e.target.value)}
        />

        <select
          value={report.vehicleType}
          onChange={(e) => updateReport("vehicleType", e.target.value)}
          className="input-select"
        >
          <option value="Two-wheeler">Two-wheeler</option>
          <option value="Car">Car</option>
          <option value="Auto">Auto</option>
          <option value="Truck">Truck</option>
          <option value="Bus">Bus</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={report.approxAge}
          onChange={(e) => updateReport("approxAge", e.target.value)}
          className="input-select"
        >
          <option value="">Approx Victim Age</option>
          <option value="Below 18">Below 18</option>
          <option value="18-25">18-25</option>
          <option value="26-35">26-35</option>
          <option value="36-50">36-50</option>
          <option value="Above 50">Above 50</option>
          <option value="Unknown">Unknown</option>
        </select>

        <select
          value={report.gender}
          onChange={(e) => updateReport("gender", e.target.value)}
          className="input-select"
        >
          <option value="">Victim Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Unknown">Unknown</option>
        </select>

        <select
          value={report.victimsCount}
          onChange={(e) => updateReport("victimsCount", e.target.value)}
          className="input-select"
        >
          <option value="1">1 victim</option>
          <option value="2">2 victims</option>
          <option value="3+">3+ victims</option>
          <option value="Unknown">Unknown</option>
        </select>
      </div>

      <div className="card">
        <h2>Step 4: What do you observe?</h2>

        <p className="muted-text">
          Select the visible conditions. These will help responders assess
          urgency before reaching the location.
        </p>

        <label className="check-row">
          <input
            type="checkbox"
            checked={conditionAnswers.victimUnconscious}
            onChange={() => updateCondition("victimUnconscious")}
          />
          Victim appears unconscious
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={conditionAnswers.victimBleeding}
            onChange={() => updateCondition("victimBleeding")}
          />
          Victim appears to be bleeding
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={conditionAnswers.victimCannotMove}
            onChange={() => updateCondition("victimCannotMove")}
          />
          Victim cannot move properly
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={conditionAnswers.roadBlocked}
            onChange={() => updateCondition("roadBlocked")}
          />
          Road is blocked
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={conditionAnswers.fireOrSmoke}
            onChange={() => updateCondition("fireOrSmoke")}
          />
          Fire, smoke, or fuel leakage is visible
        </label>

        <label className="check-row">
          <input
            type="checkbox"
            checked={conditionAnswers.multipleVictims}
            onChange={() => updateCondition("multipleVictims")}
          />
          Multiple victims may be involved
        </label>

        <textarea
          className="input-textarea"
          placeholder="Optional: add a short note, e.g. Bike slipped near the signal, victim is lying near divider."
          value={report.note}
          onChange={(e) => updateReport("note", e.target.value)}
        />

        <div className="situation-preview">
          <strong>Report Summary:</strong>
          <p>
            {hasAccidentDetails()
              ? getBystanderSituationSummary()
              : "Enter vehicle number, select a condition, or write a short note before submitting report."}
          </p>
        </div>

        <div className="severity-box">
          Current Severity: <strong>{calculateSeverity()}</strong>
        </div>
      </div>

      <div className="card send-sos-card">
        <h2>Step 5: Submit Accident Report</h2>

        <p className="muted-text">
          This will create a bystander report in the responder dashboard. Admin
          can then search the registered user database using the vehicle number.
        </p>

        <button
          className="sos-btn"
          onClick={submitBystanderReport}
          disabled={submitting}
        >
          {submitting ? "Submitting Report..." : "SUBMIT ACCIDENT REPORT"}
        </button>

        {reportCreated && (
          <div className="alert-box">
            <h3>Report Submitted</h3>

            <p>
              <strong>Severity:</strong> {reportCreated.severity}
            </p>

            <p>
              <strong>Case ID:</strong> {reportCreated.id}
            </p>

            <p>
              <strong>Summary:</strong> {reportCreated.situationSummary}
            </p>

            <a
              href={reportCreated.mapsLink}
              target="_blank"
              rel="noreferrer"
            >
              Open Accident Location
            </a>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Accident Location Map</h2>

        <MapView
          latitude={location?.latitude}
          longitude={location?.longitude}
          height="350px"
        />
      </div>

      <NearbyServices location={location} />
    </div>
  );
}

export default BystanderReport;