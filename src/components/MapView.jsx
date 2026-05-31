import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

function MapView({ latitude, longitude, height = "300px" }) {
  if (!latitude || !longitude) {
    return <div className="map-placeholder">Location not available yet.</div>;
  }

  return (
    <div style={{ height }}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%", borderRadius: "18px" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[latitude, longitude]}>
          <Popup>RoadSoS Emergency Location</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

export default MapView;