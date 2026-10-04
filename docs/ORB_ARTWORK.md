# Live energy orb

The orb is generated at runtime using Three.js, not an image asset. Three shader-driven ribbon meshes deform and rotate within a loosely spherical volume. A separate point cloud of 2,200 particles drifts through the ribbons.

Colors are violet, sapphire and cyan. Soft alpha edges and view-dependent highlights create translucent folds without a hard sphere or outer halo. This is an interpretation of the supplied reference, not an exact recreation.

The component loads lazily and caps rendering at approximately 30 fps. It pauses offscreen and in background tabs, supports reduced motion, and disposes its WebGL resources when unmounted. A CSS-only animated fallback is used when WebGL is unavailable or its context is lost.

Files: `src/components/EnergyOrb.tsx`, `src/components/EnergyOrbScene.tsx`, and the orb rules in `src/styles.css`. Runtime dependency: `three`; development types: `@types/three`.

`orb-motion-preview.gif` records the actual browser-rendered animation.
