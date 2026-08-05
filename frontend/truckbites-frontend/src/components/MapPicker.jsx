import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function LocationMarker({ position, onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  if (!position) return null;
  return (
    <Marker
      position={[position.lat, position.lng]}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const latlng = e.target.getLatLng();
          onLocationChange(latlng.lat, latlng.lng);
        },
      }}
    />
  );
}

function MapBoundsUpdater({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
    }
  }, [position, map]);
  return null;
}

export default function MapPicker({ latitude, longitude, onLocationChange, height }) {
  const pickerHeight = height || '250px';
  const hasPosition = latitude != null && !isNaN(latitude) && longitude != null && !isNaN(longitude);
  const center = hasPosition ? [latitude, longitude] : [40.7128, -74.0060];
  const position = hasPosition ? { lat: latitude, lng: longitude } : null;

  return (
    <div className="rounded-card overflow-hidden border border-line shadow-soft" style={{ height: pickerHeight }}>
      <MapContainer center={center} zoom={hasPosition ? 15 : 12} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onLocationChange={onLocationChange} />
        <MapBoundsUpdater position={position} />
      </MapContainer>
      <div className="bg-cream px-3 py-2 text-xs text-body flex items-center gap-2 border-t border-line">
        <span className="inline-block w-2 h-2 rounded-full bg-primary" />
        Click the map or drag the marker to set location
      </div>
    </div>
  );
}
