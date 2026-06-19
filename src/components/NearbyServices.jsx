function NearbyServices({ location }) {
  if (!location) {
    return (
      <div className="card">
        <h2>Nearby Emergency Services</h2>
        <p>Detect location to view nearby emergency service suggestions.</p>
      </div>
    );
  }

  const services = [
    {
      type: "Trauma Centre",
      name: "Nearest Emergency Trauma Centre",
      distance: "1.2 km",
      eta: "5 min",
      icon: "TC",
      phone: "108"
    },
    {
      type: "Ambulance",
      name: "Rapid Ambulance Support",
      distance: "1.8 km",
      eta: "7 min",
      icon: "AM",
      phone: "108"
    },
    {
      type: "Police",
      name: "Nearest Traffic Police Unit",
      distance: "2.4 km",
      eta: "9 min",
      icon: "TP",
      phone: "100"
    },
    {
      type: "Vehicle Rescue",
      name: "Highway Towing & Rescue",
      distance: "3.1 km",
      eta: "12 min",
      icon: "VR",
      phone: "1800123456"
    }
  ];

  return (
    <div className="card">
      <h2>Nearby Emergency Services</h2>

      <p className="muted-text">
        Demo suggestions based on accident location:{" "}
        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
      </p>

      <div className="service-grid">
        {services.map((service, index) => (
          <div className="service-card" key={index}>
            <div className="service-icon">{service.icon}</div>

            <div>
              <h3>{service.name}</h3>
              <p>{service.type}</p>

              <div className="service-meta">
                <span>{service.distance}</span>
                <span>{service.eta}</span>
              </div>

              <div className="service-actions">
                <a href={`tel:${service.phone}`} className="call-btn">
                  Call
                </a>

                <a
                  href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="route-btn"
                >
                  Route
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NearbyServices;
