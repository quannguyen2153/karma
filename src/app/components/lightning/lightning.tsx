"use client";

import React from "react";
import "./lightning.css";

interface Lightning {
  id: number;
  path: string;
}

interface LightningEffectProps {
  lightnings: Lightning[];
  color: string;
}

export default function LightningEffect({
  lightnings,
  color,
}: LightningEffectProps) {
  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {lightnings.map((lightning) => (
        <path
          key={lightning.id}
          d={lightning.path}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          style={{
            filter: `drop-shadow(0 0 6px ${color})`,
            animation: "fadeOut 0.3s ease-out forwards",
          }}
        />
      ))}
    </svg>
  );
}

export function generateLightningPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segmentLengthInPx: number = 40
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const segments = Math.max(1, Math.floor(distance / segmentLengthInPx));

  let path = `M ${x1} ${y1}`;
  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const x = x1 + dx * t + (Math.random() - 0.5) * 30;
    const y = y1 + dy * t + (Math.random() - 0.5) * 30;
    path += ` L ${x} ${y}`;
  }
  path += ` L ${x2} ${y2}`;
  return path;
}
