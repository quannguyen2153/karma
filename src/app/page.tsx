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
    x: 0,
    y: 10,
  });

  const [direction, setDirection] = useState<"front" | "left" | "right">(
    "front"
  );
  const [isMoving, setIsMoving] = useState(false);
  const [isDead, setIsDead] = useState(false);

  const animationRef = useRef<number | null>(null);

  // New states for player name
  const [playerName, setPlayerName] = useState("");
  const [nameSubmitted, setNameSubmitted] = useState(false);

  const [strikeCount, setStrikeCount] = useState(0);
  const [showDeathDialog, setShowDeathDialog] = useState(false);

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
    if (!nameSubmitted || isDead) return; // Don't allow gameplay until name is entered

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

      setTimeout(() => {
        setShowDeathDialog(true);
      }, 3000);
      return;
    }

    setStrikeCount((prev) => prev + 1);

    if (endX < stickmanPosition.x) {
      setDirection("right");
    } else {
      setDirection("left");
    }

    setIsMoving(true);
  };

  const handleRetry = () => {
    setIsDead(false);
    setShowDeathDialog(false);
    setStrikeCount(0);
    setStickmanPosition({ x: window.innerWidth / 2 - 50, y: 10 });
    setDirection("front");
    setNameSubmitted(false);
    setPlayerName("");
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
      {/* Name input modal */}
      {!nameSubmitted && (
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -30%)",
            background: "#222",
            padding: "2rem",
            borderRadius: "1rem",
            zIndex: 20,
            color: "white",
            textAlign: "center",
            boxShadow: "0 0 10px red",
          }}
        >
          <h2 style={{ color: "red", marginBottom: "1rem" }}>
            WHO MESSED UP THIS TIME?
          </h2>
          <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
            Identify the foolish soul responsible:
          </p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Pathetic culprit's name"
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem",
              width: "80%",
              background: "#111",
              border: "1px solid #555",
              color: "#fff",
              borderRadius: "0.5rem",
              textAlign: "center",
            }}
          />
          <button
            onClick={() => {
              setNameSubmitted(true);
              setStickmanPosition({ x: window.innerWidth / 2 - 50, y: 10 });
            }}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#444",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
            disabled={!playerName.trim()}
          >
            Punish
          </button>
        </div>
      )}

      {nameSubmitted && (
        <>
          <Cloud onClick={handleCloudClick} animationDurationInMs={100} />
          <LightningEffect lightnings={lightnings} />
          <StickMan
            x={stickmanPosition.x}
            y={stickmanPosition.y}
            direction={direction}
            isDead={isDead}
          />
        </>
      )}

      {/* Show player name below the stickman */}
      {nameSubmitted && (
        <div
          style={{
            position: "absolute",
            bottom: stickmanPosition.y - 5,
            left: stickmanPosition.x,
            transform: "translateX(-50%)",
            color: isDead ? "#888" : "white",
            fontWeight: "bold",
            textShadow: "0 0 5px black",
            textAlign: "center",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {playerName}
        </div>
      )}

      {showDeathDialog && (
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -30%)",
            background: "#222",
            padding: "2rem",
            borderRadius: "1rem",
            zIndex: 20,
            color: "white",
            textAlign: "center",
            boxShadow: "0 0 10px red",
          }}
        >
          <h2 style={{ color: "red", marginBottom: "1rem" }}>Judgement Day</h2>
          <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
            {playerName} survived {strikeCount} strike
            {strikeCount !== 1 ? "s" : ""}.
          </p>
          <p style={{ fontWeight: "bold", marginBottom: "1.5rem" }}>
            {strikeCount === 0
              ? "One and done. This one's pure evil."
              : strikeCount < 20
              ? "Weak. Punishment successful. No mercy for incompetence."
              : strikeCount < 50
              ? "Suspiciously durable... maybe not all bad. Still shameful though."
              : "Unbelievable! How did this being survive that long? You just executed an angel..."}
          </p>
          <button
            onClick={handleRetry}
            style={{
              padding: "0.5rem 1.5rem",
              backgroundColor: "#444",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Punish another one!
          </button>
        </div>
      )}
    </div>
  );
}
