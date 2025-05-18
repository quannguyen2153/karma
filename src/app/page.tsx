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

  const idleMovementRef = useRef<NodeJS.Timeout | null>(null);
  const directionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoMove, setAutoMove] = useState(false);

  const [touchCount, setTouchCount] = useState(0);
  const [touchLimit, setTouchLimit] = useState(0);

  useEffect(() => {
    const limit = Math.floor(Math.random() * 35) + 15; // Random number between 15-49
    setTouchLimit(limit);
  }, []);

  // Movement loop
  useEffect(() => {
    const moveSpeed = autoMove ? 2 : 4;

    const animate = () => {
      setStickmanPosition((prev) => {
        const offset = window.innerWidth > window.innerHeight ? 300 : 100;
        let newX = prev.x;

        if (direction === "left") {
          newX = Math.max(offset, prev.x - moveSpeed);
        } else if (direction === "right") {
          newX = Math.min(window.innerWidth - offset, prev.x + moveSpeed);
        }

        const atLeftEdge = direction === "left" && newX <= offset;
        const atRightEdge =
          direction === "right" && newX >= window.innerWidth - offset;

        if (atLeftEdge || atRightEdge || isDead) {
          setDirection("front");
          setIsMoving(false);

          // Trigger autoMove redirection
          if (autoMove && !isDead) {
            setTimeout(() => {
              const nextDirection = Math.random() > 0.5 ? "left" : "right";
              setDirection(nextDirection);
              setIsMoving(true);
            }, 1000);
          }

          if (animationRef.current !== null) {
            cancelAnimationFrame(animationRef.current);
          }

          return prev;
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
  }, [isMoving, direction, autoMove, isDead]);

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

    const strikeSound = new Audio("./sfx/strike.mp3");
    strikeSound.volume = 0.5;
    strikeSound.play();

    setLightnings((prev) => [...prev, { id, path }]);

    setTimeout(() => {
      setLightnings((prev) => prev.filter((l) => l.id !== id));
    }, 300);

    if (Math.abs(endX - stickmanPosition.x) < 50) {
      new Audio("./sfx/death.mp3").play();
      setIsDead(true);
      setIsMoving(false);
      setDirection("front");
      setAutoMove(false);
      if (directionIntervalRef.current)
        clearInterval(directionIntervalRef.current);
      if (idleMovementRef.current) clearTimeout(idleMovementRef.current);

      setTimeout(() => {
        setShowDeathDialog(true);
      }, 1500);
      return;
    }

    setStrikeCount((prev) => prev + 1);

    if (endX < stickmanPosition.x) {
      setDirection("right");
    } else {
      setDirection("left");
    }

    setIsMoving(true);
    setAutoMove(false); // Stop auto movement if triggered

    if (idleMovementRef.current) {
      clearTimeout(idleMovementRef.current);
    }
    if (directionIntervalRef.current)
      clearInterval(directionIntervalRef.current);

    // Start idle movement after a period
    idleMovementRef.current = setTimeout(() => {
      if (!isDead) {
        setAutoMove(true);
        setDirection(Math.random() > 0.5 ? "left" : "right");
        setIsMoving(true);

        // Start random direction changes every 0.8-1.5 seconds
        directionIntervalRef.current = setInterval(() => {
          setDirection((prev) =>
            Math.random() > 0.5 ? (prev === "left" ? "right" : "left") : prev
          );
        }, 800 + Math.random() * 700); // 0.8-1.5 second intervals
      }
    }, 1000);
  };

  const handleRetry = () => {
    setIsDead(false);
    setShowDeathDialog(false);
    setStrikeCount(0);
    setTouchCount(0);
    setTouchLimit(Math.floor(Math.random() * 35) + 15); // reset touch limit
    setStickmanPosition({ x: window.innerWidth / 2 - 50, y: 10 });
    setDirection("front");
    setNameSubmitted(false);
    setPlayerName("");
    setAutoMove(false);
    if (idleMovementRef.current) clearTimeout(idleMovementRef.current);
    if (directionIntervalRef.current)
      clearInterval(directionIntervalRef.current);
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
            placeholder="name here"
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
              if (!playerName.trim()) {
                setPlayerName("You");
              } else {
                setPlayerName(playerName.trim());
              }
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
            onClick={() => {
              if (!isDead) {
                const newTouchCount = touchCount + 1;
                setTouchCount(newTouchCount);

                if (newTouchCount >= touchLimit) {
                  new Audio("./sfx/death.mp3").play();
                  setIsDead(true);
                  setIsMoving(false);
                  setDirection("front");
                  setAutoMove(false);
                  if (directionIntervalRef.current)
                    clearInterval(directionIntervalRef.current);
                  if (idleMovementRef.current)
                    clearTimeout(idleMovementRef.current);
                  setTimeout(() => {
                    setShowDeathDialog(true);
                  }, 1500);
                  return;
                }

                const ouch = new Audio("./sfx/ouch.mp3");
                ouch.volume = 0.3;
                ouch.play();

                const newDirection =
                  direction === "left"
                    ? "right"
                    : direction === "right"
                    ? "left"
                    : Math.random() > 0.5
                    ? "left"
                    : "right";

                setDirection(newDirection);
                setIsMoving(true);
                setAutoMove(false);

                if (idleMovementRef.current)
                  clearTimeout(idleMovementRef.current);
                if (directionIntervalRef.current)
                  clearInterval(directionIntervalRef.current);

                idleMovementRef.current = setTimeout(() => {
                  if (!isDead) {
                    setAutoMove(true);
                    setDirection(Math.random() > 0.5 ? "left" : "right");
                    setIsMoving(true);

                    directionIntervalRef.current = setInterval(() => {
                      setDirection((prev) =>
                        Math.random() > 0.5
                          ? prev === "left"
                            ? "right"
                            : "left"
                          : prev
                      );
                    }, 800 + Math.random() * 700);
                  }
                }, 1000);
              }
            }}
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
          <h2 style={{ color: "red", marginBottom: "1rem" }}>
            {touchCount >= touchLimit ? "???" : "Judgement"}
          </h2>
          <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
            {touchCount >= touchLimit
              ? `${playerName} survived ${touchCount} touch${
                  touchCount !== 1 ? "es" : ""
                }.`
              : `${playerName} survived ${strikeCount} strike${
                  strikeCount !== 1 ? "s" : ""
                }.`}
          </p>
          <p style={{ fontWeight: "bold", marginBottom: "1.5rem" }}>
            {touchCount >= touchLimit
              ? "..."
              : strikeCount === 0
              ? "One and done. This one's pure evil."
              : strikeCount < 20
              ? "No mercy for incompetence."
              : strikeCount < 50
              ? "Suspiciously durable... maybe not all bad."
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
            {touchCount >= touchLimit
              ? "Touch another one"
              : "Punish another one"}
          </button>
        </div>
      )}
    </div>
  );
}
