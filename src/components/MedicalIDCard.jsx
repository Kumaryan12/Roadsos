function MedicalIDCard({ user }) {
  const primaryVehicle =
    user.vehicles?.find((vehicle) => vehicle.primary) || user.vehicles?.[0];

  if (!user || !user.name) {
    return (
      <div className="medical-card">
        <h2>Emergency Medical ID</h2>
        <p>Fill your RoadSoS profile to generate your medical ID card.</p>
      </div>
    );
  }

  return (
    <div className="medical-card">
      <div className="medical-header">
        <div>
          <h2>Emergency Medical ID</h2>
          <p>Critical identity and medical details for responders.</p>
        </div>

        <span className="medical-badge">RoadSoS</span>
      </div>

      <div className="medical-grid">
        <div>
          <span>Name</span>
          <strong>{user.name || "Not provided"}</strong>
        </div>

        <div>
          <span>Phone</span>
          <strong>{user.phone || "Not provided"}</strong>
        </div>

        <div>
          <span>Age / Gender</span>
          <strong>
            {user.age || "?"} / {user.gender || "Not provided"}
          </strong>
        </div>

        <div>
          <span>Blood Group</span>
          <strong>{user.bloodGroup || "Not provided"}</strong>
        </div>

        <div>
          <span>Emergency Contact</span>
          <strong>{user.emergencyContact || "Not provided"}</strong>
        </div>

        <div>
          <span>Primary Vehicle</span>
          <strong>
            {primaryVehicle?.vehicleNumber
              ? `${primaryVehicle.vehicleNumber} (${primaryVehicle.vehicleType})`
              : "Not provided"}
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

        <div>
          <span>Registered Vehicles</span>
          <strong>{user.vehicles?.length || 0}</strong>
        </div>
      </div>
    </div>
  );
}

export default MedicalIDCard;