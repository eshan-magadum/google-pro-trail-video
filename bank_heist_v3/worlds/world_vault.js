// WORLD 2: Inside the Glittering Gold-Bullion Bank Vault (Skill v3.0 — ZERO Flat-Color Meshes!)
// 24+ bespoke tri-channel PBR props: 64-locker safety deposit box steel walls, heavy riveted bullion shelving,
// 24+ gleaming beveled gold bars, strapped $10K cash stacks, overflowing canvas loot duffel, overhead golden cage lamp,
// spinning RED ALARM BEACON, foreground wooden bullion crates, Master Thief + Donut-Eating Security Guard Twist!
import * as THREE from 'three';
import {
  makeWoodPBR,
  makeBrushedMetalPBR,
  makeWeatheredStonePBR,
  makeWovenClothPBR,
  addInkOutlines,
} from './pbr_materials.js';
import {
  makeDepositBoxWallPBR,
  makeCashBundlePBR,
  makeVaultSparksSystem,
} from './bank_textures.js';

function makeFlashlightConeTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  for (let y = 0; y < 512; y++) {
    const v = y / 511;
    const hw = 16 + v * 108;
    const vf = Math.pow(1 - v, 1.15) * Math.min(1, v * 12);
    const gr = g.createLinearGradient(128 - hw, 0, 128 + hw, 0);
    gr.addColorStop(0, 'rgba(255,244,175,0)');
    gr.addColorStop(0.5, `rgba(255,246,188,${(0.28 * vf).toFixed(4)})`);
    gr.addColorStop(1, 'rgba(255,244,175,0)');
    g.fillStyle = gr; g.fillRect(0, y, 256, 1);
  }
  return new THREE.CanvasTexture(c);
}

export function buildVaultWorld(parentScene, thiefTexture, guardTexture, shadowTex) {
  const grp = new THREE.Group();
  parentScene.add(grp);

  // SKILL v3.0 TRI-CHANNEL PBR MATERIALS (ZERO flat solid colors!)
  const floorMat = makeWeatheredStonePBR({ baseHex: '#4E505E', mortarHex: '#1D1E28', mossAmt: 0.0, rows: 5, cols: 5, repeat: [3, 3], roughness: 0.56, seed: 901 });
  const lockerWallMat = makeDepositBoxWallPBR([2, 2]);
  const steelMat = makeBrushedMetalPBR({ baseHex: '#4E5466', darkHex: '#242736', rivets: true, panelSeams: true, metalness: 0.56, roughness: 0.44, seed: 902 });
  const goldBarMat = makeBrushedMetalPBR({ baseHex: '#FFD24E', darkHex: '#B67818', patinaAmt: 0.02, metalness: 0.62, roughness: 0.28, seed: 903 });
  const brassMat = makeBrushedMetalPBR({ baseHex: '#E0A846', darkHex: '#7A4E18', metalness: 0.66, roughness: 0.34, seed: 904 });
  const cashMat = makeCashBundlePBR();
  const crateMat = makeWoodPBR({ baseHex: '#8C5B38', darkHex: '#4E2F1A', planks: 4, knots: 6, seed: 905 });
  const canvasSackMat = makeWovenClothPBR({ baseHex: '#D2C09E', stripeColor: '#3A2E24', seed: 906 });

  // 1. Armored Vault Interior Shell (Stone Tile Floor + Numbered Safety Deposit Box Walls + Steel Ceiling)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  grp.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 5.4), lockerWallMat);
  backWall.position.set(0, 2.7, -3.1);
  backWall.receiveShadow = true;
  grp.add(backWall);

  for (const sx of [-3.4, 3.4]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(10, 5.4), lockerWallMat);
    sw.position.set(sx, 2.7, 1.2);
    sw.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
    sw.receiveShadow = true;
    grp.add(sw);
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), steelMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 4.9, 1.0);
  grp.add(ceiling);

  // Heavy riveted steel structural ribs framing vault corners
  for (const rx of [-2.15, 2.15]) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.32, 4.9, 0.34), steelMat);
    rib.position.set(rx, 2.45, -2.96);
    addInkOutlines(rib, { opacity: 0.78 });
    grp.add(rib);
  }

  // 2. Overhead Warm Golden Industrial Cage Lamp illuminating the Treasure Mountain!
  const lampBulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 12, 10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(3.0, 2.2, 1.05) })
  );
  lampBulb.position.set(0, 3.88, -0.95);
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.28, 16, 1, true), brassMat);
  lampShade.position.set(0, 4.04, -0.95);
  const lampCord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 8), steelMat);
  lampCord.position.set(0, 4.5, -0.95);
  grp.add(lampBulb, lampShade, lampCord);

  // 3. Central Armored Bullion Table piled high with Gleaming Gold Bars & Strapped $10K Cash Bundles!
  const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.14, 1.08), steelMat);
  tableTop.position.set(0, 0.88, -1.78); tableTop.castShadow = true; tableTop.receiveShadow = true;
  addInkOutlines(tableTop, { opacity: 0.78 });
  grp.add(tableTop);
  for (const lx of [-1.18, 1.18]) {
    for (const lz of [-2.20, -1.36]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.88, 0.11), steelMat);
      leg.position.set(lx, 0.44, lz); addInkOutlines(leg, { opacity: 0.72 });
      grp.add(leg);
    }
  }

  // Gleaming Gold Bullion Pyramid on Central Table (15 beveled gold bars w/ ink outlines!)
  for (let row = 0; row < 4; row++) {
    const count = 4 - row;
    for (let c = 0; c < count; c++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.18), goldBarMat);
      bar.position.set(-0.08 + (c - (count - 1) * 0.5) * 0.35, 1.02 + row * 0.145, -1.78);
      bar.rotation.y = (c % 2 === 0 ? 0.04 : -0.04);
      bar.castShadow = true;
      addInkOutlines(bar, { opacity: 0.72 });
      grp.add(bar);
    }
  }
  // Strapped Green $10K Cash Stacks flanking the gold pyramid!
  for (let i = 0; i < 6; i++) {
    const cash = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.09, 0.14), cashMat);
    cash.position.set(0.76 + (i % 2) * 0.27, 1.00 + Math.floor(i / 2) * 0.095, -1.68 + (i % 3) * 0.04);
    cash.rotation.y = (i - 2) * 0.12;
    addInkOutlines(cash, { opacity: 0.65 });
    grp.add(cash);
  }
  // Compact Stitched Canvas Loot Duffel Bag on far left corner of table
  const duffel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.44, 12), canvasSackMat);
  duffel.rotation.z = Math.PI / 2;
  duffel.position.set(-1.02, 1.10, -1.62);
  duffel.rotation.y = 0.28;
  addInkOutlines(duffel, { thresholdDeg: 35, opacity: 0.62 });
  grp.add(duffel);

  // 4. Flanking Heavy Riveted Bullion Shelving Racks (Inside 9:16 Left & Right Midground!)
  for (const side of [-1, 1]) {
    const sx = side * 1.85;
    for (const sy of [0.55, 1.38, 2.22]) {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 1.45), steelMat);
      shelf.position.set(sx, sy, -0.85);
      addInkOutlines(shelf, { opacity: 0.70 });
      grp.add(shelf);
      for (let k = 0; k < 3; k++) {
        const item = new THREE.Mesh(
          new THREE.BoxGeometry(0.28, 0.13, 0.18),
          (k + (sy > 1 ? 1 : 0)) % 2 === 0 ? goldBarMat : cashMat
        );
        item.position.set(sx - side * 0.12, sy + 0.11, -1.25 + k * 0.42);
        addInkOutlines(item, { opacity: 0.68 });
        grp.add(item);
      }
    }
    for (const sz of [-1.52, -0.18]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.75, 0.08), steelMat);
      post.position.set(sx - side * 0.42, 1.38, sz);
      grp.add(post);
    }
  }

  // 5. Wall-Mounted Spinning RED SECURITY ALARM BEACON + Sweeping Crimson PointLight!
  const alarmBox = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.32, 0.22), steelMat);
  alarmBox.position.set(0.0, 3.12, -2.96);
  addInkOutlines(alarmBox, { opacity: 0.78 });
  const alarmDomeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 0.18, 0.18) });
  const alarmDome = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), alarmDomeMat);
  alarmDome.position.set(0.0, 3.34, -2.88);
  const alarmLight = new THREE.PointLight('#FF2622', 0.0, 14.0, 1.3);
  alarmLight.position.set(0.0, 3.15, -2.55);
  grp.add(alarmBox, alarmDome, alarmLight);

  // 6. FOREGROUND DEPTH OCCLUDERS (Bottom-Left Wooden Bullion Crate w/ Gold Bars + Bottom-Right Cash Crate!)
  const fgCrateL = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.62, 0.76), crateMat);
  fgCrateL.position.set(-1.55, 0.31, 2.05); fgCrateL.rotation.y = 0.28; fgCrateL.castShadow = true;
  addInkOutlines(fgCrateL, { opacity: 0.76 });
  const fgBarL = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.18), goldBarMat);
  fgBarL.position.set(-1.45, 0.69, 1.98); fgBarL.rotation.y = 0.55;
  addInkOutlines(fgBarL, { opacity: 0.72 });

  const fgCrateR = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.56, 0.72), crateMat);
  fgCrateR.position.set(1.58, 0.28, 2.08); fgCrateR.rotation.y = -0.24; fgCrateR.castShadow = true;
  addInkOutlines(fgCrateR, { opacity: 0.76 });
  const fgCashR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.11, 0.18), cashMat);
  fgCashR.position.set(1.48, 0.62, 2.02); fgCashR.rotation.y = -0.35;
  addInkOutlines(fgCashR, { opacity: 0.68 });
  grp.add(fgCrateL, fgBarL, fgCrateR, fgCashR);

  // 7. Sparks from overloaded alarm relay + Master Thief + Night Security Guard + Flashlight Beam!
  const sparks = makeVaultSparksSystem(grp, 36);

  const thiefMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.30, 1.95),
    new THREE.MeshBasicMaterial({ map: thiefTexture, color: '#F2EAE0', transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
  );
  const thiefShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.48),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  thiefShadow.rotation.x = -Math.PI / 2;

  const guardMat = new THREE.MeshBasicMaterial({ map: guardTexture, color: '#F0EAE4', transparent: true, opacity: 1.0, alphaTest: 0.05, side: THREE.DoubleSide });
  const guardMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 1.98), guardMat);
  const guardShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.48),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  guardShadow.rotation.x = -Math.PI / 2;

  // Soft glowing yellow flashlight beam projecting LEFT from Guard's flashlight lens directly onto panicked Thief!
  const flConeMat = new THREE.MeshBasicMaterial({
    map: makeFlashlightConeTex(), transparent: true, opacity: 0.0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const flCone = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.55), flConeMat);
  flCone.rotation.z = Math.PI * 0.50; // Cone apex at right (+x = flashlight lens), fanning out LEFT onto Thief!
  flCone.position.set(-0.22, 1.02, 0.24);

  grp.add(thiefMesh, thiefShadow, guardMesh, guardShadow, flCone);

  function update(st, camera) {
    // Alarm strobe pulse once triggered (f >= 216)!
    const pulse = st.alarmOn ? (0.5 + 0.5 * Math.sin(st.t * 14.0)) : 0.0;
    alarmDomeMat.color.setRGB(1.1 + pulse * 3.0, 0.16 + pulse * 0.18, 0.16);
    alarmLight.intensity = st.alarmOn ? (2.5 + pulse * 10.5) : 0.0;
    sparks.update([0.0, 3.08, -2.75], st.alarmSparkIntensity, st.t);

    // Thief placement
    thiefMesh.position.set(...st.thiefPos);
    thiefMesh.rotation.y = Math.atan2(camera.position.x - st.thiefPos[0], camera.position.z - st.thiefPos[2]);
    thiefShadow.position.set(st.thiefPos[0], 0.02, st.thiefPos[2]);

    // Guard walks in calmly from right side & shines flashlight LEFT onto Thief!
    guardMesh.visible = st.guardVisible;
    guardShadow.visible = st.guardVisible;
    flCone.visible = st.guardVisible && st.flashlightAlpha > 0.02;
    if (st.guardVisible) {
      guardMesh.position.set(...st.guardPos);
      guardMesh.rotation.y = Math.atan2(camera.position.x - st.guardPos[0], camera.position.z - st.guardPos[2]);
      guardShadow.position.set(st.guardPos[0], 0.02, st.guardPos[2]);
      flConeMat.opacity = st.flashlightAlpha * 0.72;
      flCone.position.set(st.guardPos[0] - 1.05, 1.02, st.guardPos[2] + 0.14);
    }
  }

  return { group: grp, update };
}
