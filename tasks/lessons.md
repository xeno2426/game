# Lessons Learned Log

| Date | Mistake / Finding | Rule Learned |
|---|---|---|
| 2026-11-19 | Standard touch listeners on mobile can cause default gestures (pinch zoom, pull-to-refresh, pan scroll). | Always set `touch-action: none` in CSS and register `{ passive: false }` event listeners where `e.preventDefault()` is required, plus track specific `pointerId`s. |
| 2026-11-19 | Browsers block AudioContext autoplay until the first explicit user interaction. | Initialize or resume the Web Audio context on the first user pointerdown/touchstart or start button click. |
| 2026-11-19 | Creating `new THREE.Vector3()` or scratch arrays in RAF loops triggers Garbage Collection pauses (jank) on mobile devices. | Pre-allocate scratch vectors, matrices, and quaternions statically outside hot loops, and use object pooling for bullets and particles. |
| 2026-11-19 | High DPI displays (e.g., Retina 3x) cause mobile GPUs to overheat and drop frames when rendering 3D canvas at native resolution. | Always clamp device pixel ratio with `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`. |
| 2026-11-19 | When backgrounding a mobile browser tab or app, `requestAnimationFrame` pauses; upon resumption, a large elapsed delta causes physics explosions or spiral-of-death catch-ups. | Implement fixed timestep updates with an accumulator clamped to a maximum delta (e.g. `Math.min(elapsed, 0.2)`). |
| 2026-11-19 | TypeScript strict checking (`noUnusedLocals`) fails build on unused scratch variable declarations. | Ensure all scratch vectors/matrices declared for zero-allocation are actively utilized or removed before building. |
| 2026-11-19 | TypeScript `verbatimModuleSyntax: true` fails builds when types/interfaces are imported without the `type` keyword. | Always use `import { type MyType }` or `import type { MyType }` for TypeScript types and interfaces. |
