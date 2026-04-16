"use client";

import * as React from "react";

// v3.0: Off-plan pricing analytics removed (no inventoryItem model). Placeholder component.
export default function PricingDistributionChart({ projectId: _projectId }: { projectId: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-muted-foreground/40 text-sm">
      لا توجد بيانات تسعير بعد
    </div>
  );
}
