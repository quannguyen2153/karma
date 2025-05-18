"use client";

import React, { useState, useRef, useEffect } from "react";
import Cloud from "@/app/components/cloud/cloud";
import LightningEffect, {
  generateLightningPath,
} from "@/app/components/lightning/lightning";
import StickMan from "@/app/stickman/stickman";

import "./globals.css";

interface Lightning {
  id: number;
  path: string;
}

export default function Home() {
  const [lightnings, setLightnings] = useState<Lightning[]>([]);
  const lightningIdRef = useRef(0);

  const [stickmanPosition, setStickmanPosition] = useState({
    x: window.innerWidth / 2 - 50,
    y: 0,
  });

  const [direction, setDirection] = useState<"front" | "left" | "right">(
    "front"
  );
  const [isMoving, setIsMoving] = useState(false);
  const [isDead, setIsDead] = useState(false);

  const animationRef = useRef<number | null>(null);

  // Movement loop
  useEffect(() => {
    const moveSpeed = 4;

    const animate = () => {
      setStickmanPosition((prev) => {
        let newX = prev.x;

        if (direction === "left") {
          newX = Math.max(300, prev.x - moveSpeed);
        } else if (direction === "right") {
          newX = Math.min(window.innerWidth - 300, prev.x + moveSpeed);
        }

        // Stop and face front if at edge
        if (
          (direction === "left" && newX <= 300) ||
          (direction === "right" && newX >= window.innerWidth - 300) ||
          isDead
        ) {
          setDirection("front");
          setIsMoving(false);
          if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
          }
        }

        return { ...prev, x: newX };
      });

      if (!isDead) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (isMoving && !isDead) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isMoving, direction]);

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

    if (Math.abs(endX - stickmanPosition.x) < 50) {
      setIsDead(true);
      setIsMoving(false);
      setDirection("front");
      return;
    }

    // Always update direction based on lightning position
    if (endX < stickmanPosition.x) {
      setDirection("right");
    } else {
      setDirection("left");
    }
    // Always set moving to true when lightning strikes
    setIsMoving(true);
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
      <StickMan
        x={stickmanPosition.x}
        y={stickmanPosition.y}
        direction={direction}
        isDead={isDead}
      />
    </div>
  );
}
