# External 3D Assets Documentation

This document records the provenance, attribution, license, and technical specifications for all external 3D model assets (.glb) utilized in Tidebound.

All assets in this project are strictly licensed under the Creative Commons Zero (CC0 1.0 Universal) Public Domain Dedication. No non-CC0 assets are permitted.

## Asset Provenance and Licensing

| Asset File | Asset Name | Author | Source URL | Upstream License | Acquisition Date |
| --- | --- | --- | --- | --- | --- |
| `palm_tree.glb` | Palm Tree (Straight) | Kenney | https://kenney.nl/assets/pirate-kit | CC0 1.0 Universal | 2026-11-19 |
| `tree_jungle.glb` | Tall Forest Tree | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `tree_mangrove.glb` | Mangrove Tree | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `rock.glb` | Low-poly Rock A | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `rock_highlands.glb` | Highland Rock C | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `grass.glb` | Grass Tuft | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `container.glb` | Cargo Shipping Container | Kenney | https://kenney.nl/assets/watercraft-kit | CC0 1.0 Universal | 2026-11-19 |
| `barrel.glb` | Plastic / Metal Barrel | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `crate.glb` | Wooden Crate Box | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `scrap_pile.glb` | Industrial Cargo Scrap Pile | Kenney | https://kenney.nl/assets/watercraft-kit | CC0 1.0 Universal | 2026-11-19 |
| `axe.glb` | Survival Scrap Axe | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `campfire.glb` | Stone Pit Campfire | Kenney | https://kenney.nl/assets/survival-kit | CC0 1.0 Universal | 2026-11-19 |
| `slingshot.glb` | Wooden Bow Weapon | Quaternius | https://quaternius.com/packs/medievalweapons.html | CC0 1.0 Universal | 2026-11-19 |
| `raft.glb` | Modular Survival Raft | Quaternius | https://quaternius.com/packs/survival.html | CC0 1.0 Universal | 2026-11-19 |
| `hound.glb` | Feral Hound (Animated Wolf) | Quaternius | https://quaternius.com/packs/ultimateanimatedanimals.html | CC0 1.0 Universal | 2026-11-19 |
| `survivor.glb` | Survivor (Animated Humanoid) | Quaternius | https://quaternius.com/packs/knightcharacter.html | CC0 1.0 Universal | 2026-11-19 |
| `lurker.glb` | Tide Lurker (Animated Shark) | Quaternius | https://quaternius.com/packs/animatedfish.html | CC0 1.0 Universal | 2026-11-19 |

## Technical Budgets and Verification

Budget constraints for mobile runtime:
- Tree geometries: under 800 triangles.
- Rock geometries: under 300 triangles.
- Characters and animated creatures: under 3000 triangles.
- File size per model: under 250 KB.
- Total asset bundle: under 15 MB.
- Material shader: MeshLambertMaterial with runtime palette token recolouring.

### Model Audit Summary

- `axe.glb`: 8.4 KB, 84 triangles (passed).
- `barrel.glb`: 33.5 KB, 412 triangles (passed).
- `campfire.glb`: 25.8 KB, 305 triangles (passed).
- `container.glb`: 16.3 KB, 160 triangles (passed).
- `crate.glb`: 13.7 KB, 124 triangles (passed).
- `grass.glb`: 5.9 KB, 36 triangles (passed).
- `hound.glb`: 207.6 KB, 1962 triangles, 3 animations (passed).
- `lurker.glb`: 75.9 KB, 644 triangles, 1 animation (passed).
- `palm_tree.glb`: 35.7 KB, 338 triangles (passed).
- `raft.glb`: 57.0 KB, 1036 triangles (passed).
- `rock.glb`: 10.6 KB, 104 triangles (passed).
- `rock_highlands.glb`: 11.4 KB, 120 triangles (passed).
- `scrap_pile.glb`: 17.9 KB, 176 triangles (passed).
- `slingshot.glb`: 41.7 KB, 728 triangles (passed).
- `survivor.glb`: 220.0 KB, 956 triangles, 8 animations (passed).
- `tree_jungle.glb`: 24.1 KB, 254 triangles (passed).
- `tree_mangrove.glb`: 21.7 KB, 226 triangles (passed).

Total asset folder footprint: 0.81 MB (within 15.0 MB budget).
