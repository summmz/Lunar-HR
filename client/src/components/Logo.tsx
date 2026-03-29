import React from "react";

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export default function Logo({ className = "", width = 80, height = "auto" }: LogoProps) {
  return (
    <img
      src="/lunar-hr-logo.svg"
      alt="Lunar HR"
      width={width}
      height={height}
      className={className}
    />
  );
}
