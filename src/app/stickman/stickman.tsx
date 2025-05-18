"use client";

import React from "react";
import "./stickman.css"; // We'll define animations here

interface StickManProps {
  x: number;
  y: number;
  direction: "front" | "left" | "right";
  isDead: boolean;
  onClick?: () => void;
}

const StickMan: React.FC<StickManProps> = ({
  x,
  y,
  direction,
  isDead,
  onClick,
}) => {
  const color = isDead ? "#888" : "white";

  return (
    <svg
      onClick={onClick}
      viewBox="0 0 100 100"
      width={100}
      height={100}
      className={isDead ? "dead" : ""}
      style={{
        position: "absolute",
        bottom: y,
        left: x,
        transform: isDead
          ? `translate(-50%, 0) rotate(90deg)`
          : `translate(-50%, 0)`,
        transformOrigin: "center",
        transition: "transform 0.5s ease",
        overflow: "visible",
      }}
    >
      {/* Head */}
      <circle cx="50" cy="20" r="6" fill={color} />

      {/* Eyes */}
      {!isDead && direction === "front" && (
        <>
          <circle cx="48" cy="19" r="1" fill="black" />
          <circle cx="52" cy="19" r="1" fill="black" />
        </>
      )}
      {!isDead && direction === "left" && (
        <circle cx="47" cy="19" r="1" fill="black" />
      )}
      {!isDead && direction === "right" && (
        <circle cx="53" cy="19" r="1" fill="black" />
      )}
      {isDead && (
        <>
          {/* Cross eyes for dead state */}
          <line x1="47" y1="17" x2="49" y2="19" stroke="red" strokeWidth="1" />
          <line x1="49" y1="17" x2="47" y2="19" stroke="red" strokeWidth="1" />
          <line x1="51" y1="17" x2="53" y2="19" stroke="red" strokeWidth="1" />
          <line x1="53" y1="17" x2="51" y2="19" stroke="red" strokeWidth="1" />
        </>
      )}

      {/* Body */}
      <line x1="50" y1="26" x2="50" y2="50" stroke={color} strokeWidth="2" />

      {/* Arms */}
      <line
        x1="50"
        y1="30"
        x2="40"
        y2="40"
        stroke={color}
        strokeWidth="2"
        className={isDead ? "" : "arm left"}
      />
      <line
        x1="50"
        y1="30"
        x2="60"
        y2="40"
        stroke={color}
        strokeWidth="2"
        className={isDead ? "" : "arm right"}
      />

      {/* Legs */}
      <line
        x1="50"
        y1="50"
        x2="42"
        y2="70"
        stroke={color}
        strokeWidth="2"
        className={isDead ? "" : "leg left"}
      />
      <line
        x1="50"
        y1="50"
        x2="58"
        y2="70"
        stroke={color}
        strokeWidth="2"
        className={isDead ? "" : "leg right"}
      />
    </svg>
  );
};

export default StickMan;
