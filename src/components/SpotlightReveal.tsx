
import React, { useRef, useEffect, useState, CSSProperties } from "react";
import { useSpotlight } from "./SpotlightContext";

type SpotlightRevealProps = {
  children: React.ReactNode;
  className?: string;
  radius?: number;
  style?: React.CSSProperties;
};


const DEFAULT_RADIUS = 200;

/**
 * This component reveals its children ONLY where the spotlight falls over it,
 * using a dynamic CSS mask. The reveal follows the moving spotlight cursor, 
 * so only the lit area is clearly visible, with a smooth transparent fade outward.
 */
export const SpotlightReveal: React.FC<SpotlightRevealProps> = ({
  children,
  className = "",
  radius = DEFAULT_RADIUS,
  style = {},
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { position, visible } = useSpotlight();
  const [maskPosition, setMaskPosition] = useState({ x: -9999, y: -9999, width: 0, height: 0 });

  // Update the mask's local position relative to the element
  useEffect(() => {
    if (!ref.current || !visible) {
      setMaskPosition({ x: -9999, y: -9999, width: 0, height: 0 });
      return;
    }
    const rect = ref.current.getBoundingClientRect();
    setMaskPosition({
      x: position.x - rect.left,
      y: position.y - rect.top,
      width: rect.width,
      height: rect.height,
    });
  }, [position, visible]);

  // Only show the part within the spotlight circle with a smooth fade at the edge.
  // Use CSS mask or Webkit mask for broad browser support.
  // We use a radial-gradient, center matching the maskPosition.
  const maskGradient = `radial-gradient(circle ${radius}px at ${maskPosition.x}px ${maskPosition.y}px, 
    rgba(255,255,255,1) 0%, 
    rgba(255,255,255,0.8) 66%, 
    rgba(255,255,255,0) 100%
  )`;

  // When not visible, fallback to a very dim/hidden state.
  const mergedStyle: CSSProperties = {
    ...style,
    WebkitMaskImage: visible ? maskGradient : undefined,
    maskImage: visible ? maskGradient : undefined,
    transition: "filter 0.22s cubic-bezier(0.29,0.9,0.47,1), box-shadow 0.23s cubic-bezier(0.29,0.9,0.47,1), mask-image 0.3s, -webkit-mask-image 0.3s",
    filter: visible ? "brightness(1.02)" : "brightness(0.44) saturate(0.92)",
    opacity: visible ? 1 : 0.72,
    zIndex: 21,
    position: "relative",
  };

  return (
    <div ref={ref} className={className} style={mergedStyle}>
      {children}
    </div>
  );
};

export default SpotlightReveal;

