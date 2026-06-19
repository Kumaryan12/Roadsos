import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";
import { useAuth } from "../auth/useAuth";

import MapView from "../components/MapView";
import NearbyServices from "../components/NearbyServices";

function BystanderReport() {
  const { user: authUser } = useAuth();

  const [bystanderMode, setBystanderMode] = useState("report");
  // entry | report

  const [registeredBystander, setRegisteredBystander] = useState(null);
  const [loadPhone, setLoadPhone] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [guestBystander, setGuestBystander] = useState({
    name: authUser?.displayName || "",
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

  const getGoogleAccountData = () => ({
    authUid: authUser?.uid || "",
    googleEmail: authUser?.email || "",
    googleDisplayName: authUser?.displayName || "",
    googlePhotoURL: authUser?.photoURL || "",
    authProvider: "google.com"
  });

  const loadRegisteredBystander = async (phone, silent = false) => {
    const normalizedPhone = normalizePhoneNumber(phone);

    if (!normalizedPhone) {
      alert("Please enter a valid phone number.");
      return;
    }

    setLoadingProfile(true);

    try {
      const profileRef = doc(db, "registered_users", normalizedPhone);
      const profileSnap = await getDoc(profileRef);

      if (profileSnap.exists()) {
        const profileData = {
          ...profileSnap.data(),
          ...getGoogleAccountData()
        };

        setRegisteredBystander(profileData);
        localStorage.setItem("roadsos_phone", normalizedPhone);

        if (authUser?.uid) {
          localStorage.setItem(`roadsos_phone_${authUser.uid}`, normalizedPhone);
        }

        setBystanderMode("report");

        if (!silent) {
          alert("Registered RoadSoS profile loaded. Report will be submitted as a verified bystander.");
        }
      } else {
        if (!silent) {
          alert("No RoadSoS profile found for this phone number.");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load profile. Check Firebase connection.");
    }

    setLoadingProfile(false);
  };

  const loadRegisteredBystanderByGoogle = async (silent = false) => {
    if (!authUser?.uid) return;

    setLoadingProfile(true);

    try {
      const profileQuery = query(
        collection(db, "registered_users"),
        where("authUid", "==", authUser.uid),
        limit(1)
      );
      const profileSnap = await getDocs(profileQuery);

      if (!profileSnap.empty) {
        const profileData = {
          ...profileSnap.docs[0].data(),
          ...getGoogleAccountData()
        };

        setRegisteredBystander(profileData);

        if (profileData.phoneNormalized) {
          localStorage.setItem("roadsos_phone", profileData.phoneNormalized);
          localStorage.setItem(
            `roadsos_phone_${authUser.uid}`,
            profileData.phoneNormalized
          );
        }

        setBystanderMode("report");

        if (!silent) {
          alert("RoadSoS profile loaded from your Google account.");
        }

        setLoadingProfile(false);
        return;
      }

      const savedPhone = localStorage.getItem(`roadsos_phone_${authUser.uid}`);

      if (savedPhone) {
        await loadRegisteredBystander(savedPhone, true);
        return;
      }

      setGuestBystander((prev) => ({
        ...prev,
        name: prev.name || authUser.displayName || ""
      }));
      setBystanderMode("report");
    } catch (error) {
      console.error(error);
      alert("Failed to load RoadSoS profile from your Google account.");
    }

    setLoadingProfile(false);
  };

  useEffect(() => {
    if (!authUser?.uid) return;

    const loadTimer = window.setTimeout(() => {
      loadRegisteredBystanderByGoogle(true);
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [authUser?.uid]);

  const continueAsGuest = () => {
    setRegisteredBystander(null);
    setBystanderMode("report");
  };

  const clearBystanderIdentity = () => {
    setRegisteredBystander(null);
    setGuestBystander({
      name: authUser?.displayName || "",
      phone: ""
    });
    setBystanderMode("report");
  };

  const updateGuestBystander = (field, value) => {
    setGuestBystander((prev) => ({
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

  const calculateConfidenceScore = () => {
    let score = 0;

    if (registeredBystander) score += 30;
    if (!registeredBystander && authUser) score += 30;
    if (!registeredBystander && guestBystander.phone.trim()) score += 10;
    if (location) score += 25;
    if (report.vehicleNumber.trim()) score += 25;
    if (Object.values(conditionAnswers).some(Boolean)) score += 20;
    if (report.note.trim()) score += 10;

    return Math.min(score, 100);
  };

  const getConfidenceLevel = (score) => {
    if (score >= 80) return "HIGH";
    if (score >= 50) return "MEDIUM";
    return "LOW";
  };

  const getReporterType = () => {
    if (registeredBystander) return "REGISTERED_ROADSOS_USER";

    if (authUser) {
      return "GOOGLE_AUTHENTICATED_BYSTANDER";
    }

    if (guestBystander.phone.trim()) {
      return "GUEST_WITH_CONTACT";
    }

    return "ANONYMOUS_GUEST";
  };

  const getReporterIdentityStatus = () => {
    if (registeredBystander) return "KNOWN";
    if (authUser) return "KNOWN";
    if (guestBystander.phone.trim()) return "PARTIALLY_KNOWN";
    return "UNKNOWN";
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

      const confidenceScore = calculateConfidenceScore();
      const confidenceLevel = getConfidenceLevel(confidenceScore);

      const reporterType = getReporterType();
      const reporterIdentityStatus = getReporterIdentityStatus();

      const reportData = {
        triggerType: "BYSTANDER_REPORT",
        detectionSource: "BYSTANDER_APP_OPEN",
        sosSource: "BYSTANDER",

        reporterType,
        reporterIdentityStatus,

        bystander: registeredBystander
          ? {
              roadSosId: registeredBystander.roadSosId || "",
              name: registeredBystander.name || "",
              phone: registeredBystander.phone || "",
              phoneNormalized: registeredBystander.phoneNormalized || "",
              authUid: registeredBystander.authUid || authUser?.uid || "",
              googleEmail:
                registeredBystander.googleEmail || authUser?.email || "",
              googleDisplayName:
                registeredBystander.googleDisplayName ||
                authUser?.displayName ||
                "",
              profileSource: "registered_users"
            }
          : {
              name:
                guestBystander.name.trim() ||
                authUser?.displayName ||
                "Google-authenticated bystander",
              phone: guestBystander.phone.trim(),
              phoneNormalized: normalizePhoneNumber(guestBystander.phone),
              authUid: authUser?.uid || "",
              googleEmail: authUser?.email || "",
              googleDisplayName: authUser?.displayName || "",
              googlePhotoURL: authUser?.photoURL || "",
              profileSource: authUser ? "google_auth" : "guest"
            },

        victimIdentityStatus: reportedVehicleNumberNormalized
          ? "UNVERIFIED_VEHICLE_PROVIDED"
          : "UNKNOWN",

        confidenceScore,
        confidenceLevel,
        verificationRequired: true,
        emergencyContactNotified: false,

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

        status: "Needs Verification",
        timeline: [
          {
            label: "Bystander Report Created",
            description: registeredBystander
              ? "A registered RoadSoS user submitted a bystander accident report."
              : "A Google-authenticated bystander submitted an accident report.",
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
        situationSummary,
        confidenceScore,
        confidenceLevel,
        reporterType
      });

      alert("Bystander accident report submitted successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit accident report.");
    }

    setSubmitting(false);
  };

  const renderEntryScreen = () => {
    return (
      <>
        <div className="bystander-hero-card">
          <span className="bystander-badge">BYSTANDER MODE</span>

          <h2>Report an accident quickly and responsibly</h2>

          <p>
            If you are already a RoadSoS user, your profile will be used
            automatically as the reporter identity. If not, you can load your
            profile or continue as a guest.
          </p>
        </div>

        <div className="bystander-auth-grid">
          <div className="card">
            <h2>Already a RoadSoS user?</h2>

            <p className="muted-text">
              Enter your registered phone number. Your report will be marked as
              coming from a registered RoadSoS user, increasing trust.
            </p>

            <input
              placeholder="Registered phone number, e.g. 919876543210"
              value={loadPhone}
              onChange={(e) => setLoadPhone(e.target.value)}
            />

            <button
              className="primary-btn full"
              onClick={() => loadRegisteredBystander(loadPhone)}
              disabled={loadingProfile}
            >
              {loadingProfile ? "Loading Profile..." : "Load My Profile"}
            </button>
          </div>

          <div className="card">
            <h2>Not registered?</h2>

            <p className="muted-text">
              You can still report the accident as a guest. Your report will
              reach the admin dashboard but will require verification.
            </p>

            <button className="secondary-btn full" onClick={continueAsGuest}>
              Continue as Guest Bystander
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderReporterIdentityCard = () => {
    if (registeredBystander) {
      return (
        <div className="card reporter-identity-card">
          <h2>Reporter Identity</h2>

          <div className="reporter-known-box">
            <span className="ready-badge">REGISTERED REPORTER</span>

            <h3>{registeredBystander.name}</h3>

            <p>
              RoadSoS ID:{" "}
              <strong>{registeredBystander.roadSosId || "Not available"}</strong>
            </p>

            <p>
              Phone: <strong>{registeredBystander.phone}</strong>
            </p>

            <button className="danger-light-btn" onClick={clearBystanderIdentity}>
              Use Different Reporter
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="card">
        <h2>Google Reporter Identity</h2>

        <p className="muted-text">
          This report will be linked to your signed-in Google account. Add a
          callback phone only if responders may need clarification.
        </p>

        <div className="info-box">
          <strong>{authUser?.displayName || "RoadSoS Citizen"}</strong>
          <p className="muted-text" style={{ marginBottom: 0 }}>
            {authUser?.email || "Google account connected"}
          </p>
        </div>

        <input
          placeholder="Your name"
          value={guestBystander.name}
          onChange={(e) => updateGuestBystander("name", e.target.value)}
        />

        <input
          placeholder="Your phone number, optional"
          value={guestBystander.phone}
          onChange={(e) => updateGuestBystander("phone", e.target.value)}
        />

        <button className="danger-light-btn" onClick={clearBystanderIdentity}>
          Reset Reporter Details
        </button>
      </div>
    );
  };

  const renderReportForm = () => {
    return (
      <>
        <div className="bystander-hero-card">
          <span className="bystander-badge">ACCIDENT REPORT</span>

          <h2>Help someone as a verified Google reporter</h2>

          <p>
            If the victim cannot use their phone, your report can help responders
            identify the victim through vehicle number and dispatch help faster.
            RoadSoS will attach your Google account to the report.
          </p>

          {loadingProfile && (
            <p className="success-text">Checking for a saved RoadSoS profile...</p>
          )}
        </div>

        {renderReporterIdentityCard()}

        <div className="card">
          <h2>Step 1: Accident Location</h2>

          <p className="muted-text">
            Detect the location where the accident happened. This location will
            be sent to the responder dashboard.
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
          <h2>Step 2: Victim / Vehicle Details</h2>

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
          <h2>Step 3: What do you observe?</h2>

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
          <h2>Step 4: Submit Accident Report</h2>

          <p className="muted-text">
            This will create a bystander report in the responder dashboard.
            Admin can verify the case and search the registered user database
            using the vehicle number.
          </p>

          <div className="confidence-preview">
            <strong>Estimated Report Confidence:</strong>{" "}
            {calculateConfidenceScore()} / 100 —{" "}
            {getConfidenceLevel(calculateConfidenceScore())}
          </div>

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
                <strong>Reporter Type:</strong> {reportCreated.reporterType}
              </p>

              <p>
                <strong>Confidence:</strong> {reportCreated.confidenceScore}/100
                — {reportCreated.confidenceLevel}
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
      </>
    );
  };

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>Bystander Accident Report</h1>
          <p>
            Report an accident for someone else. Your Google account is used as
            reporter identity, and a saved RoadSoS profile is loaded when found.
          </p>
        </div>

        <Link to="/citizen" className="small-link">
          Citizen Portal
        </Link>
      </div>

      {bystanderMode === "entry" && renderEntryScreen()}
      {bystanderMode === "report" && renderReportForm()}
    </div>
  );
}

export default BystanderReport;
