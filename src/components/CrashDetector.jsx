import { useEffect, useRef, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

function CrashDetector({ user, location, setLocation }) {
  const [monitoring, setMonitoring] = useState(false);
  const [crashDetected, setCrashDetected] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [sendingAutoSos, setSendingAutoSos] = useState(false);
  const [autoSosCreated, setAutoSosCreated] = useState(null);
  const [lastMagnitude, setLastMagnitude] = useState(null);
  const [sensorSupported] = useState(
    () => typeof window !== "undefined" && "DeviceMotionEvent" in window
  );
  const [gettingLocation, setGettingLocation] = useState(false);

  const countdownRef = useRef(null);
  const crashActiveRef = useRef(false);
  const latestLocationRef = useRef(location);

  const IMPACT_THRESHOLD = 30;

  useEffect(() => {
    latestLocationRef.current = location;
  }, [location]);

  const requestCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      setGettingLocation(true);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const detectedLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };

          setLocation(detectedLocation);
          latestLocationRef.current = detectedLocation;
          setGettingLocation(false);
          resolve(detectedLocation);
        },
        (error) => {
          setGettingLocation(false);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const ensureLocationReady = async () => {
    if (latestLocationRef.current) {
      return latestLocationRef.current;
    }

    try {
      const detectedLocation = await requestCurrentLocation();
      return detectedLocation;
    } catch (error) {
      console.error(error);
      alert("Location permission is required for auto crash detection.");
      return null;
    }
  };

  const triggerCrashAlert = async () => {
    const activeLocation = await ensureLocationReady();

    if (!activeLocation) return;

    crashActiveRef.current = true;
    setCrashDetected(true);
    setCountdown(10);
    setAutoSosCreated(null);
  };

  const cancelCrashAlert = () => {
    clearTimeout(countdownRef.current);
    crashActiveRef.current = false;
    setCrashDetected(false);
    setCountdown(10);
  };

  const getMapsLink = () => {
    const activeLocation = latestLocationRef.current;

    if (!activeLocation) return "#";

    return `https://www.google.com/maps?q=${activeLocation.latitude},${activeLocation.longitude}`;
  };

  const buildAutoSosData = (triggerType, summary) => {
    const activeLocation = latestLocationRef.current;

    return {
      triggerType,
      detectionSource: "AUTO_CRASH_DETECTION",
      sosSource: "REGISTERED_USER",

      victimIdentityStatus: "KNOWN",
      confidenceLevel: "HIGH",
      emergencyContactNotified: false,

      user,
      location: activeLocation,
      severity: "Critical",

      severityAnswers: {
        autoCrashDetected: true,
        noResponse: triggerType === "AUTO_ESCALATION",
        victimConfirmedHelp: triggerType === "CRITICAL_MANUAL_SOS"
      },

      victimSituationSummary: summary,
      incidentNote: summary,

      sensorData: {
        detectionMethod: "phone_accelerometer_or_demo_simulation",
        impactThreshold: IMPACT_THRESHOLD,
        lastMagnitude: lastMagnitude || "Simulated crash"
      },

      recommendedAction:
        "Treat as critical crash event. Dispatch ambulance, notify police, route to nearest trauma centre, and alert emergency contact.",

      status: "New",

      timeline: [
        {
          label: "Crash Detection Triggered",
          description: summary,
          time: new Date().toISOString()
        }
      ],

      createdAt: serverTimestamp()
    };
  };

  const sendConfirmedCrashSos = async () => {
    const activeLocation = await ensureLocationReady();

    if (!activeLocation) {
      alert("Location is required before sending SOS.");
      return;
    }

    setSendingAutoSos(true);

    try {
      const summary =
        "A possible crash was detected by RoadSoS, and I confirmed that I need help now.";

      const sosData = buildAutoSosData("CRITICAL_MANUAL_SOS", summary);

      const docRef = await addDoc(collection(db, "sos_cases"), sosData);

      setAutoSosCreated({
        id: docRef.id,
        triggerType: "CRITICAL_MANUAL_SOS",
        summary,
        mapsLink: getMapsLink()
      });

      clearTimeout(countdownRef.current);
      setCrashDetected(false);
      crashActiveRef.current = false;

      alert("Critical crash SOS sent successfully.");
    } catch (error) {
      console.error(error);
      alert("Failed to send crash SOS.");
    }

    setSendingAutoSos(false);
  };

  const sendAutoEscalationSos = async () => {
    const activeLocation = await ensureLocationReady();

    if (!activeLocation || sendingAutoSos) return;

    setSendingAutoSos(true);

    try {
      const summary =
        "A possible crash was detected by RoadSoS. I did not respond to the safety countdown, so the case was automatically escalated.";

      const sosData = buildAutoSosData("AUTO_ESCALATION", summary);

      const docRef = await addDoc(collection(db, "sos_cases"), sosData);

      setAutoSosCreated({
        id: docRef.id,
        triggerType: "AUTO_ESCALATION",
        summary,
        mapsLink: getMapsLink()
      });

      setCrashDetected(false);
      crashActiveRef.current = false;

      alert("Auto escalation SOS sent.");
    } catch (error) {
      console.error(error);
      alert("Failed to send auto escalation SOS.");
    }

    setSendingAutoSos(false);
  };

  useEffect(() => {
    if (!monitoring) return;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity;

      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      const magnitude = Math.sqrt(x * x + y * y + z * z);
      setLastMagnitude(magnitude.toFixed(2));

      if (magnitude > IMPACT_THRESHOLD && !crashActiveRef.current) {
        triggerCrashAlert();
      }
    };

    window.addEventListener("devicemotion", handleMotion);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
    };
  }, [monitoring]);

  useEffect(() => {
    if (!crashDetected) return;

    if (countdown <= 0) {
      const escalationTimer = setTimeout(() => {
        sendAutoEscalationSos();
      }, 0);

      return () => clearTimeout(escalationTimer);
    }

    countdownRef.current = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(countdownRef.current);
  }, [crashDetected, countdown]);

  const enableMonitoring = async () => {
    const activeLocation = await ensureLocationReady();

    if (!activeLocation) return;

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission === "function"
    ) {
      try {
        const permission = await DeviceMotionEvent.requestPermission();

        if (permission !== "granted") {
          alert("Motion sensor permission was not granted.");
          return;
        }
      } catch (error) {
        console.error(error);
        alert("Unable to request motion sensor permission.");
        return;
      }
    }

    setMonitoring(true);
  };

  const disableMonitoring = () => {
    setMonitoring(false);
    cancelCrashAlert();
  };

  return (
    <div className="card crash-detector-card">
      <div className="crash-header">
        <div>
          <h2>Auto Crash Detection</h2>
          <p>
            RoadSoS can monitor sudden crash-like motion and start an emergency
            countdown. Location is requested automatically when enabled.
          </p>
        </div>

        <span className={monitoring ? "monitoring-chip on" : "monitoring-chip"}>
          {monitoring ? "Monitoring ON" : "Monitoring OFF"}
        </span>
      </div>

      <div className="crash-info-grid">
        <div>
          <span>Location Status</span>
          <strong>
            {gettingLocation
              ? "Getting location..."
              : location
              ? "Location ready"
              : "Location needed"}
          </strong>
        </div>

        <div>
          <span>Sensor Support</span>
          <strong>{sensorSupported ? "Available" : "Demo mode available"}</strong>
        </div>

        <div>
          <span>Impact Threshold</span>
          <strong>{IMPACT_THRESHOLD} m/s²</strong>
        </div>

        <div>
          <span>Last Motion Reading</span>
          <strong>
            {lastMagnitude ? `${lastMagnitude} m/s²` : "Not available"}
          </strong>
        </div>
      </div>

      <div className="crash-actions">
        {!monitoring ? (
          <button
            className="secondary-btn"
            onClick={enableMonitoring}
            disabled={gettingLocation}
          >
            {gettingLocation ? "Getting Location..." : "Enable Crash Detection"}
          </button>
        ) : (
          <button className="danger-light-btn" onClick={disableMonitoring}>
            Disable Crash Detection
          </button>
        )}

        <button
          className="primary-btn"
          onClick={triggerCrashAlert}
          disabled={gettingLocation}
        >
          {gettingLocation ? "Getting Location..." : "Simulate Crash for Demo"}
        </button>
      </div>

      {crashDetected && (
        <div className="crash-alert-box">
          <h2>Possible Accident Detected</h2>

          <p>
            RoadSoS detected a crash-like event. If you do not respond, an SOS
            will be sent automatically.
          </p>

          <div className="countdown-circle">{countdown}</div>

          <div className="crash-alert-actions">
            <button className="safe-btn" onClick={cancelCrashAlert}>
              I AM SAFE
            </button>

            <button
              className="sos-btn"
              onClick={sendConfirmedCrashSos}
              disabled={sendingAutoSos}
            >
              {sendingAutoSos ? "Sending..." : "I NEED HELP NOW"}
            </button>
          </div>
        </div>
      )}

      {autoSosCreated && (
        <div className="alert-box">
          <h3>Crash SOS Created</h3>

          <p>
            <strong>Trigger:</strong> {autoSosCreated.triggerType}
          </p>

          <p>
            <strong>Case ID:</strong> {autoSosCreated.id}
          </p>

          <p>
            <strong>Summary:</strong> {autoSosCreated.summary}
          </p>

          <a
            href={autoSosCreated.mapsLink}
            target="_blank"
            rel="noreferrer"
          >
            Open Accident Location
          </a>
        </div>
      )}
    </div>
  );
}

export default CrashDetector;
