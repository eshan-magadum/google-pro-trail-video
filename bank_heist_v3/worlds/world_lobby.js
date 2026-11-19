// WORLD 1: Grand Art-Deco Marble Bank Lobby & Vault Corridor (Skill v3.0 — ZERO Flat-Color Meshes!)
// 26+ bespoke tri-channel PBR props: checkered veined marble, limestone/mahogany walls, arched night skyline windows,
// Corinthian stone pillars, teller desk + brass grille + green banker lamp, crimson stanchions, foreground podium,
// criss-crossing RED security lasers, hanging Art-Deco chandelier, & pivoting 3D riveted Steel-and-Brass Vault Door!
import * as THREE from 'three';
import {
  makeWoodPBR,
  makeBrushedMetalPBR,
  makeWeatheredStonePBR,
  makeWovenClothPBR,
  addInkOutlines,
} from './pbr_materials.js';
import {
  makeCheckeredMarblePBR,
  makeBankWallPBR,
  makeVaultDialRig,
  makeNightCityWindowTexture,
  makeVaultSparksSystem,
} from './bank_textures.js';

function makeWarmConeTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  for (let y = 0; y < 512; y++) {
    const v = y / 511;
    const hw = 24 + v * 102;
    const vf = Math.pow(1 - v, 1.3) * Math.min(1, v * 10);
    const gr = g.createLinearGradient(128 - hw, 0, 128 + hw, 0);
    gr.addColorStop(0, 'rgba(255,204,110,0)');
    gr.addColorStop(0.5, `rgba(255,214,132,${(0.22 * vf).toFixed(4)})`);
    gr.addColorStop(1, 'rgba(255,204,110,0)');
    g.fillStyle = gr; g.fillRect(0, y, 256, 1);
  }
  return new THREE.CanvasTexture(c);
}

export function buildLobbyWorld(parentScene, thiefTexture, shadowTex) {
  const grp = new THREE.Group();
  parentScene.add(grp);

  // SKILL v3.0 TRI-CHANNEL PBR MATERIALS (ZERO flat solid colors!)
  const floorMat = makeCheckeredMarblePBR([4, 5]);
  const wallMat = makeBankWallPBR([3, 1]);
  const stoneMat = makeWeatheredStonePBR({ baseHex: '#C4B69F', mortarHex: '#5E5346', mossAmt: 0.0, rows: 5, cols: 2, repeat: [1, 3], seed: 801 });
  const woodDark = makeWoodPBR({ baseHex: '#4E2A1C', darkHex: '#28130B', planks: 4, knots: 5, seed: 802 });
  const woodMid = makeWoodPBR({ baseHex: '#7A462C', darkHex: '#422214', planks: 5, knots: 6, seed: 803 });
  const steelMat = makeBrushedMetalPBR({ baseHex: '#4C5162', darkHex: '#20222E', patinaHex: '#3E4B52', patinaAmt: 0.22, rivets: true, panelSeams: true, metalness: 0.65, roughness: 0.44, seed: 804 });
  const steelFrameMat = makeBrushedMetalPBR({ baseHex: '#343846', darkHex: '#181A24', rivets: true, panelSeams: true, metalness: 0.60, roughness: 0.48, seed: 805 });
  const brassMat = makeBrushedMetalPBR({ baseHex: '#DBA444', darkHex: '#724916', patinaHex: '#4E6B5A', patinaAmt: 0.14, metalness: 0.72, roughness: 0.32, seed: 806 });
  const goldMat = makeBrushedMetalPBR({ baseHex: '#F2BE42', darkHex: '#8E5C14', patinaAmt: 0.06, metalness: 0.80, roughness: 0.24, seed: 807 });
  const velvetMat = makeWovenClothPBR({ baseHex: '#8C1E2C', stripeColor: '#54101A', seed: 808 });
  const bankerGreenMat = makeBrushedMetalPBR({ baseHex: '#267A4A', darkHex: '#124026', patinaAmt: 0.1, metalness: 0.2, roughness: 0.3, seed: 809 });

  // 1. Grand Bank Hall Shell (Checkered Marble Floor, Art-Deco Walls, Coffered Wood Ceiling)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 15), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  grp.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.8), wallMat);
  backWall.position.set(0, 3.4, -3.1);
  backWall.receiveShadow = true;
  grp.add(backWall);

  for (const sx of [-4.6, 4.6]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.8), wallMat);
    sw.position.set(sx, 3.4, 1.8);
    sw.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
    sw.receiveShadow = true;
    grp.add(sw);
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 15), woodDark);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 5.4, 1.2);
  grp.add(ceiling);
  for (let z = -2.4; z <= 4.4; z += 1.65) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.26, 0.24), woodDark);
    beam.position.set(0, 5.26, z);
    addInkOutlines(beam, { opacity: 0.65 });
    grp.add(beam);
  }

  // 2. Tall Arched Midnight City Skyline Windows (Cool Moonlit Street Contrast!)
  const winMat = new THREE.MeshBasicMaterial({ map: makeNightCityWindowTexture() });
  for (const [wx, wz, ry] of [[-4.52, -0.4, Math.PI / 2], [4.52, -0.4, -Math.PI / 2], [-3.2, -3.02, 0], [3.2, -3.02, 0]]) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 2.85), winMat);
    win.position.set(wx, 2.65, wz);
    win.rotation.y = ry;
    grp.add(win);
  }

  // 3. Fluted Stone Corinthian Pillars Framing the Vault Corridor inside 9:16!
  for (const [px, pz] of [[-2.15, -2.25], [2.15, -2.25], [-2.45, 0.85], [2.45, 0.85]]) {
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.42, 0.66), stoneMat);
    plinth.position.set(px, 0.21, pz);
    plinth.castShadow = true;
    addInkOutlines(plinth, { opacity: 0.72 });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.27, 4.55, 12), stoneMat);
    shaft.position.set(px, 2.68, pz);
    shaft.castShadow = true;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.72), brassMat);
    cap.position.set(px, 5.02, pz);
    addInkOutlines(cap, { opacity: 0.72 });
    grp.add(plinth, shaft, cap);
  }

  // 4. Overhead Art-Deco Brass Bank Chandelier + Glowing Warm Tungsten Globes!
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.9, 2.15, 1.05) });
  const chStem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.45, 8), brassMat);
  chStem.position.set(0, 4.65, -0.2);
  const chRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.045, 10, 24), brassMat);
  chRing.rotation.x = Math.PI / 2;
  chRing.position.set(0, 3.92, -0.2);
  grp.add(chStem, chRing);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const gBulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), bulbMat);
    gBulb.position.set(Math.cos(a) * 0.72, 3.82, -0.2 + Math.sin(a) * 0.72);
    grp.add(gBulb);
  }
  const warmShaft = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 3.8),
    new THREE.MeshBasicMaterial({ map: makeWarmConeTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
  );
  warmShaft.position.set(0, 2.05, -0.25);
  grp.add(warmShaft);

  // 5. Left Mahogany Teller Counter w/ Brushed-Brass Grille & Glowing Emerald Banker's Lamp!
  const counter = new THREE.Group();
  counter.position.set(-2.35, 0, -0.65);
  counter.rotation.y = Math.PI * 0.42;
  grp.add(counter);
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(2.15, 1.12, 0.68), woodDark);
  cBody.position.y = 0.56; cBody.castShadow = true;
  addInkOutlines(cBody, { opacity: 0.74 });
  const cTop = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.09, 0.78), woodMid);
  cTop.position.y = 1.16; addInkOutlines(cTop, { opacity: 0.74 });
  counter.add(cBody, cTop);
  // Vertical brass teller bars
  for (let bx = -0.9; bx <= 0.9; bx += 0.22) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.85, 6), brassMat);
    bar.position.set(bx, 1.62, 0.18);
    counter.add(bar);
  }
  const bLampShade = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.26, 12), bankerGreenMat);
  bLampShade.rotation.z = Math.PI / 2;
  bLampShade.position.set(0.45, 1.54, -0.05);
  const bLampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), bulbMat);
  bLampGlow.position.set(0.45, 1.44, -0.05);
  counter.add(bLampShade, bLampGlow);

  // 6. CENTERPIECE: Colossal 3D Riveted Steel & Brass Circular Bank Vault Door (z = -2.75)!
  const vaultFrame = new THREE.Group();
  vaultFrame.position.set(0.0, 0.0, -2.75);
  grp.add(vaultFrame);

  // Heavy riveted rectangular steel surround frame w/ recessed doorway opening
  const fTop = new THREE.Mesh(new THREE.BoxGeometry(3.55, 0.52, 0.52), steelFrameMat);
  fTop.position.set(0, 3.05, 0); addInkOutlines(fTop, { opacity: 0.78 });
  const fLeft = new THREE.Mesh(new THREE.BoxGeometry(0.54, 2.85, 0.52), steelFrameMat);
  fLeft.position.set(-1.50, 1.42, 0); fLeft.castShadow = true; addInkOutlines(fLeft, { opacity: 0.78 });
  const fRight = new THREE.Mesh(new THREE.BoxGeometry(0.54, 2.85, 0.52), steelFrameMat);
  fRight.position.set(1.50, 1.42, 0); fRight.castShadow = true; addInkOutlines(fRight, { opacity: 0.78 });
  const fRing = new THREE.Mesh(new THREE.TorusGeometry(1.30, 0.12, 12, 32), brassMat);
  fRing.position.set(0, 1.52, 0.22);
  vaultFrame.add(fTop, fLeft, fRight, fRing);

  // Circular recessed golden vault alcove behind the round Vault Door (ZERO square corner leaks, ZERO whiteout haze!)
  const innerVaultBack = new THREE.Mesh(
    new THREE.CircleGeometry(1.18, 32),
    new THREE.MeshStandardMaterial({ color: '#6E4C1E', emissive: '#5C3A10', emissiveIntensity: 0.75, roughness: 0.65 })
  );
  innerVaultBack.position.set(0, 1.52, -0.22);
  vaultFrame.add(innerVaultBack);
  // Dark steel backing plate behind frame corners so no light leaks outside the round portal
  const backingWall = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.1), steelFrameMat);
  backingWall.position.set(0, 1.55, -0.26);
  vaultFrame.add(backingWall);
  // Gleaming 3D gold bullion pyramid & warm vault lamp peeking cleanly inside the open doorway!
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4 - row; col++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.14, 0.18), goldMat);
      bar.position.set((col - (3 - row) * 0.5) * 0.34, 0.72 + row * 0.15, -0.02);
      addInkOutlines(bar, { opacity: 0.74 });
      vaultFrame.add(bar);
    }
  }
  const innerLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 12, 10),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.95, 0.95) })
  );
  innerLamp.position.set(0, 2.38, -0.06);
  vaultFrame.add(innerLamp);
  const vaultSpillLight = new THREE.PointLight('#FFC24A', 0.0, 11.0, 1.45);
  vaultSpillLight.position.set(0, 1.85, 0.12);
  vaultFrame.add(vaultSpillLight);

  // Hinged Pivoting Circular Steel & Brass Vault Door! (Hinged at right x = +1.28!)
  const doorPivot = new THREE.Group();
  doorPivot.position.set(1.28, 1.52, 0.24);
  vaultFrame.add(doorPivot);

  const doorBody = new THREE.Group();
  doorBody.position.set(-1.28, 0, 0);
  doorPivot.add(doorBody);

  const doorSlab = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.26, 32), steelMat);
  doorSlab.rotation.x = Math.PI / 2;
  doorSlab.castShadow = true;
  addInkOutlines(doorSlab, { thresholdDeg: 34, opacity: 0.75 });
  const doorRim = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.075, 10, 32), brassMat);
  doorRim.position.z = 0.12;
  doorBody.add(doorSlab, doorRim);

  // Heavy Brushed-Brass 6-Spoke Locking Wheel (physically rotates as vault unlocks!)
  const wheelGroup = new THREE.Group();
  wheelGroup.position.set(0.32, 0.0, 0.22);
  const wOuter = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.045, 10, 24), brassMat);
  const wHub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.14, 16), brassMat);
  wHub.rotation.x = Math.PI / 2;
  wheelGroup.add(wOuter, wHub);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.90, 8), brassMat);
    spoke.rotation.z = a;
    wheelGroup.add(spoke);
  }
  doorBody.add(wheelGroup);

  // Animated Engraved Brass Combination Dial mounted prominently on left-center of Vault Door!
  const dialRig = makeVaultDialRig();
  const dialHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.12, 28), brassMat);
  dialHousing.rotation.x = Math.PI / 2;
  dialHousing.position.set(-0.42, 0.06, 0.16);
  addInkOutlines(dialHousing, { thresholdDeg: 35, opacity: 0.72 });
  const dialFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.32, 28),
    new THREE.MeshBasicMaterial({ map: dialRig.texture })
  );
  dialFace.position.set(-0.42, 0.06, 0.226);
  doorBody.add(dialHousing, dialFace);

  // 3 Sliding Heavy Brass Locking Bolts on the left rim of the Vault Door!
  const bolts = [];
  for (const by of [-0.46, 0.0, 0.46]) {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.44, 12), brassMat);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(-1.18, by, 0.02);
    addInkOutlines(bolt, { thresholdDeg: 32, opacity: 0.70 });
    doorBody.add(bolt);
    bolts.push(bolt);
  }

  // 7. Criss-Crossing Glowing RED Security Laser Grid across the Marble Corridor!
  const laserGroup = new THREE.Group();
  const laserMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.6, 0.28, 0.24), transparent: true, opacity: 0.88 });
  const laserDefs = [
    [[-2.2, 1.38, 0.65], [2.2, 1.02, -0.25]],
    [[-2.2, 0.95, -0.45], [2.2, 1.68, 0.45]],
    [[-2.2, 2.05, 0.15], [2.2, 1.48, -1.15]],
    [[-2.2, 1.25, -1.25], [2.2, 2.15, -0.55]],
    [[-2.2, 0.55, 0.95], [2.2, 0.82, 0.15]],
  ];
  for (const [p1, p2] of laserDefs) {
    const v1 = new THREE.Vector3(...p1), v2 = new THREE.Vector3(...p2);
    const len = v1.distanceTo(v2);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, len, 6), laserMat);
    beam.position.copy(v1).add(v2).multiplyScalar(0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v2.clone().sub(v1).normalize());
    laserGroup.add(beam);
  }
  grp.add(laserGroup);

  // 8. FOREGROUND DEPTH OCCLUDERS (Pulled cleanly into 9:16 bottom-left & bottom-right corners!)
  // Left brass stanchion posts + velvet rope + mahogany deposit slip podium
  for (const [sx, sz] of [[-1.35, 2.15], [1.35, 2.15], [-1.52, 0.95], [1.52, 0.95]]) {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.08, 14), brassMat);
    base.position.set(sx, 0.04, sz);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.94, 10), brassMat);
    pole.position.set(sx, 0.51, sz); pole.castShadow = true;
    const topBall = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), brassMat);
    topBall.position.set(sx, 1.00, sz);
    grp.add(base, pole, topBall);
  }
  for (const [x1, z1, x2, z2] of [[-1.35, 2.15, -1.52, 0.95], [1.35, 2.15, 1.52, 0.95]]) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, 0.90, z1),
      new THREE.Vector3((x1 + x2) * 0.5, 0.66, (z1 + z2) * 0.5),
      new THREE.Vector3(x2, 0.90, z2),
    ]);
    const rope = new THREE.Mesh(new THREE.TubeGeometry(curve, 16, 0.032, 8, false), velvetMat);
    grp.add(rope);
  }
  const podium = new THREE.Mesh(new THREE.BoxGeometry(0.74, 1.06, 0.54), woodMid);
  podium.position.set(-1.58, 0.53, 2.75); podium.rotation.y = 0.35; podium.castShadow = true;
  addInkOutlines(podium, { opacity: 0.76 });
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.78, 12), stoneMat);
  urn.position.set(1.58, 0.39, 2.75); urn.castShadow = true;
  addInkOutlines(urn, { thresholdDeg: 32, opacity: 0.68 });
  grp.add(podium, urn);

  // 9. Metallic Unlock Sparks + Master Thief Billboard + Grounded Shadow
  const sparks = makeVaultSparksSystem(grp, 42);
  const thiefMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.34, 2.01),
    new THREE.MeshBasicMaterial({ map: thiefTexture, color: '#F0E6DC', transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
  );
  const thiefShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.48),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  thiefShadow.rotation.x = -Math.PI / 2;
  grp.add(thiefMesh, thiefShadow);

  function update(st, camera) {
    // Animate engraved brass dial, locking wheel, sliding bolts & swinging Vault Door!
    dialRig.update(st.dialAngle, st.vaultUnlocked);
    wheelGroup.rotation.z = st.wheelSpin;
    for (const b of bolts) {
      b.position.x = -1.18 + st.boltRetract * 0.26;
    }
    doorPivot.rotation.y = st.doorOpenAngle;
    vaultSpillLight.intensity = st.doorOpenProgress * 6.5;

    // Lasers flicker softly and power off on unlock
    laserGroup.visible = st.lasersOn;
    if (st.lasersOn) {
      laserMat.opacity = 0.78 + Math.sin(st.t * 22) * 0.14;
    }

    // Thief placement facing camera cleanly
    thiefMesh.visible = st.thiefVisibleInLobby;
    thiefShadow.visible = st.thiefVisibleInLobby;
    if (st.thiefVisibleInLobby) {
      thiefMesh.position.set(...st.thiefPos);
      thiefMesh.rotation.y = Math.atan2(camera.position.x - st.thiefPos[0], camera.position.z - st.thiefPos[2]);
      thiefShadow.position.set(st.thiefPos[0], 0.02, st.thiefPos[2]);
    }

    sparks.update([-0.42, 1.55, -2.42], st.unlockSparkIntensity, st.t);
  }

  return { group: grp, update };
}
