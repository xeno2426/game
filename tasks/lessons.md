# Lessons Learned Log

| Date | Mistake | Rule |
|---|---|---|
| 2026-11-19 | Standard touch listeners on mobile can cause default gestures (pinch zoom, pull-to-refresh, pan scroll). | Always set touch-action: none in CSS and register non-passive event listeners where e.preventDefault() is required, plus track specific pointerIds. |
| 2026-11-19 | Browsers block AudioContext autoplay until the first explicit user interaction. | Initialize or resume the Web Audio context on the first user pointerdown or start button click. |
| 2026-11-19 | Creating new THREE.Vector3() or scratch arrays in RAF loops triggers Garbage Collection pauses on mobile devices. | Pre-allocate scratch vectors, matrices, and quaternions statically outside hot loops, and use object pooling for pickups and particles. |
| 2026-11-19 | High DPI displays cause mobile GPUs to overheat and drop frames when rendering 3D canvas at native resolution. | Always clamp device pixel ratio with renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)). |
| 2026-11-19 | When backgrounding a mobile browser tab, requestAnimationFrame pauses; upon resumption, a large elapsed delta causes physics explosions. | Implement fixed timestep updates with an accumulator clamped to a maximum delta (Math.min(elapsed, 0.2)). |
| 2026-11-19 | TypeScript strict checking (noUnusedLocals) fails build on unused scratch variable declarations. | Ensure all scratch vectors or matrices declared for zero-allocation are actively utilized or removed before building. |
| 2026-11-19 | TypeScript verbatimModuleSyntax fails builds when types or interfaces are imported without the type keyword. | Always use import type or import { type T } for TypeScript types and interfaces. |
| 2026-11-19 | Adding dozens of individual Three.js meshes to a scene causes high draw call counts on mobile. | Use THREE.InstancedMesh and shared palette atlas materials to render hundreds of entities in a few draw calls. |
| 2026-11-19 | PWA maskable icons will have edges cropped by Android OS adaptive icon shapes. | Ensure maskable icons keep important graphic content within a 70-80% inner safe circle against the background fill. |
| 2026-11-19 | Modern Capacitor 7/8 with Android Gradle Plugin 8.13+ requires Java 21 in CI. | Configure GitHub Actions with Java 21 (actions/setup-java@v4 with distribution: 'temurin') to compile the native Android APK cleanly. |
| 2026-11-19 | Hardcoded hex colors scattered across codebases create styling drift and make palette consistency hard to maintain. | Define every color once as a typed token in src/data/palette.ts and enforce zero hex literals outside palette.ts via automated tests. |
| 2026-11-19 | Decorative emojis in code, commits, or UI degrade professional aesthetics and break on older embedded systems. | Strictly forbid emojis across UI, code, comments, docs, and git commit messages, enforced via automated regex testing. |
| 2026-11-19 | In TypeScript with verbatimModuleSyntax and strict local checking, declaring unused imported types or callback arguments causes build failures. | Only import needed types and omit unused parameter names from array iteration callbacks. |
| 2026-11-19 | In Three.js and Vite PWA, generating depth-based water foam via depth textures can cause pipeline stalls on mobile GPUs. | Use baked analytical island height functions in the water shader to determine depth and foam with zero texture read passes. |
| 2026-11-19 | In as const typed objects, numeric properties get inferred as literal number types rather than general numbers. | Explicitly annotate variable types (let minD: number = ...) when storing and updating distances from typed constants. |
