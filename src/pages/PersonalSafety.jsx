import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "../firebase";

import MapView from "../components/MapView";
import NearbyServices from "../components/NearbyServices";
import CrashDetector from "../components/CrashDetector";
function PersonalSafety() {
  const emptyUser = {
    name: "",
    phone: "",
    age: "",
    gender: "",
    emergencyContact: "",
    bloodGroup: "",
    medicalConditions: "",
    allergies: "",
    vehicles: [
      {
        vehicleNumber: "",
        vehicleType: "Two-wheeler",
        vehicleName: "",
        primary: true
      }
    ]
  };

  const [user, setUser] = useState(emptyUser);

  const [profileSaved, setProfileSaved] = useState(false);
  const [profileMode, setProfileMode] = useState("entry");
  // entry | create | edit | emergency

  const [loadPhone, setLoadPhone] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [location, setLocation] = useState(null);

  const [severityAnswers, setSeverityAnswers] = useState({
    injured: false,
    bleeding: false,
    cannotMove: false,
    dizzyOrUnconscious: false,
    vehicleBlocked: false,
    fireOrSmoke: false,
    otherVictims: false
  });

  const [incidentNote, setIncidentNote] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingSos, setSendingSos] = useState(false);
  const [sosCreated, setSosCreated] = useState(null);

  useEffect(() => {
    const savedPhone = localStorage.getItem("roadsos_phone");

    if (savedPhone) {
      loadSavedProfile(savedPhone, true);
    }
  }, []);

  const normalizeVehicleNumber = (vehicleNumber) => {
    return vehicleNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

  const normalizePhoneNumber = (phone) => {
    return phone.replace(/[^0-9]/g, "");
  };

  const generateRoadSosId = (phone) => {
    const cleanPhone = normalizePhoneNumber(phone);
    const lastFour = cleanPhone.slice(-4) || "0000";
    return `RS-${lastFour}`;
  };

  const getCleanedVehicles = () => {
    return user.vehicles
      .filter((vehicle) => vehicle.vehicleNumber.trim() !== "")
      .map((vehicle) => ({
        ...vehicle,
        vehicleNumberNormalized: normalizeVehicleNumber(vehicle.vehicleNumber)
      }));
  };

  const getVehicleNumbersNormalized = () => {
    return getCleanedVehicles().map(
      (vehicle) => vehicle.vehicleNumberNormalized
    );
  };

  const updateUser = (field, value) => {
    setUser((prev) => ({ ...prev, [field]: value }));
  };

  const updateVehicle = (index, field, value) => {
    setUser((prev) => {
      const updatedVehicles = [...prev.vehicles];

      updatedVehicles[index] = {
        ...updatedVehicles[index],
        [field]: value
      };

      return {
        ...prev,
        vehicles: updatedVehicles
      };
    });
  };

  const addVehicle = () => {
    setUser((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          vehicleNumber: "",
          vehicleType: "Two-wheeler",
          vehicleName: "",
          primary: false
        }
      ]
    }));
  };

  const removeVehicle = (index) => {
    setUser((prev) => {
      if (prev.vehicles.length === 1) {
        alert("At least one vehicle is required.");
        return prev;
      }

      const updatedVehicles = prev.vehicles.filter((_, i) => i !== index);

      if (!updatedVehicles.some((vehicle) => vehicle.primary)) {
        updatedVehicles[0].primary = true;
      }

      return {
        ...prev,
        vehicles: updatedVehicles
      };
    });
  };

  const setPrimaryVehicle = (index) => {
    setUser((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle, i) => ({
        ...vehicle,
        primary: i === index
      }))
    }));
  };

  const validateProfile = () => {
    const validVehicles = getCleanedVehicles();

    if (!user.name.trim()) {
      alert("Please enter your name.");
      return false;
    }

    if (!user.phone.trim()) {
      alert("Please enter your phone number.");
      return false;
    }

    if (!user.age.trim()) {
      alert("Please enter your age.");
      return false;
    }

    if (!user.gender.trim()) {
      alert("Please select your gender.");
      return false;
    }

    if (!user.emergencyContact.trim()) {
      alert("Please enter an emergency contact.");
      return false;
    }

    if (!user.bloodGroup.trim()) {
      alert("Please enter your blood group.");
      return false;
    }

    if (validVehicles.length === 0) {
      alert("Please add at least one vehicle.");
      return false;
    }

    return true;
  };

  const buildProfileData = () => {
    const phoneNormalized = normalizePhoneNumber(user.phone);
    const cleanedVehicles = getCleanedVehicles();
    const vehicleNumbersNormalized = getVehicleNumbersNormalized();

    return {
      roadSosId: user.roadSosId || generateRoadSosId(user.phone),
      name: user.name.trim(),
      phone: user.phone.trim(),
      phoneNormalized,
      age: user.age.trim(),
      gender: user.gender,
      emergencyContact: user.emergencyContact.trim(),
      bloodGroup: user.bloodGroup.trim(),
      medicalConditions: user.medicalConditions?.trim() || "None provided",
      allergies: user.allergies?.trim() || "None provided",
      vehicles: cleanedVehicles,
      vehicleNumbersNormalized,
      profileStatus: "ACTIVE"
    };
  };

  const saveProfile = async () => {
    if (!validateProfile()) return;

    setSavingProfile(true);

    try {
      const profileData = buildProfileData();

      await setDoc(
        doc(db, "registered_users", profileData.phoneNormalized),
        {
          ...profileData,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        },
        { merge: true }
      );

      localStorage.setItem("roadsos_phone", profileData.phoneNormalized);

      setUser(profileData);
      setProfileSaved(true);
      setProfileMode("emergency");

      alert("RoadSoS profile saved. Emergency mode is now ready.");
    } catch (error) {
      console.error(error);
      alert("Failed to save profile. Check Firebase rules.");
    }

    setSavingProfile(false);
  };

  const loadSavedProfile = async (phone, silent = false) => {
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
        const profileData = profileSnap.data();

        setUser(profileData);
        setProfileSaved(true);
        setProfileMode("emergency");

        localStorage.setItem("roadsos_phone", normalizedPhone);

        if (!silent) {
          alert("Profile loaded successfully. Emergency mode is ready.");
        }
      } else {
        setProfileSaved(false);
        setProfileMode("entry");

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
      Number(severityAnswers.injured) +
      Number(severityAnswers.bleeding) +
      Number(severityAnswers.cannotMove) +
      Number(severityAnswers.dizzyOrUnconscious) +
      Number(severityAnswers.vehicleBlocked) +
      Number(severityAnswers.fireOrSmoke) +
      Number(severityAnswers.otherVictims);

    if (
      severityAnswers.dizzyOrUnconscious ||
      severityAnswers.fireOrSmoke ||
      score >= 4
    ) {
      return "Critical";
    }

    if (severityAnswers.bleeding || severityAnswers.cannotMove || score >= 2) {
      return "Moderate";
    }

    return "Low";
  };

  const getVictimSituationSummary = () => {
    const selected = [];

    if (severityAnswers.injured) selected.push("I am injured");
    if (severityAnswers.bleeding) selected.push("I am bleeding");
    if (severityAnswers.cannotMove) selected.push("I cannot move properly");

    if (severityAnswers.dizzyOrUnconscious) {
      selected.push("I feel dizzy or may lose consciousness");
    }

    if (severityAnswers.vehicleBlocked) {
      selected.push("My vehicle is blocking the road");
    }

    if (severityAnswers.fireOrSmoke) {
      selected.push("There is fire, smoke, or fuel leakage");
    }

    if (severityAnswers.otherVictims) {
      selected.push("There are other injured people near me");
    }

    if (incidentNote.trim()) {
      selected.push(`Additional note: ${incidentNote.trim()}`);
    }

    return selected.join(". ");
  };

  const hasEmergencyDetails = () => {
    const anyCheckboxSelected = Object.values(severityAnswers).some(Boolean);
    return anyCheckboxSelected || incidentNote.trim().length > 0;
  };

  const getRecommendedAction = (severity) => {
    if (severity === "Critical") {
      return "Dispatch ambulance, notify police, route to nearest trauma centre, and alert emergency contact.";
    }

    if (severity === "Moderate") {
      return "Dispatch ambulance or nearest medical support and monitor road blockage.";
    }

    return "Provide first-aid guidance, notify emergency contact, and monitor case.";
  };

  const updateSeverity = (field) => {
    setSeverityAnswers((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const sendManualSos = async () => {
    if (!profileSaved) {
      alert("Please create or load your RoadSoS profile first.");
      return;
    }

    if (!location) {
      alert("Please detect your location first.");
      return;
    }

    if (!hasEmergencyDetails()) {
      alert(
        "Please select what happened to you or write a short emergency note before sending SOS."
      );
      return;
    }

    setSendingSos(true);

    try {
      const severity = calculateSeverity();
      const victimSituationSummary = getVictimSituationSummary();

      const sosData = {
        triggerType: "MANUAL_VICTIM_SOS",
        detectionSource: "MANUAL_APP_OPEN",
        sosSource: "REGISTERED_USER",

        victimIdentityStatus: "KNOWN",
        confidenceLevel: "HIGH",
        emergencyContactNotified: false,

        user,
        location,
        severity,
        severityAnswers,
        victimSituationSummary,
        incidentNote: incidentNote.trim(),
        recommendedAction: getRecommendedAction(severity),

        status: "New",
        timeline: [
          {
            label: "SOS Created",
            description:
              "Victim manually pressed I NEED HELP after selecting emergency condition details.",
            time: new Date().toISOString()
          }
        ],

        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "sos_cases"), sosData);

      const mapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;

      const message = `RoadSoS Emergency Alert: ${user.name} needs help. Severity: ${severity}. Situation: ${victimSituationSummary}. Location: ${mapsLink}`;

      setSosCreated({
        id: docRef.id,
        severity,
        mapsLink,
        message
      });

      alert("SOS sent successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to send SOS.");
    }

    setSendingSos(false);
  };

  const whatsappLink = sosCreated
    ? `https://wa.me/${user.emergencyContact}?text=${encodeURIComponent(
        sosCreated.message
      )}`
    : "#";

  const clearSavedProfile = () => {
    localStorage.removeItem("roadsos_phone");
    setUser(emptyUser);
    setProfileSaved(false);
    setProfileMode("entry");
    setLocation(null);
    setSosCreated(null);
    setIncidentNote("");
    setSeverityAnswers({
      injured: false,
      bleeding: false,
      cannotMove: false,
      dizzyOrUnconscious: false,
      vehicleBlocked: false,
      fireOrSmoke: false,
      otherVictims: false
    });
  };

  const renderEntryScreen = () => {
    return (
      <>
        <div className="victim-auth-hero">
          <span className="ready-badge">VICTIM FLOW</span>

          <h2>Fast emergency access with saved RoadSoS profile</h2>

          <p>
            Create your profile once when you are safe. During an accident,
            RoadSoS skips login and directly opens emergency mode on this
            device.
          </p>
        </div>

        <div className="victim-auth-grid">
          <div className="card">
            <h2>New user?</h2>

            <p className="muted-text">
              Create your RoadSoS profile with medical details, emergency
              contact, and registered vehicles.
            </p>

            <button
              className="secondary-btn full"
              onClick={() => {
                setUser(emptyUser);
                setProfileMode("create");
              }}
            >
              Create New RoadSoS Profile
            </button>
          </div>

          <div className="card">
            <h2>Already registered?</h2>

            <p className="muted-text">
              Enter your registered phone number to quickly load your saved
              profile on this device.
            </p>

            <input
              placeholder="Registered phone number, e.g. 919876543210"
              value={loadPhone}
              onChange={(e) => setLoadPhone(e.target.value)}
            />

            <button
              className="primary-btn full"
              onClick={() => loadSavedProfile(loadPhone)}
              disabled={loadingProfile}
            >
              {loadingProfile ? "Loading Profile..." : "Load Existing Profile"}
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderProfileForm = () => {
    return (
      <div className="card">
        <h2>
          {profileMode === "edit"
            ? "Edit RoadSoS Profile"
            : "Create RoadSoS Profile"}
        </h2>

        <p className="muted-text">
          This profile stays hidden during emergency use and is sent in the
          background only when SOS is raised.
        </p>

        <input
          placeholder="Full Name"
          value={user.name}
          onChange={(e) => updateUser("name", e.target.value)}
        />

        <input
          placeholder="Phone Number, e.g. 919876543210"
          value={user.phone}
          onChange={(e) => updateUser("phone", e.target.value)}
        />

        <input
          placeholder="Age"
          value={user.age}
          onChange={(e) => updateUser("age", e.target.value)}
        />

        <select
          value={user.gender}
          onChange={(e) => updateUser("gender", e.target.value)}
          className="input-select"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>

        <input
          placeholder="Emergency Contact, e.g. 919999999999"
          value={user.emergencyContact}
          onChange={(e) => updateUser("emergencyContact", e.target.value)}
        />

        <input
          placeholder="Blood Group, e.g. O+"
          value={user.bloodGroup}
          onChange={(e) => updateUser("bloodGroup", e.target.value)}
        />

        <input
          placeholder="Medical Conditions, e.g. diabetes, asthma"
          value={user.medicalConditions}
          onChange={(e) => updateUser("medicalConditions", e.target.value)}
        />

        <input
          placeholder="Allergies, e.g. penicillin, peanuts"
          value={user.allergies}
          onChange={(e) => updateUser("allergies", e.target.value)}
        />

        <div className="vehicle-section">
          <div className="section-mini-header">
            <h3>Registered Vehicles</h3>

            <button type="button" className="mini-btn" onClick={addVehicle}>
              + Add Vehicle
            </button>
          </div>

          {user.vehicles.map((vehicle, index) => (
            <div className="vehicle-card" key={index}>
              <div className="vehicle-top-row">
                <strong>Vehicle {index + 1}</strong>

                {vehicle.primary ? (
                  <span className="primary-chip">Primary</span>
                ) : (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setPrimaryVehicle(index)}
                  >
                    Set Primary
                  </button>
                )}
              </div>

              <input
                placeholder="Vehicle Number, e.g. GA 03 AB 1234"
                value={vehicle.vehicleNumber}
                onChange={(e) =>
                  updateVehicle(index, "vehicleNumber", e.target.value)
                }
              />

              <select
                value={vehicle.vehicleType}
                onChange={(e) =>
                  updateVehicle(index, "vehicleType", e.target.value)
                }
                className="input-select"
              >
                <option value="Two-wheeler">Two-wheeler</option>
                <option value="Car">Car</option>
                <option value="Auto">Auto</option>
                <option value="Truck">Truck</option>
                <option value="Bus">Bus</option>
                <option value="Other">Other</option>
              </select>

              <input
                placeholder="Vehicle Name/Model, e.g. Activa, Swift"
                value={vehicle.vehicleName}
                onChange={(e) =>
                  updateVehicle(index, "vehicleName", e.target.value)
                }
              />

              <button
                type="button"
                className="danger-light-btn"
                onClick={() => removeVehicle(index)}
              >
                Remove Vehicle
              </button>
            </div>
          ))}
        </div>

        <button
          className="secondary-btn full"
          onClick={saveProfile}
          disabled={savingProfile}
        >
          {savingProfile
            ? "Saving Profile..."
            : "Save Profile & Enable Safety Mode"}
        </button>

        <button
          className="danger-light-btn"
          onClick={() =>
            profileSaved ? setProfileMode("emergency") : setProfileMode("entry")
          }
        >
          Cancel
        </button>
      </div>
    );
  };

  const renderEmergencyScreen = () => {
    return (
      <>
        <div className="safety-ready-card">
          <div>
            <span className="ready-badge">PROFILE READY</span>
            <h2>RoadSoS is ready for emergency use</h2>
            <p>
              Your profile is saved in the background. Before sending SOS,
              describe what happened to you using quick first-person options.
            </p>
          </div>

          <div className="safety-actions">
            <button
              className="secondary-btn"
              onClick={() => setProfileMode("edit")}
            >
              Edit Profile
            </button>

            <button className="danger-light-btn" onClick={clearSavedProfile}>
              Clear Saved Profile
            </button>
          </div>
        </div>

        <div className="card profile-summary-card">
          <h2>Emergency Profile Active</h2>

          <p className="muted-text">
            These saved details will be sent to the responder dashboard when SOS
            is raised.
          </p>

          <div className="profile-summary-grid">
            <div>
              <span>Name</span>
              <strong>{user.name}</strong>
            </div>

            <div>
              <span>RoadSoS ID</span>
              <strong>{user.roadSosId || "Generated after save"}</strong>
            </div>

            <div>
              <span>Blood Group</span>
              <strong>{user.bloodGroup}</strong>
            </div>

            <div>
              <span>Emergency Contact</span>
              <strong>{user.emergencyContact}</strong>
            </div>

            <div>
              <span>Registered Vehicles</span>
              <strong>{user.vehicles?.length || 0}</strong>
            </div>

            <div>
              <span>Safety Status</span>
              <strong>Ready</strong>
            </div>
          </div>
        </div>

        <CrashDetector user={user} location={location} setLocation={setLocation} />
        <div className="card emergency-card">
          <h2>Step 1: Detect My Location</h2>

          <p className="muted-text">
            RoadSoS needs your current location to send the emergency case to
            the responder dashboard.
          </p>

          <button className="secondary-btn full" onClick={getLocation}>
            Detect My Location
          </button>

          {location && (
            <p className="success-text">
              Location detected: {location.latitude.toFixed(4)},{" "}
              {location.longitude.toFixed(4)}
            </p>
          )}

          <div className="severity-box">
            Current Severity: <strong>{calculateSeverity()}</strong>
          </div>
        </div>

        <div className="card">
          <h2>Step 2: What happened to me?</h2>

          <p className="muted-text">
            Select what applies before sending SOS. These details help the
            responder understand your condition.
          </p>

          <label className="check-row">
            <input
              type="checkbox"
              checked={severityAnswers.injured}
              onChange={() => updateSeverity("injured")}
            />
            I am injured
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={severityAnswers.bleeding}
              onChange={() => updateSeverity("bleeding")}
            />
            I am bleeding
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={severityAnswers.cannotMove}
              onChange={() => updateSeverity("cannotMove")}
            />
            I cannot move properly
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={severityAnswers.dizzyOrUnconscious}
              onChange={() => updateSeverity("dizzyOrUnconscious")}
            />
            I feel dizzy or may lose consciousness
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={severityAnswers.vehicleBlocked}
              onChange={() => updateSeverity("vehicleBlocked")}
            />
            My vehicle is blocking the road
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={severityAnswers.fireOrSmoke}
              onChange={() => updateSeverity("fireOrSmoke")}
            />
            There is fire, smoke, or fuel leakage
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={severityAnswers.otherVictims}
              onChange={() => updateSeverity("otherVictims")}
            />
            There are other injured people near me
          </label>

          <textarea
            className="input-textarea"
            placeholder="Optional: describe what happened in one line, e.g. I fell from my bike near the highway turn."
            value={incidentNote}
            onChange={(e) => setIncidentNote(e.target.value)}
          />

          <div className="situation-preview">
            <strong>Emergency Summary:</strong>
            <p>
              {hasEmergencyDetails()
                ? getVictimSituationSummary()
                : "Select at least one condition or write a short note before sending SOS."}
            </p>
          </div>
        </div>

        <div className="card send-sos-card">
          <h2>Step 3: Send SOS</h2>

          <p className="muted-text">
            Once you press this button, RoadSoS will send your saved profile,
            location, severity, and emergency summary to the responder dashboard.
          </p>

          <button
            className="sos-btn"
            onClick={sendManualSos}
            disabled={sendingSos}
          >
            {sendingSos ? "Sending SOS..." : "I NEED HELP"}
          </button>

          {sosCreated && (
            <div className="alert-box">
              <h3>SOS Sent</h3>

              <p>
                <strong>Severity:</strong> {sosCreated.severity}
              </p>

              <p>
                <strong>Case ID:</strong> {sosCreated.id}
              </p>

              <a
                href={sosCreated.mapsLink}
                target="_blank"
                rel="noreferrer"
              >
                Open Accident Location
              </a>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="primary-btn full"
              >
                Send WhatsApp Alert
              </a>

              <a
                href={`tel:${user.emergencyContact}`}
                className="secondary-btn full"
              >
                Call Emergency Contact
              </a>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Live Location Map</h2>

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
          <h1>Personal Safety Mode</h1>
          <p>
            Victim-side access is designed for speed: create or load your
            profile once, then use one-tap emergency mode during an accident.
          </p>
        </div>

        <Link to="/citizen" className="small-link">
          Citizen Portal
        </Link>
      </div>

      {profileMode === "entry" && renderEntryScreen()}
      {(profileMode === "create" || profileMode === "edit") &&
        renderProfileForm()}
      {profileMode === "emergency" && renderEmergencyScreen()}
    </div>
  );
}

export default PersonalSafety;