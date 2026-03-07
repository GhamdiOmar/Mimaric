"use client";

import * as React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with webpack/next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({
  lat,
  lng,
  onLocationSelect,
  readonly,
}: {
  lat: number;
  lng: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readonly: boolean;
}) {
  const [position, setPosition] = React.useState<L.LatLng>(new L.LatLng(lat, lng));

  React.useEffect(() => {
    setPosition(new L.LatLng(lat, lng));
  }, [lat, lng]);

  useMapEvents({
    click(e) {
      if (readonly) return;
      setPosition(e.latlng);
      onLocationSelect?.(e.latlng.lat, e.latlng.lng);
    },
  });

  return <Marker position={position} />;
}

function MapCenterUpdater({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface MapInnerProps {
  lat: number;
  lng: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readonly?: boolean;
  height?: string;
  zoom?: number;
}

export default function MapInner({
  lat,
  lng,
  onLocationSelect,
  readonly = false,
  height = "300px",
  zoom = 12,
}: MapInnerProps) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height, width: "100%" }}
      scrollWheelZoom={!readonly}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker lat={lat} lng={lng} onLocationSelect={onLocationSelect} readonly={readonly} />
      <MapCenterUpdater lat={lat} lng={lng} />
    </MapContainer>
  );
}
