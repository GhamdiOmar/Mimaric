"use client";

import * as React from "react";
import dynamic from "next/dynamic";

// Types for the inner map component
interface MapInnerProps {
  lat: number;
  lng: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  readonly?: boolean;
  height?: string;
  zoom?: number;
}

// Dynamically import the map to avoid SSR issues with Leaflet
const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => (
    <div className="bg-muted/30 rounded-md flex items-center justify-center text-muted-foreground text-sm" style={{ height: 300 }}>
      جاري تحميل الخريطة...
    </div>
  ),
});

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  onLocationSelect?: (lat: number, lng: number) => void;
  readonly?: boolean;
  height?: string;
  zoom?: number;
}

export default function MapPicker({
  latitude,
  longitude,
  onLocationSelect,
  readonly = false,
  height = "300px",
  zoom = 12,
}: MapPickerProps) {
  // Default center: Riyadh, Saudi Arabia
  const lat = latitude ?? 24.7136;
  const lng = longitude ?? 46.6753;

  return (
    <div className="rounded-md overflow-hidden border border-border" style={{ height }}>
      <MapInner
        lat={lat}
        lng={lng}
        onLocationSelect={onLocationSelect}
        readonly={readonly}
        height={height}
        zoom={zoom}
      />
    </div>
  );
}
