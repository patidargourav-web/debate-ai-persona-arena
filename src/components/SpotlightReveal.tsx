
import React, { useRef, useEffect, useState } from "react";
import { useSpotlight } from "./SpotlightContext";

type SpotlightRevealProps = {
  children: React.ReactNode;
  className?: string;
  // Optionally tweak trigger distance for the gradient
  radius?: number;
};

const DEFAULT_RADIUS = 200;

// This component increases its brightness when the spotlight is near it.
export const SpotlightReveal: React.FC<SpotlightRevealProps> = ({
  children,
  className = "",
  radius = DEFAULT_RADIUS,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { position, visible } = useSpotlight();
  const [isLit, setLit] = useState(false);

  useEffect(() => {
    if (!visible || !ref.current) {
      setLit(false);
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.sqrt(Math.pow(cx - position.x, 2) + Math.pow(cy - position.y, 2));
    setLit(dist < radius);
  }, [position, visible, radius]);

  // Lighting up: stronger when cursor is closer, smooth transition.
  const style: React.CSSProperties = {
    transition: "filter 0.24s cubic-bezier(0.29,0.9,0.47,1), box-shadow 0.26s cubic-bezier(0.29,0.9,0.47,1)",
    filter: isLit
      ? "brightness(1.45) saturate(1.14) drop-shadow(0 0 24px hsl(var(--primary) / 0.26))"
      : "brightness(0.62) saturate(0.95)",
    boxShadow: isLit
      ? "0 2px 32px 0 hsl(var(--primary) / 0.11)"
      : "none",
    zIndex: 21,
  };
  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
};

export default SpotlightReveal;
