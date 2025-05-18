"use client";

import React, { useState, useRef } from "react";
import Cloud from "@/app/components/cloud/cloud";
import LightningEffect, {generateLightningPath} from "@/app/components/lightning/lightning";

import "./globals.css";

interface Lightning {
  id: number;
  path: string;
}

export default function Home() {
  const [lightnings, setLightnings] = useState<Lightning[]>([]);
  const lightningIdRef = useRef(0);

  const handleCloudClick = (
    e: React.MouseEvent<SVGPathElement, MouseEvent>
  ) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const endX = e.ctrlKey ? startX : Math.random() * window.innerWidth;
    const endY = window.innerHeight;

    const path = generateLightningPath(startX, startY, endX, endY);
    const id = lightningIdRef.current++;

    setLightnings((prev) => [...prev, { id, path }]);

    setTimeout(() => {
      setLightnings((prev) => prev.filter((l) => l.id !== id));
    }, 300);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#171717",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Cloud onClick={handleCloudClick} animationDurationInMs={100} />
      <LightningEffect lightnings={lightnings} />
    </div>
  );
}
