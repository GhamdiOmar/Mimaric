"use client";

import * as React from "react";

// v3.0: Launch wave performance removed (no launchWave model). Placeholder component.
export default function WavePerformanceChart({ projectId: _projectId }: { projectId: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground/40 text-sm">
      لا توجد بيانات موجات بعد
    </div>
  );
}
