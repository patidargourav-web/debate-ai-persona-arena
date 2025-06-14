
import React, { useEffect, useRef, useState } from "react";
import { SpotlightContext } from "./SpotlightContext";

/**
 * Provides a moving spotlight effect and context for all spotlight-aware components.
 */
export const SpotlightCursor: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [position, setPosition] = useState({ x: -9999, y: -9999 });
  const [visible, setVisible] = useState(false);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveSpotlight = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
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

  const size = 360;

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
            background: `radial-gradient(circle at center, hsla(142, 76%, 36%, 0.55) 0%, hsla(241,85%,52%,0.07) 36%, transparent 85%)`,
            filter: "blur(32px)",
            transition: "left 0.17s cubic-bezier(.25,.8,.25,1), top 0.17s cubic-bezier(.25,.8,.25,1)",
            transform: "translateZ(0)",
          }}
        />
      </div>
      {children}
    </SpotlightContext.Provider>
  );
};

export default SpotlightCursor;
