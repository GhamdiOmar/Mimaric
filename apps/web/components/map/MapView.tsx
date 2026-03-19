"use client";

import * as React from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSON as GeoJSONType } from "geojson";
import { useMapStore } from "./useMapStore";
import { RIYADH_CENTER, DEFAULT_ZOOM } from "../../lib/map-utils";

// ─── Types ─────────────────────────────────────────────────
interface MapSource {
  id: string;
  type: "geojson";
  data: GeoJSONType;
}

interface MapLayer {
  id: string;
  sourceId: string;
  type: "fill" | "line" | "circle" | "symbol";
  paint: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown[];
  minzoom?: number;
  maxzoom?: number;
}

interface MapViewProps {
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  sources?: MapSource[];
  layers?: MapLayer[];
  onFeatureClick?: (feature: {
    id: string;
    properties: Record<string, unknown>;
    geometry: GeoJSONType;
  }) => void;
  onMapClick?: (lngLat: { lng: number; lat: number }) => void;
  interactive?: boolean;
  showControls?: boolean;
  children?: React.ReactNode;
}

// ─── Base Map Style (OSM raster tiles) ─────────────────────
function createBaseStyle(): maplibregl.StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: "osm-tiles",
        type: "raster",
        source: "osm",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

// ─── Component ─────────────────────────────────────────────
export default function MapView({
  className,
  initialCenter,
  initialZoom,
  sources,
  layers,
  onFeatureClick,
  onMapClick,
  interactive = true,
  showControls = true,
  children,
}: MapViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = React.useState(false);

  const { setCenter, setZoom } = useMapStore();

  const center = initialCenter ?? RIYADH_CENTER;
  const zoom = initialZoom ?? DEFAULT_ZOOM;

  // ─── Initialize Map ────────────────────────────────────
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: createBaseStyle(),
      center,
      zoom,
      interactive,
      attributionControl: false,
    });

    // Attribution in bottom-left
    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    // Navigation controls
    if (showControls) {
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: true }),
        "top-right",
      );
    }

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
    });

    // Sync viewport to store on move
    map.on("moveend", () => {
      const c = map.getCenter();
      setCenter([c.lng, c.lat]);
      setZoom(map.getZoom());
    });

    return () => {
      mapRef.current = null;
      setMapReady(false);
      map.remove();
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync Sources ──────────────────────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Guard: ensure map is not removed
    try {
      map.getCanvas();
    } catch {
      return;
    }

    const currentSourceIds = new Set<string>();

    // Add or update sources
    if (sources) {
      for (const src of sources) {
        currentSourceIds.add(src.id);
        const existing = map.getSource(src.id) as
          | maplibregl.GeoJSONSource
          | undefined;
        if (existing) {
          existing.setData(src.data as GeoJSON.GeoJSON);
        } else {
          map.addSource(src.id, {
            type: "geojson",
            data: src.data as GeoJSON.GeoJSON,
          });
        }
      }
    }

    // Remove stale sources (that we previously added, skip 'osm')
    const style = map.getStyle();
    if (!style) return;
    for (const id of Object.keys(style.sources ?? {})) {
      if (id === "osm") continue;
      if (!currentSourceIds.has(id)) {
        // Remove any layers depending on this source first
        for (const layer of style.layers ?? []) {
          if ("source" in layer && layer.source === id) {
            if (map.getLayer(layer.id)) map.removeLayer(layer.id);
          }
        }
        if (map.getSource(id)) map.removeSource(id);
      }
    }
  }, [sources, mapReady]);

  // ─── Sync Layers ───────────────────────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Guard: ensure map is not removed
    try {
      map.getCanvas();
    } catch {
      return;
    }

    const desiredLayerIds = new Set<string>();

    if (layers) {
      for (const layer of layers) {
        desiredLayerIds.add(layer.id);

        // Check if source exists before adding layer
        if (!map.getSource(layer.sourceId)) continue;

        if (map.getLayer(layer.id)) {
          // Update paint properties
          for (const [key, value] of Object.entries(layer.paint)) {
            map.setPaintProperty(layer.id, key, value);
          }
          // Update layout properties
          if (layer.layout) {
            for (const [key, value] of Object.entries(layer.layout)) {
              map.setLayoutProperty(layer.id, key, value);
            }
          }
          if (layer.filter) {
            map.setFilter(layer.id, layer.filter as maplibregl.FilterSpecification);
          }
        } else {
          map.addLayer({
            id: layer.id,
            type: layer.type,
            source: layer.sourceId,
            paint: layer.paint as Record<string, unknown>,
            layout: (layer.layout ?? {}) as Record<string, unknown>,
            ...(layer.filter
              ? { filter: layer.filter as maplibregl.FilterSpecification }
              : {}),
            ...(layer.minzoom !== undefined ? { minzoom: layer.minzoom } : {}),
            ...(layer.maxzoom !== undefined ? { maxzoom: layer.maxzoom } : {}),
          } as maplibregl.LayerSpecification);
        }
      }
    }

    // Remove stale layers (skip base 'osm-tiles')
    const style = map.getStyle();
    if (!style) return;
    for (const layer of style.layers ?? []) {
      if (layer.id === "osm-tiles") continue;
      if (!desiredLayerIds.has(layer.id)) {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
      }
    }
  }, [layers, mapReady]);

  // ─── Feature Click Handler ─────────────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const layerIds = (layers ?? []).map((l) => l.id);

    function handleClick(e: maplibregl.MapMouseEvent) {
      if (!map) return;
      if (layerIds.length > 0) {
        const validLayerIds = layerIds.filter((id) => {
          try { return !!map!.getLayer(id); } catch { return false; }
        });
        if (validLayerIds.length === 0) { onMapClick?.(e.lngLat); return; }
        const features = map!.queryRenderedFeatures(e.point, {
          layers: validLayerIds,
        });

        if (features.length > 0) {
          const feature = features[0]!;
          onFeatureClick?.({
            id: String(feature.id ?? feature.properties?.id ?? ""),
            properties: (feature.properties ?? {}) as Record<string, unknown>,
            geometry: feature.geometry as GeoJSONType,
          });
          return;
        }
      }
      onMapClick?.(e.lngLat);
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [layers, mapReady, onFeatureClick, onMapClick]);

  // ─── Cursor on Hover ───────────────────────────────────
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const layerIds = (layers ?? []).map((l) => l.id);

    function handleMouseEnter() {
      map!.getCanvas().style.cursor = "pointer";
    }
    function handleMouseLeave() {
      map!.getCanvas().style.cursor = "";
    }

    for (const id of layerIds) {
      try { if (!map.getLayer(id)) continue; } catch { continue; }
      map.on("mouseenter", id, handleMouseEnter);
      map.on("mouseleave", id, handleMouseLeave);
    }

    return () => {
      for (const id of layerIds) {
        try { if (!map.getLayer(id)) continue; } catch { continue; }
        map.off("mouseenter", id, handleMouseEnter);
        map.off("mouseleave", id, handleMouseLeave);
      }
    };
  }, [layers, mapReady]);

  return (
    <div
      className={className}
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {children}
    </div>
  );
}
