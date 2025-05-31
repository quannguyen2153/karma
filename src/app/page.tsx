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

  const [isStrikeHarmless, setIsStrikeHarmless] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);
  const [showDeathDialog, setShowDeathDialog] = useState(false);

  const idleMovementRef = useRef<NodeJS.Timeout | null>(null);
  const directionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [autoMove, setAutoMove] = useState(false);

  const [touchCount, setTouchCount] = useState(0);
  const [touchLimit, setTouchLimit] = useState(0);

  const [wrongNameClickCount, setWrongNameClickCount] = useState(0);
  const [wrongNameClickLimit, setWrongNameClickLimit] = useState(0);

  const [displaySheetInput, setDisplaySheetInput] = useState(false);
  const [sheetContent, setSheetContent] = useState("");

  const isSheetPlayingRef = useRef(false);
  const sheetAbortControllerRef = useRef<AbortController | null>(null);

  const lightStrikeAudioBufferRef = useRef<AudioBuffer | null>(null);
  const strikeAudioBufferRef = useRef<AudioBuffer | null>(null);
  const deathAudioBufferRef = useRef<AudioBuffer | null>(null);
  const ouchAudioBufferRef = useRef<AudioBuffer | null>(null);
  const sharedAudioContextRef = useRef<AudioContext | null>(null);

  const stickmanPositionRef = useRef(stickmanPosition);
  const nameSubmittedRef = useRef(nameSubmitted);
  const isDeadRef = useRef(isDead);
  const isStrikeHarmlessRef = useRef(isStrikeHarmless);

  useEffect(() => {
    setTouchLimit(Math.floor(Math.random() * 35) + 15); // Random number between 15-49
    setWrongNameClickLimit(Math.floor(Math.random() * 15) + 15); // Random number between 15-29

    sharedAudioContextRef.current = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();

    const preloadSound = async (
      path: string,
      ref: React.RefObject<AudioBuffer | null>
    ) => {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await sharedAudioContextRef.current?.decodeAudioData(
        arrayBuffer
      );
      ref.current = audioBuffer ? audioBuffer : null;
    };

    preloadSound("./sfx/light_strike.mp3", lightStrikeAudioBufferRef);
    preloadSound("./sfx/strike.mp3", strikeAudioBufferRef);
    preloadSound("./sfx/death.mp3", deathAudioBufferRef);
    preloadSound("./sfx/ouch.mp3", ouchAudioBufferRef);

    if (sharedAudioContextRef.current.state === "suspended") {
      sharedAudioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    const handleSpecialKeyDown = (e: KeyboardEvent) => {
      if (!nameSubmitted || e.repeat) return;
      if (e.code === "Space" || e.key === " ") {
        setIsStrikeHarmless((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleSpecialKeyDown);

    if (!nameSubmitted) return;

    const observer = new MutationObserver(() => {
      const nameElements = document.querySelectorAll("[data-player-name]");
      nameElements.forEach((el) => {
        const name = el.textContent
          ?.trim()
          .toLowerCase()
          .replace(/\s+/g, "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        if (
          wrongNameClickCount <= wrongNameClickLimit &&
          name?.includes("quan")
        ) {
          el.textContent = "1i1 h4ck3r";
          setPlayerName("1i1 h4ck3r");
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      window.removeEventListener("keydown", handleSpecialKeyDown);
      observer.disconnect();
    };
  }, [nameSubmitted]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!nameSubmittedRef.current || isDeadRef.current) {
      console.log("Game not started or already dead");
      return;
    }
    if (e.repeat) return; // ignore if holding key

    if (sharedAudioContextRef.current?.state === "suspended") {
      sharedAudioContextRef.current.resume();
    }

    const topRow = "qwertyuiop";
    const middleRow = "asdfghjkl";
    const bottomRow = "zxcvbnm";

    // Determine which row the key belongs to
    let index = topRow.indexOf(e.key.toLowerCase());
    let row = "top";

    if (index === -1) {
      index = middleRow.indexOf(e.key.toLowerCase());
      if (index !== -1) {
        row = "middle";
      } else {
        index = bottomRow.indexOf(e.key.toLowerCase());
        if (index !== -1) row = "bottom";
      }
    }

    if (index !== -1) {
      const baseKeys =
        row === "top" ? topRow : row === "middle" ? middleRow : bottomRow;
      const sectionWidth = window.innerWidth / baseKeys.length;
      const startX = sectionWidth * index + sectionWidth / 2;

      // Set vertical position higher for top row
      const startY =
        window.innerHeight *
        (row === "top" ? 0.02 : row === "middle" ? 0.035 : 0.05);

      const endX = Math.random() * window.innerWidth;
      const endY = window.innerHeight;
      const path = generateLightningPath(startX, startY, endX, endY);
      const id = lightningIdRef.current++;

      const isSharp = e.shiftKey;

      // Use base offsets to distinguish rows aurally
      const rowOffset = row === "top" ? 16 : row === "middle" ? 7 : 0;
      const offset =
        rowOffset + index * 2 - (index > 2 ? 1 : 0) + (isSharp ? 1 : 0);

      playSound(lightStrikeAudioBufferRef.current, 0.5, offset);

      setLightnings((prev) => [...prev, { id, path }]);

      setTimeout(() => {
        setLightnings((prev) => prev.filter((l) => l.id !== id));
      }, 300);

      const hitboxSize = window.innerWidth > window.innerHeight ? 50 : 30;

      if (
        !isStrikeHarmlessRef.current &&
        Math.abs(endX - stickmanPositionRef.current.x) < hitboxSize &&
        !isDeadRef.current
      ) {
        playSound(deathAudioBufferRef.current, 1.0);
        setIsDead(true);
        setDisplaySheetInput(false);
        setIsMoving(false);
        setDirection("front");
        setAutoMove(false);
        if (directionIntervalRef.current)
          clearInterval(directionIntervalRef.current);
        if (idleMovementRef.current) clearTimeout(idleMovementRef.current);

        setTimeout(() => {
          setShowDeathDialog(true);
        }, 1500);
      } else {
        setStrikeCount((prev) => prev + 1);

        if (endX < stickmanPositionRef.current.x) {
          setDirection("right");
        } else {
          setDirection("left");
        }

        setIsMoving(true);
        setAutoMove(false);

        if (idleMovementRef.current) clearTimeout(idleMovementRef.current);
        if (directionIntervalRef.current)
          clearInterval(directionIntervalRef.current);

        idleMovementRef.current = setTimeout(() => {
          if (!isDeadRef.current) {
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
    }
  };

  useEffect(() => {
    stickmanPositionRef.current = stickmanPosition;
    nameSubmittedRef.current = nameSubmitted;
    isDeadRef.current = isDead;
    isStrikeHarmlessRef.current = isStrikeHarmless;

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [stickmanPosition, nameSubmitted, isDead, isStrikeHarmless]);

  const playSheet = async (sheet: string) => {
    const buffer = lightStrikeAudioBufferRef.current;
    if (!buffer) return;

    const delayMs = buffer.duration * 1000; // duration is in seconds

    const controller = new AbortController();
    sheetAbortControllerRef.current = controller;

    isSheetPlayingRef.current = true;

    for (let i = 0; i < sheet.length; i++) {
      if (controller.signal.aborted) break;

      const char = sheet[i];
      if (char === " ") {
        await new Promise((res) => setTimeout(res, delayMs));
        continue;
      }

      const simulatedEvent = {
        key: char.toLowerCase(),
        shiftKey: char !== char.toLowerCase(),
      } as KeyboardEvent;

      handleKeyDown(simulatedEvent);
      await new Promise((res) => setTimeout(res, delayMs));
    }

    isSheetPlayingRef.current = false;
  };

  useEffect(() => {
    const triggerPlaySheet = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === "Enter") {
        if (isSheetPlayingRef.current) {
          // Stop current playback
          sheetAbortControllerRef.current?.abort();
          isSheetPlayingRef.current = false;
        } else {
          // Start playback
          playSheet(sheetContent);
        }
      }
    };

    window.addEventListener("keydown", triggerPlaySheet);
    return () => {
      window.removeEventListener("keydown", triggerPlaySheet);
    };
  }, [sheetContent, stickmanPosition, nameSubmitted, isDead, isStrikeHarmless]);

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

  const playSound = (
    audioBuffer: AudioBuffer | null,
    volume = 1.0,
    semitoneOffset = 0
  ) => {
    if (!audioBuffer || !sharedAudioContextRef.current) return;

    const source = sharedAudioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = sharedAudioContextRef.current.createGain();
    gainNode.gain.value = volume;

    source.detune.value = semitoneOffset * 100;

    source.connect(gainNode).connect(sharedAudioContextRef.current.destination);
    source.start(0);
  };

  const handleCloudClick = (
    e: React.MouseEvent<SVGPathElement, MouseEvent>
  ) => {
    if (!nameSubmitted || isDead) return; // Don't allow gameplay until name is entered

    if (sharedAudioContextRef.current?.state === "suspended") {
      sharedAudioContextRef.current.resume();
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const endX =
      e.ctrlKey || e.metaKey ? startX : Math.random() * window.innerWidth;
    const endY = window.innerHeight;

    const path = generateLightningPath(startX, startY, endX, endY);
    const id = lightningIdRef.current++;

    const hitboxSize = window.innerWidth > window.innerHeight ? 50 : 30;

    playSound(strikeAudioBufferRef.current, 0.5);

    setLightnings((prev) => [...prev, { id, path }]);

    setTimeout(() => {
      setLightnings((prev) => prev.filter((l) => l.id !== id));
    }, 300);

    if (!isStrikeHarmless && Math.abs(endX - stickmanPosition.x) < hitboxSize) {
      playSound(deathAudioBufferRef.current, 1.0);
      setIsDead(true);
      setDisplaySheetInput(false);
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
    setIsStrikeHarmless(false);
    setStrikeCount(0);
    setTouchCount(0);
    setTouchLimit(Math.floor(Math.random() * 35) + 15); // reset touch limit
    setWrongNameClickCount(0);
    setWrongNameClickLimit(Math.floor(Math.random() * 15) + 15); // reset wrong name click limit
    setStickmanPosition({ x: Math.floor(window.innerWidth / 2), y: 10 });
    setDirection("front");
    setNameSubmitted(false);
    setPlayerName("");
    setAutoMove(false);
    setDisplaySheetInput(false);
    if (idleMovementRef.current) clearTimeout(idleMovementRef.current);
    if (directionIntervalRef.current)
      clearInterval(directionIntervalRef.current);
    sheetAbortControllerRef.current?.abort();
    isSheetPlayingRef.current = false;
  };

  const normalizedName = playerName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const isQuan =
    wrongNameClickCount <= wrongNameClickLimit &&
    normalizedName.includes("quan");

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
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <h2
            onClick={() => setDisplaySheetInput(true)}
            style={{ color: "red", marginBottom: "1rem" }}
          >
            WHO NEED TO BE PUNISHED?
          </h2>
          <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
            Identify the foolish soul responsible:
          </p>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="name..."
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
          {displaySheetInput && (
            <textarea
              value={sheetContent}
              onChange={(e) => setSheetContent(e.target.value)}
              placeholder="punishment sequence..."
              rows={4}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem",
                width: "80%",
                background: "#111",
                border: "1px solid #555",
                color: "#fff",
                borderRadius: "0.5rem",
                textAlign: "center",
                resize: "none",
              }}
            />
          )}
          <div style={{ position: "relative", display: "inline-block" }}>
            <button
              onClick={() => {
                if (isQuan) {
                  setWrongNameClickCount((prev) => prev + 1);
                  return;
                }

                if (!playerName.trim()) {
                  setPlayerName("You");
                } else {
                  setPlayerName(playerName.trim());
                }
                setNameSubmitted(true);
                setStickmanPosition({
                  x: Math.floor(window.innerWidth / 2),
                  y: 10,
                });
              }}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: isQuan ? "#333" : "#444",
                color: "#fff",
                border: "none",
                borderRadius: "0.5rem",
                cursor: isQuan ? "not-allowed" : "pointer",
                opacity: isQuan ? 0.6 : 1,
                position: "relative",
              }}
            >
              {wrongNameClickCount > wrongNameClickLimit
                ? "( -_・)?"
                : isQuan
                ? "Wrong Name"
                : "Punish"}
            </button>
          </div>
        </div>
      )}

      {nameSubmitted && (
        <>
          <Cloud onClick={handleCloudClick} animationDurationInMs={100} />
          <LightningEffect
            lightnings={lightnings}
            color={isStrikeHarmless ? "white" : "#ff77ff"}
          />
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
                  playSound(deathAudioBufferRef.current, 1.0);
                  setIsDead(true);
                  setDisplaySheetInput(false);
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

                playSound(ouchAudioBufferRef.current, 0.5);

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
          data-player-name
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
          <p
            data-player-name
            style={{ fontStyle: "italic", marginBottom: "1rem" }}
          >
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
              : "Unbelievable! How did this being survive that long? Perhaps you just executed an angel..."}
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
