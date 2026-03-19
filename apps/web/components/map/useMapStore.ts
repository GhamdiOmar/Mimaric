"use client";

import { create } from "zustand";

interface MapState {
  // Viewport
  center: [number, number]; // [lng, lat]
  zoom: number;

  // Layers
  visibleLayers: Set<string>;
  activeLayerId: string | null;

  // Selection
  selectedFeatureId: string | null;
  selectedFeatureProperties: Record<string, unknown> | null;

  // UI
  showLayerPanel: boolean;
  showLegend: boolean;
  isDrawing: boolean;
  measureMode: "none" | "distance" | "area";

  // Actions
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  toggleLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string | null) => void;
  selectFeature: (
    id: string | null,
    properties: Record<string, unknown> | null,
  ) => void;
  setShowLayerPanel: (show: boolean) => void;
  setShowLegend: (show: boolean) => void;
  setIsDrawing: (drawing: boolean) => void;
  setMeasureMode: (mode: "none" | "distance" | "area") => void;
  reset: () => void;
}

const INITIAL_STATE = {
  center: [46.6753, 24.7136] as [number, number], // Riyadh
  zoom: 12,
  visibleLayers: new Set<string>(),
  activeLayerId: null,
  selectedFeatureId: null,
  selectedFeatureProperties: null,
  showLayerPanel: false,
  showLegend: true,
  isDrawing: false,
  measureMode: "none" as const,
};

export const useMapStore = create<MapState>((set) => ({
  ...INITIAL_STATE,

  setCenter: (center) => set({ center }),

  setZoom: (zoom) => set({ zoom }),

  toggleLayer: (layerId) =>
    set((state) => {
      const next = new Set(state.visibleLayers);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return { visibleLayers: next };
    }),

  setActiveLayer: (layerId) => set({ activeLayerId: layerId }),

  selectFeature: (id, properties) =>
    set({ selectedFeatureId: id, selectedFeatureProperties: properties }),

  setShowLayerPanel: (show) => set({ showLayerPanel: show }),

  setShowLegend: (show) => set({ showLegend: show }),

  setIsDrawing: (drawing) => set({ isDrawing: drawing }),

  setMeasureMode: (mode) => set({ measureMode: mode }),

  reset: () => set(INITIAL_STATE),
}));
