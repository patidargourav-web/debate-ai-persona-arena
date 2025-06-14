
import React, { createContext, useContext } from "react";

type SpotlightContextType = {
  position: { x: number; y: number };
  visible: boolean;
};

export const SpotlightContext = createContext<SpotlightContextType>({
  position: { x: -9999, y: -9999 },
  visible: false,
});

export const useSpotlight = () => useContext(SpotlightContext);
