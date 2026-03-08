"use client";

import * as React from "react";
import { RiyalIcon } from "../icons/RiyalIcon";
import { formatSAR, formatSARCompact } from "../lib/format-sar";

type SARAmountProps = {
  value: number | null | undefined;
  size?: number;
  className?: string;
  compact?: boolean;
  placeholder?: string;
};

export function SARAmount({
  value,
  size = 14,
  className,
  compact = false,
  placeholder = "—",
}: SARAmountProps) {
  if (value === null || value === undefined) {
    return <span className={className}>{placeholder}</span>;
  }
  const formatted = compact ? formatSARCompact(value) : formatSAR(value);
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      <RiyalIcon size={size} />
      {formatted}
    </span>
  );
}
