# RoadSoS: Golden-Hour Emergency Response Platform for Road Accidents

**RoadSoS** is an end-to-end emergency response platform for road accidents. It connects accident victims, bystanders, and responders through structured SOS cases, real-time location sharing, vehicle-number-based victim matching, registered emergency profiles, auto crash detection, and an admin dashboard.

> **Tagline:** From accident chaos to coordinated rescue.

---

## Table of Contents

1. [Overview](#overview)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution](#proposed-solution)
4. [Key Features](#key-features)
5. [System Architecture](#system-architecture)
6. [User Roles](#user-roles)
7. [Application Flow](#application-flow)
8. [Tech Stack](#tech-stack)
9. [Hardware Extension](#hardware-extension)
10. [Firebase Database Design](#firebase-database-design)
11. [Project Structure](#project-structure)
12. [Installation and Setup](#installation-and-setup)
13. [Environment Variables](#environment-variables)
14. [Firestore Rules for Prototype](#firestore-rules-for-prototype)
15. [Running the Project Locally](#running-the-project-locally)
16. [Deployment](#deployment)
17. [Demo Flow](#demo-flow)
18. [Security Notes](#security-notes)
19. [Assumptions](#assumptions)
20. [Limitations](#limitations)
21. [Future Scope](#future-scope)
22. [Conclusion](#conclusion)

---

## Overview

RoadSoS is a civic-tech emergency response system designed to reduce post-accident delay during the golden hour after road accidents.

In many road accidents, the victim may be unconscious, injured, panicked, or unable to use their phone. RoadSoS therefore does not depend only on the victim manually pressing an SOS button. It supports multiple emergency triggers:

1. Manual SOS from the victim.
2. Bystander accident reporting.
3. Phone-based auto crash detection demo.
4. ESP32-based hardware crash beacon extension.

The system converts accident information into a structured emergency case containing:

* Victim profile
* Accident location
* Severity
* Medical details
* Emergency contact
* Vehicle number
* Bystander observations
* Reporter trust level
* Sensor/crash detection data
* Recommended emergency action

All SOS cases are visible to the admin/responder dashboard in real time.

---

## Problem Statement

After road accidents, emergency response is often delayed because:

* Victims may be unconscious or unable to communicate.
* Bystanders may not know whom to contact.
* Accident location may not be clearly shared.
* Emergency contacts are often not informed quickly.
* Responders receive incomplete and unstructured information.
* Medical details such as blood group, allergies, and conditions are unavailable at the scene.
* Vehicle numbers are visible but are not connected to any emergency identity database.
* There is no single workflow connecting victims, bystanders, responders, hospitals, police, ambulance, and rescue services.
* Low-cost hardware-level crash detection is usually absent in civic emergency systems.

RoadSoS addresses these gaps by creating a structured digital emergency workflow.

---

## Proposed Solution

RoadSoS has two main portals:

### 1. Citizen Portal

The Citizen Portal has two flows:

#### Victim / I Need Help

For registered users who may need emergency help themselves.

The user creates a RoadSoS profile once. During an emergency, the app loads the saved profile and shows only the emergency action flow.

#### Bystander / Report Accident

For citizens who witness an accident involving someone else.

A bystander can report the accident using the vehicle number, approximate age, gender, visible conditions, and accident location.

---

### 2. Admin / Responder Portal

The Admin Dashboard allows responders to:

* View live SOS cases.
* View registered users database.
* Verify bystander reports.
* Match victims using vehicle numbers.
* View severity and confidence labels.
* See location on map.
* View nearby emergency services.
* Update case status.
* Coordinate help.

---

## Key Features

### Citizen Portal

* Victim and bystander access in one citizen-facing portal.
* Fast emergency workflow.
* Phone-number-based profile loading.
* Profile auto-load using browser `localStorage`.
* Registered user database.
* Multiple vehicles per user.
* Vehicle number normalization.
* First-person victim emergency details.
* Bystander accident report.
* Registered/guest bystander trust model.
* Real-time location capture.
* Severity classification.
* Nearby emergency services suggestions.

---

### Victim Flow Features

* Create new RoadSoS profile.
* Load existing profile using phone number.
* Save profile in Firebase Firestore.
* Add personal details:

  * Name
  * Phone number
  * Age
  * Gender
* Add medical details:

  * Blood group
  * Medical conditions
  * Allergies
* Add emergency contact.
* Add multiple vehicles.
* Hide full profile during emergency.
* Detect current location.
* Select first-person emergency condition:

  * I am injured.
  * I am bleeding.
  * I cannot move properly.
  * I feel dizzy or may lose consciousness.
  * My vehicle is blocking the road.
  * There is fire, smoke, or fuel leakage.
  * There are other injured people near me.
* Send manual SOS only after location and emergency details are provided.

---

### Bystander Flow Features

* Uses saved RoadSoS profile automatically if available.
* Allows loading an existing profile using phone number.
* Allows guest reporting if not registered.
* Captures bystander/reporter type:

  * Registered RoadSoS user
  * Guest with contact
  * Anonymous guest
* Captures accident details:

  * Vehicle number
  * Vehicle type
  * Approximate victim age
  * Victim gender
  * Number of victims
  * Optional note
* Captures observed conditions:

  * Victim appears unconscious.
  * Victim appears to be bleeding.
  * Victim cannot move properly.
  * Road is blocked.
  * Fire, smoke, or fuel leakage is visible.
  * Multiple victims may be involved.
* Assigns confidence score and verification status.

---

### Admin Dashboard Features

* Live SOS cases from Firestore.
* Registered users database.
* Stats overview:

  * Total cases
  * Critical cases
  * New cases
  * Needs verification
  * Verified cases
  * Bystander reports
  * Resolved cases
* SOS case cards.
* Reporter verification section.
* Auto-crash details section.
* Victim matching section.
* Known/matched victim profile.
* Accident map.
* Nearby emergency services.
* Case status update buttons.
* Vehicle-number-based victim matching.
* Match confidence and matching reasons.

---

### Auto Crash Detection Demo

RoadSoS includes a phone-based auto crash detection demo.

Features:

* Enable crash detection.
* Automatically request location when enabled.
* Simulate crash for demo reliability.
* Show 10-second countdown.
* User can press:

  * `I AM SAFE`
  * `I NEED HELP NOW`
* If the user confirms help, the case is marked as:

```text
triggerType: CRITICAL_MANUAL_SOS
detectionSource: AUTO_CRASH_DETECTION
```

* If the user does not respond, the case is marked as:

```text
triggerType: AUTO_ESCALATION
detectionSource: AUTO_CRASH_DETECTION
```

Admin dashboard displays auto-crash cases as high-priority cases.

---

## System Architecture

```text
Citizen Portal
│
├── Victim / I Need Help
│   ├── Create profile
│   ├── Load profile
│   ├── Detect location
│   ├── Select emergency details
│   ├── Manual SOS
│   └── Auto crash detection
│
├── Bystander / Report Accident
│   ├── Registered reporter
│   ├── Guest reporter
│   ├── Accident location
│   ├── Vehicle details
│   ├── Observed conditions
│   └── Bystander report
│
└── Firebase Firestore
    ├── registered_users
    └── sos_cases

Admin / Responder Portal
│
├── Live SOS cases
├── Registered users database
├── Vehicle-based victim matching
├── Confidence and severity labels
├── Nearby services
└── Status tracking
```

---

## User Roles

### 1. Registered Victim / User

A registered user creates a RoadSoS safety profile before an emergency.

The profile includes:

* Personal identity
* Medical details
* Emergency contact
* Registered vehicles

During an emergency, the saved profile is automatically attached to the SOS case.

---

### 2. Bystander

A bystander can report an accident for someone else.

Bystander types:

| Reporter Type           | Description                 | Trust Level |
| ----------------------- | --------------------------- | ----------- |
| Registered RoadSoS User | Saved profile available     | High        |
| Guest with Contact      | Guest provides phone number | Medium      |
| Anonymous Guest         | No contact details          | Low         |

---

### 3. Admin / Responder

The admin represents a responder control room, such as:

* Ambulance control
* Police
* Highway patrol
* Hospital emergency desk
* Campus security
* Municipal road safety cell

Admin can verify reports, match victims, and coordinate help.

---

## Application Flow

### Victim Flow

```text
Citizen Portal
↓
I Need Help
↓
Create New Profile OR Load Existing Profile
↓
Emergency Profile Active
↓
Auto Crash Detection / Manual SOS
↓
Detect Location
↓
Select “What happened to me?”
↓
I NEED HELP
↓
SOS case created in Firebase
↓
Admin Dashboard receives case
```

---

### Bystander Flow

```text
Citizen Portal
↓
Report Accident
↓
Saved RoadSoS profile used automatically if available
OR
Load existing profile / Continue as guest
↓
Detect accident location
↓
Enter victim and vehicle details
↓
Select observed conditions
↓
Submit accident report
↓
Verification-required case created
↓
Admin verifies and matches victim
```

---

### Admin Flow

```text
Admin Dashboard
↓
View live SOS cases
↓
Check severity, trigger type, and confidence
↓
If bystander report, search victim by vehicle number
↓
Confirm victim match
↓
Notify emergency contact
↓
Assign help
↓
Update case status
```

---

## Tech Stack

| Category           | Technology                          |
| ------------------ | ----------------------------------- |
| Frontend           | React.js                            |
| Build Tool         | Vite                                |
| Database / Backend | Firebase Firestore                  |
| Routing            | React Router DOM                    |
| Maps               | React Leaflet                       |
| Map Tiles          | OpenStreetMap                       |
| Styling            | CSS                                 |
| Browser APIs       | Geolocation API, DeviceMotion API   |
| Alerts             | WhatsApp deep link, phone call link |
| Deployment         | Vercel                              |

---

## Hardware Extension

### RoadSoS Smart Crash Beacon

RoadSoS can be extended using a low-cost ESP32-based crash detection beacon.

The device can be mounted on:

* Bike
* Helmet
* Scooter
* Vehicle dashboard

### Components

| Component            | Purpose                   |
| -------------------- | ------------------------- |
| ESP32 DevKit         | Main controller and Wi-Fi |
| MPU6050 / ADXL345    | Accelerometer / gyroscope |
| Buzzer               | Local alert               |
| Red LED              | Visual warning            |
| Push button          | Cancel false alarm        |
| Power bank / battery | Portable power            |
| Optional NEO-6M GPS  | Hardware-based location   |

### Hardware Flow

```text
Vehicle impact
↓
Accelerometer detects sudden spike
↓
ESP32 turns on buzzer and LED
↓
Cancel window starts
↓
If button is not pressed
↓
ESP32 sends hardware crash alert
↓
Admin dashboard receives case
```

### Hardware Firestore Case

```js
{
  triggerType: "HARDWARE_CRASH_ALERT",
  detectionSource: "ESP32_CRASH_BEACON",
  sosSource: "VEHICLE_HARDWARE",
  severity: "Critical",
  status: "New",
  hardwareDevice: {
    deviceId: "RS-HW-001",
    vehicleNumber: "GA 03 AB 1234",
    vehicleNumberNormalized: "GA03AB1234",
    sensor: "MPU6050",
    board: "ESP32"
  },
  sensorData: {
    accelerationMagnitude: 3.4,
    threshold: 2.8,
    detectionMethod: "accelerometer_impact_threshold"
  },
  location: {
    latitude: 15.4909,
    longitude: 73.8278
  }
}
```

---

## Firebase Database Design

RoadSoS uses two main Firestore collections.

---

### 1. `registered_users`

Stores saved RoadSoS user profiles.

Example:

```js
{
  roadSosId: "RS-1234",
  name: "Aryan Kumar",
  phone: "919876543210",
  phoneNormalized: "919876543210",
  age: "21",
  gender: "Male",
  emergencyContact: "919999999999",
  bloodGroup: "O+",
  medicalConditions: "None provided",
  allergies: "None provided",
  vehicles: [
    {
      vehicleNumber: "GA 03 AB 1234",
      vehicleNumberNormalized: "GA03AB1234",
      vehicleType: "Two-wheeler",
      vehicleName: "Activa",
      primary: true
    }
  ],
  vehicleNumbersNormalized: ["GA03AB1234"],
  profileStatus: "ACTIVE",
  createdAt: "...",
  updatedAt: "..."
}
```

---

### 2. `sos_cases`

Stores all emergency cases.

Types of SOS cases:

* Manual victim SOS
* Bystander report
* Phone auto crash detection
* Hardware crash beacon alert

---

### Manual Victim SOS Example

```js
{
  triggerType: "MANUAL_VICTIM_SOS",
  detectionSource: "MANUAL_APP_OPEN",
  sosSource: "REGISTERED_USER",
  victimIdentityStatus: "KNOWN",
  confidenceLevel: "HIGH",
  user: {...},
  location: {...},
  severity: "Critical",
  severityAnswers: {...},
  victimSituationSummary: "I am bleeding. I cannot move properly.",
  incidentNote: "",
  recommendedAction: "Dispatch ambulance...",
  status: "New",
  createdAt: "..."
}
```

---

### Bystander Report Example

```js
{
  triggerType: "BYSTANDER_REPORT",
  detectionSource: "BYSTANDER_APP_OPEN",
  sosSource: "BYSTANDER",
  reporterType: "REGISTERED_ROADSOS_USER",
  reporterIdentityStatus: "KNOWN",
  bystander: {...},
  victimIdentityStatus: "UNVERIFIED_VEHICLE_PROVIDED",
  confidenceScore: 90,
  confidenceLevel: "HIGH",
  verificationRequired: true,
  reportedVehicleNumber: "GA 03 AB 1234",
  reportedVehicleNumberNormalized: "GA03AB1234",
  vehicleType: "Two-wheeler",
  approxAge: "18-25",
  gender: "Male",
  victimsCount: "1",
  location: {...},
  severity: "Critical",
  conditionAnswers: {...},
  situationSummary: "Vehicle number visible...",
  status: "Needs Verification",
  createdAt: "..."
}
```

---

### Auto Crash Case Example

```js
{
  triggerType: "AUTO_ESCALATION",
  detectionSource: "AUTO_CRASH_DETECTION",
  sosSource: "REGISTERED_USER",
  victimIdentityStatus: "KNOWN",
  confidenceLevel: "HIGH",
  severity: "Critical",
  user: {...},
  location: {...},
  sensorData: {
    detectionMethod: "phone_accelerometer_or_demo_simulation",
    impactThreshold: 30,
    lastMagnitude: "Simulated crash"
  },
  status: "New",
  createdAt: "..."
}
```

---

## Key Algorithms and Logic

### 1. Vehicle Number Normalization

Vehicle numbers are normalized before storing and matching.

```js
const normalizeVehicleNumber = (vehicleNumber) => {
  return vehicleNumber.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
};
```

Example:

```text
GA 03 AB 1234 → GA03AB1234
```

This improves matching between bystander-entered vehicle numbers and registered user profiles.

---

### 2. Severity Classification

Severity is calculated based on emergency indicators.

Examples of high-risk indicators:

* Unconsciousness
* Heavy bleeding
* Cannot move
* Fire/smoke/fuel leakage
* Multiple victims

Severity levels:

| Severity | Meaning                                 |
| -------- | --------------------------------------- |
| Low      | Minimal risk indicators                 |
| Moderate | One or more serious indicators          |
| Critical | High-risk or multiple severe indicators |

---

### 3. Bystander Confidence Score

A bystander report receives a confidence score based on:

* Registered reporter profile
* Phone number provided
* Location detected
* Vehicle number provided
* Emergency conditions selected
* Additional note provided

This helps the admin prioritize genuine reports.

---

### 4. Victim Matching Confidence

Victim matching uses:

| Evidence                   | Weight     |
| -------------------------- | ---------- |
| Vehicle number exact match | Strongest  |
| Age range match            | Supporting |
| Gender match               | Supporting |
| Vehicle type match         | Supporting |

Example:

```text
Vehicle number matched
Gender matched
Age range matched
Vehicle type matched
→ Match Confidence: 100/100
```

---

### 5. Auto Crash Detection

Phone-based crash detection supports:

* Motion sensor monitoring
* Simulation mode for demo
* Automatic location request
* Countdown after crash detection
* User cancellation using `I AM SAFE`
* Confirmed SOS using `I NEED HELP NOW`
* Auto escalation if no response

---

## Project Structure

```text
roadsos-final/
├── package.json
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── firebase.js
│   ├── styles.css
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── CitizenPortal.jsx
│   │   ├── PersonalSafety.jsx
│   │   ├── BystanderReport.jsx
│   │   └── AdminDashboard.jsx
│   │
│   └── components/
│       ├── MapView.jsx
│       ├── NearbyServices.jsx
│       ├── MedicalIDCard.jsx
│       ├── SOSCard.jsx
│       └── CrashDetector.jsx
```

---

## File Explanation

### `main.jsx`

React entry point. Imports global CSS and Leaflet CSS.

### `App.jsx`

Defines all application routes:

* `/`
* `/citizen`
* `/safety`
* `/report`
* `/admin`

### `firebase.js`

Initializes Firebase and exports Firestore database instance.

### `Home.jsx`

Landing page with two main portals:

* Citizen Portal
* Admin / Responder Portal

### `CitizenPortal.jsx`

Allows user to choose:

* I Need Help
* Report Accident

### `PersonalSafety.jsx`

Handles the victim-side flow:

* Create profile
* Load profile
* Save profile
* Detect location
* Manual SOS
* Auto crash detector integration

### `BystanderReport.jsx`

Handles bystander reporting:

* Registered bystander identity
* Guest bystander mode
* Accident location
* Vehicle/victim details
* Observed emergency conditions
* Confidence scoring
* Firestore report creation

### `AdminDashboard.jsx`

Displays:

* Live SOS cases
* Registered users database
* Dashboard stats
* Case tabs
* Real-time Firestore updates

### `SOSCard.jsx`

Displays individual SOS case details:

* Trigger type
* Severity
* Reporter verification
* Victim matching
* Auto-crash data
* Map
* Nearby services
* Status controls

### `CrashDetector.jsx`

Handles phone auto crash detection demo:

* Enable monitoring
* Simulate crash
* Countdown
* Confirmed crash SOS
* Auto escalation

### `MapView.jsx`

Displays location using React Leaflet and OpenStreetMap.

### `NearbyServices.jsx`

Displays demo nearby emergency services.

### `styles.css`

Contains all styling for the application.

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/roadsos.git
cd roadsos
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Required Packages

```bash
npm install firebase react-router-dom react-leaflet leaflet
```

### 4. Create Firebase Project

1. Go to Firebase Console.
2. Create a new Firebase project.
3. Enable Firestore Database.
4. Create a Firebase Web App.
5. Copy Firebase configuration.

---

## Environment Variables

Create a `.env` file in the project root.

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Important

Do not commit `.env` to GitHub.

Add this to `.gitignore`:

```gitignore
.env
.env.local
.env.*.local
```

---

## Firestore Rules for Prototype

For hackathon/demo testing only:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /registered_users/{document=**} {
      allow read, write: if true;
    }

    match /sos_cases/{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Warning

These rules are open for prototype demonstration only. Do not use them in production with real user data.

---

## Running the Project Locally

```bash
npm run dev
```

Open:

```text
http://localhost:5173/
```

---

## Build for Production

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Deployment

The project can be deployed on Vercel.

### Vercel Settings

| Setting          | Value           |
| ---------------- | --------------- |
| Framework Preset | Vite            |
| Build Command    | `npm run build` |
| Output Directory | `dist`          |
| Install Command  | `npm install`   |

Add all `VITE_FIREBASE_*` environment variables in Vercel Project Settings.

---

## Demo Flow

### Demo 1: Create Victim Profile and Send Manual SOS

1. Open RoadSoS.
2. Go to Citizen Portal.
3. Choose `I Need Help`.
4. Create a new RoadSoS profile.
5. Add multiple vehicles.
6. Save profile.
7. Detect location.
8. Select emergency conditions.
9. Press `I NEED HELP`.
10. Open Admin Dashboard.
11. Verify the manual victim SOS appears.

---

### Demo 2: Bystander Report

1. Go to Citizen Portal.
2. Choose `Report Accident`.
3. Use registered profile or continue as guest.
4. Detect accident location.
5. Enter vehicle number, age, gender, and vehicle type.
6. Select observed conditions.
7. Submit report.
8. Open Admin Dashboard.
9. Verify bystander report appears with confidence score and verification status.

---

### Demo 3: Victim Matching

1. Register a user with vehicle number:

```text
GA 03 AB 1234
```

2. Submit a bystander report with the same vehicle number.
3. Open Admin Dashboard.
4. Click `Find Victim Match by Vehicle Number`.
5. Verify match confidence and match reasons.
6. Confirm victim match.

---

### Demo 4: Phone Auto Crash Detection

1. Open Personal Safety Mode.
2. Detect or allow automatic location.
3. Enable Auto Crash Detection.
4. Click `Simulate Crash for Demo`.
5. Press `I NEED HELP NOW`.
6. Open Admin Dashboard.
7. Verify high-priority crash case appears.
8. Repeat and allow countdown to reach zero.
9. Verify auto escalation case appears.

---

### Demo 5: Hardware Crash Beacon

1. Keep Admin Dashboard open.
2. Power ESP32 crash beacon.
3. Simulate impact.
4. Buzzer and LED activate.
5. Do not press cancel button.
6. Hardware sends crash alert.
7. Admin receives hardware-generated emergency case.
8. Admin matches vehicle number and coordinates help.

---

## Security Notes

* Firebase API keys should not be hardcoded in source code.
* Use `.env` variables for Firebase configuration.
* Do not commit `.env`.
* Restrict Firebase/Google API keys in Google Cloud Console.
* Firestore rules must be secured before real deployment.
* Do not store real personal data while using open prototype rules.
* Bystander reports require admin verification before family/contact notification.

---

## Assumptions

* Users give consent while creating RoadSoS profiles.
* Location sharing is allowed during emergency use.
* Nearby emergency services are demo/static suggestions.
* Admin dashboard represents a responder control room.
* Guest bystander reports are allowed but require verification.
* Vehicle-number matching is limited to registered RoadSoS users.
* Phone-based crash detection uses browser support and demo simulation.
* Hardware beacon may use demo/static location unless GPS is added.
* The prototype does not claim official government emergency integration.

---

## Limitations

* No production-level authentication yet.
* Firestore rules are open for demo.
* Nearby services are not live API-integrated.
* Phone crash detection depends on device/browser support.
* Guest reports can be spammed, so confidence scoring and verification are used.
* Hardware GPS is optional.
* Emergency dispatch is simulated through dashboard actions.
* Push notifications are not yet implemented.
* Vehicle matching depends on accurate user profile data.

---

## Future Scope

* Native Android application.
* Firebase Authentication / phone OTP login.
* Background crash detection service.
* Push notifications to responders and emergency contacts.
* GPS-enabled hardware crash beacon.
* QR/NFC vehicle or helmet sticker.
* Real hospital, ambulance, police, and trauma centre API integration.
* Role-based admin dashboard.
* Government/highway authority integration.
* Ambulance route optimization.
* ML-based crash detection using accelerometer and gyroscope patterns.
* Duplicate accident report clustering.
* Response-time analytics dashboard.
* Secure production Firestore rules.

---

## Conclusion

RoadSoS does not just send an SOS. It creates a structured rescue pathway by connecting victim identity, accident location, severity, bystander reporting, crash detection, vehicle matching, hardware alerts, and responder coordination into one emergency workflow.

The platform demonstrates how software, hardware, and civic response systems can work together to reduce post-accident delays and improve golden-hour emergency response.

---

## License

This project is built as a hackathon prototype. Add your preferred license before public production release.

---

## Author / Team

```text
Team Name:
Team Members:
Institution:
Contact:
```
