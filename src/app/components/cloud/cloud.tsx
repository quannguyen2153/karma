"use client";

import React, { useEffect, useState } from "react";

const generateCloudPath = (width: number, height: number): string => {
  const baseY = 0;
  const bumps = 8 + Math.floor(Math.random() * 4); // 8–11 bumps

  // Generate random step widths and normalize them to total width
  const randomSteps: number[] = [];
  let total = 0;
  for (let i = 0; i < bumps; i++) {
    const val = 0.8 + Math.random() * 0.4; // step weight between 0.8–1.2
    randomSteps.push(val);
    total += val;
  }

  // Normalize to fit total width
  const normalizedSteps = randomSteps.map((val) => (val / total) * width);

  let d = `M 0 ${baseY + height * (0.3 + Math.random() * 0.3)}`;
  let x = 0;

  for (let i = 0; i < bumps; i++) {
    const step = normalizedSteps[i];
    const x1 = x;
    const x2 = x1 + step;
    const ctrlX = x1 + step / 2;

    const ctrlY = baseY + height * (0.6 + Math.random() * 0.3); // 60–90% of height
    const endY = baseY + height * (0.25 + Math.random() * 0.3); // 25–55% of height

    d += ` Q ${ctrlX} ${ctrlY}, ${x2} ${endY}`;
    x = x2;
  }

  // Close the shape
  d += ` L ${width} 0`;
  d += ` L 0 0`;
  d += ` Z`;

  return d;
};

interface CloudProps {
  onClick?: (e: React.MouseEvent<SVGPathElement, MouseEvent>) => void;
  animationDurationInMs: number;
}

const Cloud: React.FC<CloudProps> = ({ onClick, animationDurationInMs }) => {
  const [path, setPath] = useState<string>("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const width = window.innerWidth;
    setDimensions({ width, height: 0.25 * window.innerHeight });
    setPath(generateCloudPath(width, 0.25 * window.innerHeight));
  }, []);

  const handlePathClick = (e: React.MouseEvent<SVGPathElement, MouseEvent>) => {
    e.stopPropagation();
    setIsAnimating(true);
    onClick?.(e);
  };

  useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, animationDurationInMs);
      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  return (
    <svg
      width="100%"
      height="25%"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "25%",
      }}
    >
      <path
        d={path}
        fill="lightgray"
        stroke="lightgray"
        strokeWidth="2"
        opacity="0.95"
        onClick={handlePathClick}
        style={{
          cursor: "pointer",
          transformOrigin: "50% 50%",
          transition: "transform 0.3s ease-out",
          transform: isAnimating ? "scale(1.15)" : "scale(1)",
        }}
      />
    </svg>
  );
};

export default Cloud;
