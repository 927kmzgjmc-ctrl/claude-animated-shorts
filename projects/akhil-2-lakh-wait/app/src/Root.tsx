import React from "react";
import { Composition } from "remotion";
import { AkhilShort, AKHIL_FRAMES } from "./akhil/Short";
export const Root: React.FC = () => (
  <Composition id="AkhilShort" component={AkhilShort} durationInFrames={AKHIL_FRAMES} fps={30} width={576} height={1024} />
);
