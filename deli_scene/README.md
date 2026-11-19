# Deli Grocery 2.5D Scene Remake (100% Code: Three.js 3D + Canvas2D Cel Art)

A complete code-only recreation of the rainy **Deli Grocery** street scene — zero AI image generation and zero external image assets. Built using a true **2.5D hybrid pipeline**:
- **3D World (`scene.js` + `textures.js`):** Real `Three.js` WebGL2 3D geometry, wide-angle vertical `PerspectiveCamera`, real 3D lighting (`HemisphereLight`, shadow-casting `DirectionalLight`, warm Deli `PointLight`s, alley wall-sconce `SpotLight`), `UnrealBloomPass` halation, and procedural Canvas2D textures (running-bond brick, periwinkle stucco, recessed windows with blinds & blue interior glow, 2-tier dark-teal metal fire escape with stairs & drop ladder, red corrugated `"DELI GROCERY"` awning canopy + upright valance, 4-bay glowing grocery shelves/produce/`$3` tags, concrete stoop steps with open wrought-iron railings, wet cracked concrete sidewalk slabs, chain-link fence, and alley wall).
- **2D Characters (`characters2d.js`):** Four hand-inked flat cel-shaded characters rendered procedurally on high-resolution Canvas2D RGBA textures and mounted as 3D billboards in world space so depth occlusion (such as the man's pointing arm passing behind the 3D stoop stair balusters) and contact shadows happen natively in 3D.

## Render Locally
```bash
cd deli_scene
npm install
node render.mjs            # -> out/deli_scene_remake.png (1156x2032, clean)
node render.mjs --caption  # -> out/deli_scene_remake_captioned.png (with "birthdays" caption)
```
