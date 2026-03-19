import * as turf from "@turf/turf";
import type {
  GeoJSON,
  Geometry,
  Feature,
  FeatureCollection,
  Polygon,
  MultiPolygon,
  LineString,
} from "geojson";

// ─── Constants ─────────────────────────────────────────────
export const RIYADH_CENTER: [number, number] = [46.6753, 24.7136];
export const JEDDAH_CENTER: [number, number] = [39.1925, 21.4858];
export const DEFAULT_ZOOM = 12;

// ─── GeoJSON Validation ────────────────────────────────────
export function validateGeoJSON(data: unknown): {
  valid: boolean;
  error?: string;
} {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Data is not an object" };
  }

  const obj = data as Record<string, unknown>;

  if (!obj.type) {
    return { valid: false, error: 'Missing "type" property' };
  }

  const validTypes = [
    "Point",
    "MultiPoint",
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
    "GeometryCollection",
    "Feature",
    "FeatureCollection",
  ];

  if (!validTypes.includes(obj.type as string)) {
    return { valid: false, error: `Invalid type: "${String(obj.type)}"` };
  }

  if (obj.type === "FeatureCollection") {
    if (!Array.isArray(obj.features)) {
      return { valid: false, error: '"features" must be an array' };
    }
  }

  if (obj.type === "Feature") {
    if (!obj.geometry && obj.geometry !== null) {
      return { valid: false, error: '"geometry" property is required on Feature' };
    }
  }

  // Geometry types must have coordinates (except GeometryCollection)
  const geometryTypes = [
    "Point",
    "MultiPoint",
    "LineString",
    "MultiLineString",
    "Polygon",
    "MultiPolygon",
  ];
  if (geometryTypes.includes(obj.type as string)) {
    if (!Array.isArray(obj.coordinates)) {
      return { valid: false, error: '"coordinates" must be an array' };
    }
  }

  if (obj.type === "GeometryCollection") {
    if (!Array.isArray(obj.geometries)) {
      return { valid: false, error: '"geometries" must be an array' };
    }
  }

  return { valid: true };
}

// ─── Area Calculation ──────────────────────────────────────
export function calculateArea(geojson: Polygon | MultiPolygon): number {
  return turf.area(geojson);
}

// ─── Length Calculation ────────────────────────────────────
export function calculateLength(geojson: LineString): number {
  return turf.length(turf.lineString(geojson.coordinates), {
    units: "meters",
  });
}

// ─── Centroid ──────────────────────────────────────────────
export function getCentroid(geojson: Geometry): [number, number] {
  const centroid = turf.centroid(geojson as turf.AllGeoJSON);
  return centroid.geometry.coordinates as [number, number];
}

// ─── Bounding Box ──────────────────────────────────────────
export function getBounds(
  geojson: GeoJSON,
): [[number, number], [number, number]] {
  const bbox = turf.bbox(geojson as turf.AllGeoJSON);
  // bbox returns [minX, minY, maxX, maxY] = [sw_lng, sw_lat, ne_lng, ne_lat]
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ];
}

// ─── Entity to FeatureCollection ───────────────────────────
export function featureCollectionFromEntities(
  entities: Array<{ id: string; geometry: unknown; [key: string]: unknown }>,
): FeatureCollection {
  const features: Feature[] = [];

  for (const entity of entities) {
    if (!entity.geometry) continue;

    let geometry: Geometry;
    if (typeof entity.geometry === "string") {
      try {
        geometry = JSON.parse(entity.geometry) as Geometry;
      } catch {
        continue;
      }
    } else {
      geometry = entity.geometry as Geometry;
    }

    // Extract properties (everything except id and geometry)
    const { id, geometry: _geom, ...properties } = entity;

    features.push({
      type: "Feature",
      id,
      geometry,
      properties: { ...properties, id },
    });
  }

  return { type: "FeatureCollection", features };
}

// ─── Empty FeatureCollection ───────────────────────────────
export function emptyFeatureCollection(): FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

// ─── Formatting ────────────────────────────────────────────
export function formatArea(sqm: number, lang: "ar" | "en"): string {
  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(sqm));

  return lang === "ar" ? `${formatted} م²` : `${formatted} m\u00B2`;
}

export function formatLength(meters: number, lang: "ar" | "en"): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    const formatted = new Intl.NumberFormat(
      lang === "ar" ? "ar-SA" : "en-US",
      { maximumFractionDigits: 1 },
    ).format(km);
    return lang === "ar" ? `${formatted} كم` : `${formatted} km`;
  }

  const formatted = new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 0,
  }).format(Math.round(meters));

  return lang === "ar" ? `${formatted} م` : `${formatted} m`;
}
