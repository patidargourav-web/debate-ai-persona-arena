
import React, { useEffect, useRef, useState } from "react";
import { SpotlightContext } from "./SpotlightContext";

/**
 * Provides a moving spotlight effect and context for all spotlight-aware components.
 * The spotlight follows the cursor with springy/lerp motion for realism.
 */
export const SpotlightCursor: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [position, setPosition] = useState({ x: -9999, y: -9999 });
  const [visible, setVisible] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  // Store the "target" mouse position, and the "current" springy/lerped position
  const mouse = useRef({ x: -9999, y: -9999 });
  const lerpPosition = useRef({ x: -9999, y: -9999 });

  // Animate the "lerp"/spring towards the current mouse position
  useEffect(() => {
    let frame: number;
    const animate = () => {
      // Linear interpolation
      lerpPosition.current.x += (mouse.current.x - lerpPosition.current.x) * 0.18;
      lerpPosition.current.y += (mouse.current.y - lerpPosition.current.y) * 0.18;

      setPosition({
        x: lerpPosition.current.x,
        y: lerpPosition.current.y,
      });

      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  // Listen to mouse
  useEffect(() => {
    const moveSpotlight = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      setVisible(true);
    };
    const hideSpotlight = () => setVisible(false);

    window.addEventListener("mousemove", moveSpotlight);
    window.addEventListener("mouseleave", hideSpotlight);

    return () => {
      window.removeEventListener("mousemove", moveSpotlight);
      window.removeEventListener("mouseleave", hideSpotlight);
    };
  }, []);

  const size = 350;

  return (
    <SpotlightContext.Provider value={{ position, visible }}>
      <div
        ref={spotlightRef}
        style={{
          pointerEvents: "none",
          position: "fixed",
          left: 0,
          top: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 19,
          mixBlendMode: "lighten",
          transition: "opacity 0.33s",
          opacity: visible ? 1 : 0,
        }}
        aria-hidden="true"
      >
        <div
          style={{
            position: "absolute",
            left: position.x - size / 2,
            top: position.y - size / 2,
            width: size,
            height: size,
            pointerEvents: "none",
            borderRadius: "50%",
            background: `radial-gradient(circle at center, hsla(142, 76%, 36%, 0.70) 0%, hsla(241,85%,52%,0.22) 42%, transparent 95%)`,
            filter: "blur(32px)",
            transition: "left 0.13s cubic-bezier(.25,.8,.25,1), top 0.13s cubic-bezier(.25,.8,.25,1)",
            transform: "translateZ(0)",
          }}
        />
      </div>
      {children}
    </SpotlightContext.Provider>
  );
};

export default SpotlightCursor;

