"use client";

import * as React from "react";
import {
  ZoomIn,
  ZoomOut,
  Compass,
  Ruler,
  Maximize2,
  Minimize2,
  Camera,
  Move,
} from "lucide-react";
import { Button } from "@repo/ui";
import { useLanguage } from "../LanguageProvider";
import { useMapStore } from "./useMapStore";

// ─── Types ─────────────────────────────────────────────────
interface MapControlsProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetNorth?: () => void;
  onScreenshot?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

// ─── Control Button ────────────────────────────────────────
function ControlButton({
  icon: Icon,
  title,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Button
      variant={active ? "primary" : "secondary"}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className="h-8 w-8 p-0"
      style={{ display: "inline-flex" }}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}

// ─── Component ─────────────────────────────────────────────
export default function MapControls({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onScreenshot,
  onToggleFullscreen,
  isFullscreen = false,
}: MapControlsProps) {
  const { lang } = useLanguage();
  const { measureMode, setMeasureMode } = useMapStore();

  return (
    <div className="absolute top-4 end-14 z-10 flex flex-col gap-1">
      {/* Zoom Controls */}
      <div className="flex flex-col rounded-lg border border-border/80 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
        <ControlButton
          icon={ZoomIn}
          title={lang === "ar" ? "تكبير" : "Zoom In"}
          onClick={onZoomIn}
        />
        <div className="h-px bg-border/50" />
        <ControlButton
          icon={ZoomOut}
          title={lang === "ar" ? "تصغير" : "Zoom Out"}
          onClick={onZoomOut}
        />
      </div>

      {/* Compass */}
      <div className="rounded-lg border border-border/80 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
        <ControlButton
          icon={Compass}
          title={lang === "ar" ? "اتجاه الشمال" : "Reset North"}
          onClick={onResetNorth}
        />
      </div>

      {/* Measure Tools */}
      <div className="flex flex-col rounded-lg border border-border/80 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
        <ControlButton
          icon={Ruler}
          title={lang === "ar" ? "قياس المسافة" : "Measure Distance"}
          onClick={() =>
            setMeasureMode(measureMode === "distance" ? "none" : "distance")
          }
          active={measureMode === "distance"}
        />
        <div className="h-px bg-border/50" />
        <ControlButton
          icon={Move}
          title={lang === "ar" ? "قياس المساحة" : "Measure Area"}
          onClick={() =>
            setMeasureMode(measureMode === "area" ? "none" : "area")
          }
          active={measureMode === "area"}
        />
      </div>

      {/* Utility */}
      <div className="flex flex-col rounded-lg border border-border/80 bg-card/95 backdrop-blur-sm shadow-lg overflow-hidden">
        <ControlButton
          icon={Camera}
          title={lang === "ar" ? "لقطة شاشة" : "Screenshot"}
          onClick={onScreenshot}
        />
        <div className="h-px bg-border/50" />
        <ControlButton
          icon={isFullscreen ? Minimize2 : Maximize2}
          title={
            isFullscreen
              ? lang === "ar"
                ? "تصغير الشاشة"
                : "Exit Fullscreen"
              : lang === "ar"
                ? "ملء الشاشة"
                : "Fullscreen"
          }
          onClick={onToggleFullscreen}
        />
      </div>
    </div>
  );
}
