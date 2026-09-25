import React from "react";

type MomentumIconProps = {
  direction: "up" | "down";
  size?: number;
  className?: string;
  strokeWidth?: number;
};

/**
 * Momentum notification icon — Design #1
 *
 * Green  = Momentum Up
 * Red    = Momentum Down
 *
 * Default size: 20x20px
 * This is intentionally the same compact footprint as typical
 * Beat/Miss notification icons.
 */
export function MomentumIcon({
  direction,
  size = 20,
  className = "",
  strokeWidth = 2.5,
}: MomentumIconProps) {
  const isUp = direction === "up";
  const color = isUp ? "#10B981" : "#EF4444";

  const points = isUp
    ? "3,14 7,10 9,12 13,8 17,4"
    : "3,6 7,10 9,8 13,12 17,16";

  const arrowPoints = isUp
    ? "13.5,4 17,4 17,7.5"
    : "13.5,16 17,16 17,12.5";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={isUp ? "Momentum Up" : "Momentum Down"}
    >
      <polyline
        points={points}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <polyline
        points={arrowPoints}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default MomentumIcon;
