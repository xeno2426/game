# Tidebound — Colour Palette & Texture Atlas Guide

**Visual Direction:** Tropical Industrial (Stylized Low-Poly)  
**Target Platform:** Android (Mobile-First Readability)  
**Texture Pipeline:** 256×256 Colour Palette Texture Atlas (8×8 Grid, 32×32 px per swatch)

---

## 1. Visual Philosophy

**Tidebound** contrasts warm, weathered industrial rusts and sun-bleached wood against deep ocean teals and lush tropical foliage. This high-contrast split ensures crisp object silhouettes on 6-inch mobile screens, clearly separates interactive resources from background terrain, and shifts naturally between sunny **Low Tide** scavenging and stormy **High Tide** survival.

---

## 2. Environment, Ocean & Weather Lighting

These colours anchor the world terrain and drive the visual transition between clear weather and monsoon storms.

| Element | Colour Name | Hex Code | RGB | Usage Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Ocean (Shallow / Low Tide)** | Tropical Teal | `#1E8E8E` | `30, 142, 142` | Shallow water around beaches and exposed sunken ruins. |
| **Ocean (Deep / High Tide)** | Abyssal Navy | `#0D3B4C` | `13, 59, 76` | Deep ocean water and stormy sea base colour. |
| **Water Foam** | Seafoam White | `#E6F7F5` | `230, 247, 245` | Depth-based foam where water meets terrain, rocks, and base stilts. |
| **Dry Beach Sand** | Sun-Bleached Sand | `#DFC79A` | `223, 199, 154` | High-ground island terrain that remains dry at High Tide. |
| **Wet Sand / Seabed** | Wet Silt | `#8F7A5B` | `143, 122, 91` | Exposed seabed zones revealed when the tide recedes. |
| **Island Rock & Concrete** | Weathered Slate | `#6E7478` | `110, 116, 120` | Cliffs, boulders, and crumbling industrial foundations. |
| **Foliage (Sunlit)** | Palm Leaf Green | `#4E9A47` | `78, 154, 71` | Palm fronds, grass tufts, and overgrown island vines. |
| **Foliage (Shadow)** | Deep Jungle | `#265C36` | `38, 92, 54` | Under-canopy leaves and shaded terrain patches. |
| **Clear Sky / Fog** | Coastal Mist | `#A9D6E5` | `169, 214, 229` | Daytime horizon fog and directional ambient tint during Low Tide. |
| **Monsoon Fog / Sky** | Storm Slate | `#334452` | `51, 68, 82` | Dense storm fog during High Tide to mask distant island culling. |

---

## 3. Industrial Scrap, Base Building & Props

Slightly desaturated structural tones keep player bases clean and readable, while saturated industrial accents act as visual landmarks across the archipelago.

| Element | Colour Name | Hex Code | RGB | Usage Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Wood Base / Stilts** | Weathered Driftwood | `#9C6F44` | `156, 111, 68` | Modular foundations, stilts, walls, roofs, and raft bases. |
| **Dark Wood / Bark** | Aged Timber | `#5E4028` | `94, 64, 40` | Tree trunks, structural support beams, and tool handles. |
| **Rusted Metal** | Oxidised Rust | `#B35432` | `179, 84, 50` | Rusted cars, oil rig structures, and harvestable scrap piles. |
| **Heavy Steel** | Gunmetal Grey | `#4A525A` | `74, 82, 90` | Machetes, spears, harpoon guns, and workbench frames. |
| **Shipping Container (Red)** | Industrial Red | `#C04A3E` | `192, 74, 62` | Half-buried sunken containers serving as coastal landmarks. |
| **Shipping Container (Blue)** | Industrial Blue | `#2E5E7E` | `46, 94, 126` | Secondary shipping container variant for visual variety. |
| **Plastic Barrels** | Buoyancy Blue | `#1F75FE` | `31, 117, 254` | High-visibility floating barrels required for raft crafting. |
| **Hazard Accents** | Warning Yellow | `#E8B931` | `232, 185, 49` | Radio tower trim, oil rig railings, and life-preserver props. |
| **Campfire & Warmth** | Ember Orange | `#FF7A29` | `255, 122, 41` | Campfires, lanterns, and floodlights—strong warm focal point against cold storm blues. |

---

## 4. Loot, Enemies & Mobile HUD

High-contrast colours ensure pickups stand out on small screens and keep the 4-stat survival HUD instantly scannable during combat or storms.

| Element | Colour Name | Hex Code | RGB | Usage Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Electronics (PCB)** | Circuit Green | `#2ECC71` | `46, 204, 113` | High-tier circuit boards and batteries found at Low Tide. |
| **Electronics (Wire)** | Copper Coil | `#D97736` | `217, 119, 54` | Copper wire and salvaged electrical components. |
| **Pickup Fresnel Glow** | Salvage Gold | `#FFE066` | `255, 224, 102` | Subtle rim-light shader applied to droppable loot and crates. |
| **Feral Hound (Land)** | Muddy Ochre | `#7A5638` | `122, 86, 56` | Blends naturally with sand and rock until it telegraphs its lunge. |
| **Tide Lurker (Body)** | Kelp Dark | `#1A3A3A` | `26, 58, 58` | Dark amphibious silhouette in deep and stormy water. |
| **Tide Lurker (Glow)** | Bio Cyan | `#38F2E6` | `56, 242, 230` | Emissive eyes and fins for clear threat visibility during monsoon storms. |
| **HUD — Health** | Coral Red | `#E63946` | `230, 57, 70` | Primary health bar and medkit UI icons. |
| **HUD — Hydration** | Clear Sky Blue | `#29B6F6` | `41, 182, 246` | Hydration meter and rainwater collector UI icons. |
| **HUD — Hunger** | Warm Amber | `#F4A261` | `244, 162, 97` | Hunger meter and cooked food UI icons. |
| **HUD — Exposure** | Frost Cyan | `#7CE8FF` | `124, 232, 255` | Wetness/cold gauge that fills during rain and swimming. |
| **HUD — Tide Alert** | Signal Crimson | `#FF3B30` | `255, 59, 48` | Flashing tide gauge during the 1-minute High Tide transition warning. |

---

## 5. 256×256 Texture Atlas Implementation Guide

Mapping static props, modular base pieces, and tools to a single texture atlas allows the engine to batch hundreds of meshes into just a few draw calls on Android GPUs.

### Grid Layout Specification
* **Texture Dimensions:** `256 × 256 px` (uncompressed or ASTC 4×4 on Android; disable heavy lossy compression to avoid colour banding).
* **Grid Structure:** `8 × 8` tiles (`32 × 32 px` per swatch, supporting up to 64 colour slots).
* **UV Padding:** Keep UV islands at least **2–3 pixels inside** each 32×32 swatch boundary to prevent colour bleeding when mipmaps generate at distance.
* **Filtering Mode:** Use **Bilinear** for gradient swatches, or **Point (No Filter)** if using strictly flat solid swatches.

### 3-Tone Vertical Gradient Trick (Zero-Cost Ambient Occlusion)
Instead of filling each 32×32 swatch with a flat solid colour, paint a subtle vertical gradient inside each tile:
1. **Bottom 20%:** Base colour darkened by **15%**.
2. **Middle 60%:** Pure base hex colour.
3. **Top 20%:** Base colour lightened by **10%**.

When UV-unwrapping a low-poly tree trunk, wall, or shipping container in Blender, scale the UV vertically across its swatch. The bottom of the mesh automatically appears grounded and shaded while the top catches light—adding visual depth with **zero extra shader or lighting cost**.

---

## 6. Quick Hex Reference (Copy-Paste)

```text
# Environment & Weather
#1E8E8E, #0D3B4C, #E6F7F5, #DFC79A, #8F7A5B, #6E7478, #4E9A47, #265C36, #A9D6E5, #334452

# Industrial & Base Building
#9C6F44, #5E4028, #B35432, #4A525A, #C04A3E, #2E5E7E, #1F75FE, #E8B931, #FF7A29

# Loot, Enemies & HUD
#2ECC71, #D97736, #FFE066, #7A5638, #1A3A3A, #38F2E6, #E63946, #29B6F6, #F4A261, #7CE8FF, #FF3B30
```