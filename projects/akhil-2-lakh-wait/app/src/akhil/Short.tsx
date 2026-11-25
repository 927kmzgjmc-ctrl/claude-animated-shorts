// "The ₹2 Lakh Wait" composition: one three.js world, post chain from the bridge template:
// ink -> lens blur pre + main -> bloom -> NEUTRAL tone map -> grade (MSAA 4). Hard cuts, a white flash after the hook,
// fade to black at the end.
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, getInputProps, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { World } from "./world";
import { InkPass, noInkFallback } from "./ink";
import { LensBlur } from "./lensblur";
import { GradeEffect, GRADES, gradeFor } from "./grade";
import { TOTAL, FLASH_AT, FPS, shotAt } from "./story";

export const AKHIL_FRAMES = TOTAL;
type PostToggles = { ink: boolean; lens: boolean; bloom: boolean; grade: boolean; msaa: number };
const toggles = (): PostToggles => ({ ink: true, lens: true, bloom: true, grade: true, msaa: 2, ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}) });
const makeBloom = () => {
  const b = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.5, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
  const mip = b.mipmapBlurPass, setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
let WORLD: World | null = null;

const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => (WORLD ??= new World()), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, 1),
  }), [camera, scene]);
  const post = useMemo(() => (
    <EffectComposer multisampling={on.msaa}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : <></>}
      {on.lens ? <primitive object={fx.lens.pre} dispose={null} /> : <></>}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : <></>}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : <></>}
    </EffectComposer>
  ), [fx, on]);
  const s = shotAt(f);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(s, f, cam, scene);
  noInkFallback(world.root);
  cam.getWorldDirection(fwd);
  fpt.set(...(s.dof.focus ?? [target.x, target.y, target.z]));
  fx.lens.focus = Math.max(0.05, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = s.dof.c;
  gradeFor(fx.grade, s.light);
  return (<><primitive object={world.root} dispose={null} />{post}</>);
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;
export const AkhilShort: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = shotAt(f);
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  const fade = s.fade ? s.fade(f / FPS) : 0;
  return (
    <AbsoluteFill style={{ background: "#10131f" }}>
      <ThreeCanvas width={width} height={height} {...(dprOverride() ? { dpr: dprOverride() } : {})} shadows
        gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0, preserveDrawingBuffer: true }}
        camera={{ fov: 40, near: 0.05, far: 1200 }}>
        <Inner />
      </ThreeCanvas>
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
      {fade > 0 && <AbsoluteFill style={{ background: "#000000", opacity: fade }} />}
    </AbsoluteFill>
  );
};
