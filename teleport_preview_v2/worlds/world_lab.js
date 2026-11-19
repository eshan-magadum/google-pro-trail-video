// WORLD 1: Warm Vintage Brass-and-Wood Inventor's Teleportation Lab (Skill v2.0 Single-Frame Standard)
// 24+ bespoke 3D props, ornate Persian rug, bookshelves, chalk equations, foreground cluttered workbench & crates,
// 3D helical copper Tesla coils, animated brass OVERLOAD gauge, power cables, Edison lamps, directional sparks.
import * as THREE from 'three';
import {
  makeLabBrickWallTexture,
  makeOakFloorTexture,
  makeOrnamentalRugTexture,
  makeBookshelfTexture,
  makeChalkboardTexture,
  makeDynamicGaugeRig,
  makeHelicalCopperCoil,
  makeStreakSparksSystem,
} from './env_helpers.js';

function makeWarmShaftTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  for (let y = 0; y < 512; y++) {
    const v = y / 511;
    const hw = 18 + v * 108;
    const vf = Math.pow(1 - v, 1.35) * Math.min(1, v * 10);
    const gr = g.createLinearGradient(128 - hw, 0, 128 + hw, 0);
    gr.addColorStop(0, 'rgba(255,195,110,0)');
    gr.addColorStop(0.5, `rgba(255,208,132,${(0.22 * vf).toFixed(4)})`);
    gr.addColorStop(1, 'rgba(255,195,110,0)');
    g.fillStyle = gr; g.fillRect(0, y, 256, 1);
  }
  return new THREE.CanvasTexture(c);
}

export function buildLabWorld(parentScene, heroTexture, shadowTex) {
  const grp = new THREE.Group();
  parentScene.add(grp);

  // Materials (warm natural brass, mahogany, aged brick, copper — ZERO blue wash!)
  const wallMat = new THREE.MeshStandardMaterial({ map: makeLabBrickWallTexture(), roughness: 0.88 });
  const floorMat = new THREE.MeshStandardMaterial({ map: makeOakFloorTexture(), roughness: 0.82 });
  const woodDark = new THREE.MeshStandardMaterial({ color: '#4B2B1F', roughness: 0.78 });
  const woodMid = new THREE.MeshStandardMaterial({ color: '#73442E', roughness: 0.74 });
  const ironMat = new THREE.MeshStandardMaterial({ color: '#2F2C36', roughness: 0.58, metalness: 0.45 });
  const brassMat = new THREE.MeshStandardMaterial({ color: '#D4A148', roughness: 0.36, metalness: 0.65 });
  const copperMat = new THREE.MeshStandardMaterial({ color: '#C86A3B', roughness: 0.35, metalness: 0.68 });
  const crateMat = new THREE.MeshStandardMaterial({ color: '#8A5A3A', roughness: 0.85 });

  // 1. Room Shell: Oak Floor, Ornate Crimson-Gold Persian Rug, Brick/Mahogany Walls & Beamed Ceiling
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  grp.add(floor);

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(4.4, 6.2),
    new THREE.MeshStandardMaterial({ map: makeOrnamentalRugTexture(), roughness: 0.94 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0.0, 0.012, 0.4);
  grp.add(rug);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.8), wallMat);
  backWall.position.set(0, 3.4, -3.4);
  grp.add(backWall);

  for (const sx of [-5.2, 5.2]) {
    const sw = new THREE.Mesh(new THREE.PlaneGeometry(14, 6.8), wallMat);
    sw.position.set(sx, 3.4, 1.8);
    sw.rotation.y = sx < 0 ? Math.PI / 2 : -Math.PI / 2;
    grp.add(sw);
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), woodDark);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 5.4, 1.0);
  grp.add(ceiling);

  // Heavy exposed ceiling timber beams & brass steam pipes running across back wall
  for (let z = -2.6; z <= 4.2; z += 1.7) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.24, 0.22), woodDark);
    beam.position.set(0, 5.25, z);
    grp.add(beam);
  }
  for (const py of [3.9, 4.22]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 10.4, 12), copperMat);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, py, -3.22);
    grp.add(pipe);
  }

  // 2. Giant Slate Chalkboard (Left-Back) + 2 Stuffed Vintage Bookshelves (Flanking!)
  const chalkBoard = new THREE.Mesh(
    new THREE.BoxGeometry(2.95, 1.95, 0.08),
    [woodDark, woodDark, woodDark, woodDark, new THREE.MeshStandardMaterial({ map: makeChalkboardTexture(), roughness: 0.88 }), woodDark]
  );
  chalkBoard.position.set(-2.55, 2.38, -3.32);
  grp.add(chalkBoard);

  const shelfTex = makeBookshelfTexture();
  const shelfFace = new THREE.MeshStandardMaterial({ map: shelfTex, roughness: 0.82 });
  for (const [bx, bz, ry] of [[3.05, -3.05, 0], [-4.85, -0.6, Math.PI / 2], [4.85, -0.4, -Math.PI / 2]]) {
    const bs = new THREE.Mesh(
      new THREE.BoxGeometry(1.95, 3.15, 0.55),
      [woodDark, woodDark, woodDark, woodDark, shelfFace, woodDark]
    );
    bs.position.set(bx, 1.58, bz);
    bs.rotation.y = ry;
    grp.add(bs);
  }

  // 3. Three Warm Hanging Edison Cage Lamps + Soft Volumetric Golden Shafts
  const edisonMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3.6, 2.55, 1.25) });
  const shaftTex = makeWarmShaftTex();
  const shaftMat = new THREE.MeshBasicMaterial({
    map: shaftTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  for (const [lx, ly, lz] of [[-2.15, 3.65, -0.9], [0.05, 4.15, -1.35], [2.35, 3.55, -0.6]]) {
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 5.4 - ly, 6), ironMat);
    cord.position.set(lx, ly + (5.4 - ly) * 0.5, lz);
    grp.add(cord);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.22, 16, 1, true), brassMat);
    shade.position.set(lx, ly + 0.08, lz);
    grp.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.095, 12, 10), edisonMat);
    bulb.position.set(lx, ly - 0.04, lz);
    grp.add(bulb);
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.3), shaftMat);
    shaft.position.set(lx, ly - 1.75, lz - 0.1);
    grp.add(shaft);
  }

  // 4. CENTERPIECE: 3D Brass-and-Glass Teleporter Chamber + Flanking Helical Copper Tesla Coils!
  const podGroup = new THREE.Group();
  podGroup.position.set(0.25, 0.0, -1.25);
  grp.add(podGroup);

  // Hexagonal stepped brass & iron platform
  const baseBot = new THREE.Mesh(new THREE.CylinderGeometry(1.48, 1.62, 0.22, 12), ironMat);
  baseBot.position.y = 0.11;
  const baseTop = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.32, 0.14, 12), brassMat);
  baseTop.position.y = 0.28;
  podGroup.add(baseBot, baseTop);

  // Glowing cyan-gold floor emitter pad inside pod
  const padGlowMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 2.2, 2.6) });
  const padRing = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.045, 10, 32), padGlowMat);
  padRing.rotation.x = Math.PI / 2;
  padRing.position.y = 0.36;
  const padCore = new THREE.Mesh(
    new THREE.CircleGeometry(0.92, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 1.15, 1.45), transparent: true, opacity: 0.45 })
  );
  padCore.rotation.x = -Math.PI / 2;
  padCore.position.y = 0.355;
  podGroup.add(padRing, padCore);

  // Translucent curved glass containment cylinder (ultra-clear specular sheen, zero milky haze over Hero!)
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#A8DCE8', roughness: 0.10, metalness: 0.08, transparent: true, opacity: 0.055, depthWrite: false, side: THREE.DoubleSide,
  });
  const glassCyl = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 2.55, 28, 1, true), glassMat);
  glassCyl.position.y = 1.62;
  podGroup.add(glassCyl);

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI * 0.25;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 2.65, 10), brassMat);
    col.position.set(Math.cos(a) * 1.15, 1.62, Math.sin(a) * 1.15);
    podGroup.add(col);
  }
  // Domed Brass Emitter Crown overhead
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(1.26, 1.32, 0.24, 16), brassMat);
  crownBase.position.y = 2.95;
  const crownDome = new THREE.Mesh(new THREE.SphereGeometry(1.18, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), copperMat);
  crownDome.position.y = 3.06;
  const crownTip = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.85, 2.0, 2.4) }));
  crownTip.position.y = 4.25;
  podGroup.add(crownBase, crownDome, crownTip);

  // TWO Full 3D Helical Copper Tesla Coils flanking left & right of the Teleporter!
  const coilL = makeHelicalCopperCoil({ radius: 0.24, height: 1.95, turns: 16 });
  coilL.position.set(-1.48, 1.15, 0.28);
  const coilR = makeHelicalCopperCoil({ radius: 0.24, height: 1.95, turns: 16 });
  coilR.position.set(1.48, 1.15, 0.28);
  podGroup.add(coilL, coilR);

  // 3 Crisp Electric Cyan-Gold Quantum Containment Rings framing lower base & upper crown (leaving Hero face razor-clear!)
  const qRings = [];
  const qRingMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 1.95, 2.45), transparent: true, opacity: 0.0 });
  for (let i = 0; i < 3; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1.20 + i * 0.05, 0.020, 8, 36), qRingMat.clone());
    r.rotation.x = Math.PI / 2;
    r.position.y = 0.55 + i * 0.85;
    podGroup.add(r);
    qRings.push(r);
  }

  // 5. Riveted Control Console (Left-Front of Pod) w/ Live Brass OVERLOAD Gauge & Pivoting Master Lever!
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(-0.98, 0.0, 0.65);
  consoleGroup.rotation.y = 0.36;
  grp.add(consoleGroup);

  const consBody = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.12, 0.60), ironMat);
  consBody.position.y = 0.56;
  const consDeck = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.10, 0.66), brassMat);
  consDeck.position.set(0, 1.14, 0);
  consDeck.rotation.x = 0.22;
  consoleGroup.add(consBody, consDeck);

  // Animated Brass Pressure/Flux Gauge mounted upright on console!
  const gaugeRig = makeDynamicGaugeRig();
  const gaugeHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.12, 24), brassMat);
  gaugeHousing.rotation.x = Math.PI / 2;
  gaugeHousing.position.set(0.18, 1.44, -0.10);
  const gaugeFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 24),
    new THREE.MeshBasicMaterial({ map: gaugeRig.texture })
  );
  gaugeFace.position.set(0.18, 1.44, -0.035);
  consoleGroup.add(gaugeHousing, gaugeFace);

  // Glowing indicator lamps on console
  const indRed = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 0.55, 0.45) }));
  indRed.position.set(-0.26, 1.24, 0.12);
  const indAmber = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.75, 0.55) }));
  indAmber.position.set(-0.12, 1.24, 0.12);
  consoleGroup.add(indRed, indAmber);

  // Giant Pivoting Copper Knife-Switch Master Lever!
  const leverPivot = new THREE.Group();
  leverPivot.position.set(-0.22, 1.18, -0.02);
  const leverRod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.52, 8), copperMat);
  leverRod.position.y = 0.26;
  const leverKnob = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 10), new THREE.MeshStandardMaterial({ color: '#D83434', roughness: 0.4 }));
  leverKnob.position.y = 0.52;
  leverPivot.add(leverRod, leverKnob);
  consoleGroup.add(leverPivot);

  // Thick Heavy Black Power Cables snaking across the Persian rug into the Teleporter base!
  for (const pts of [
    [new THREE.Vector3(-0.75, 0.06, 0.72), new THREE.Vector3(-0.42, 0.05, 0.35), new THREE.Vector3(-0.12, 0.06, -0.15)],
    [new THREE.Vector3(-1.05, 0.06, 0.92), new THREE.Vector3(-0.62, 0.05, 1.28), new THREE.Vector3(0.45, 0.06, 0.45), new THREE.Vector3(0.65, 0.07, -0.15)],
  ]) {
    const cable = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.042, 8, false), ironMat);
    grp.add(cable);
  }

  // 6. FOREGROUND DEPTH OCCLUDERS (Pulled cleanly into 9:16 bottom-left & bottom-right corners!)
  const fgBench = new THREE.Group();
  fgBench.position.set(-1.75, 0.0, 2.75);
  fgBench.rotation.y = 0.38;
  grp.add(fgBench);
  const wbTop = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.10, 0.90), woodMid);
  wbTop.position.y = 0.88;
  fgBench.add(wbTop);
  for (const lx of [-0.78, 0.78]) {
    for (const lz of [-0.36, 0.36]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.88, 0.08), woodDark);
      leg.position.set(lx, 0.44, lz);
      fgBench.add(leg);
    }
  }
  const tubeGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.5, 0.65) });
  for (let i = 0; i < 3; i++) {
    const vtGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.24, 12), glassMat);
    vtGlass.position.set(-0.25 + i * 0.22, 1.05, -0.15);
    const vtFil = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.14, 8), tubeGlow);
    vtFil.position.set(-0.25 + i * 0.22, 1.04, -0.15);
    fgBench.add(vtGlass, vtFil);
  }
  const flask = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 14), new THREE.MeshStandardMaterial({ color: '#4AD8B8', roughness: 0.2, transparent: true, opacity: 0.78 }));
  flask.position.set(0.45, 1.09, 0.08);
  fgBench.add(flask);
  const deskLampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.13, 0.06, 12), brassMat);
  deskLampBase.position.set(0.55, 0.96, -0.22);
  const deskLampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 8), brassMat);
  deskLampStem.position.set(0.55, 1.16, -0.22);
  const deskLampShade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 14), new THREE.MeshStandardMaterial({ color: '#266B44', roughness: 0.45 }));
  deskLampShade.position.set(0.50, 1.38, -0.18);
  deskLampShade.rotation.z = 0.25;
  fgBench.add(deskLampBase, deskLampStem, deskLampShade);

  // Foreground Right Stacked Shipping Crates + Wooden Stool
  const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.72, 0.84), crateMat);
  crate1.position.set(1.55, 0.36, 2.55);
  crate1.rotation.y = -0.28;
  const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.50, 0.64), woodMid);
  crate2.position.set(1.68, 0.96, 2.42);
  crate2.rotation.y = 0.18;
  const stoolSeat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.06, 16), woodMid);
  stoolSeat.position.set(1.18, 0.56, 1.72);
  const stoolStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.08, 0.54, 10), ironMat);
  stoolStem.position.set(1.18, 0.27, 1.72);
  grp.add(crate1, crate2, stoolSeat, stoolStem);

  // 7. Directional Metallic & Quantum Streak Sparks erupting from Helical Coils!
  const sparks = makeStreakSparksSystem(grp, 52);

  // 8. 2D Cel Inventor Billboard + Grounded Contact Shadow
  const heroMat = new THREE.MeshBasicMaterial({ map: heroTexture, color: '#EFE4D8', transparent: true, alphaTest: 0.05, side: THREE.DoubleSide });
  const heroMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.36, 2.04), heroMat);
  const heroShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.48),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  heroShadow.rotation.x = -Math.PI / 2;
  grp.add(heroMesh, heroShadow);

  function update(st, camera) {
    // Animate brass OVERLOAD gauge & copper knife-switch lever
    gaugeRig.update(st.gaugeLevel);
    leverPivot.rotation.x = -0.55 + st.leverPull * 1.25;

    // Position Hero (at console for S01-S02 -> inside Glass Teleporter Pod for S03!)
    heroMesh.position.set(...st.heroPos);
    heroMesh.rotation.y = Math.atan2(camera.position.x - st.heroPos[0], camera.position.z - st.heroPos[2]);
    heroShadow.position.set(st.heroPos[0], 0.02, st.heroPos[2]);

    // Surge effects on Teleporter Pod, Spinning Quantum Rings & Helical Coil Sparks!
    const surge = st.surge;
    padGlowMat.color.setRGB(0.35 + surge * 1.15, 1.1 + surge * 1.35, 1.55 + surge * 1.35);
    padCore.material.opacity = 0.22 + surge * 0.42;
    const ringBands = [0.50, 0.96, 2.66];
    for (let i = 0; i < qRings.length; i++) {
      const r = qRings[i];
      r.material.opacity = surge * 0.85;
      r.position.y = ringBands[i] + Math.sin(st.t * 5.2 + i * 2.1) * 0.14;
      r.rotation.z = st.t * (4 + i * 2);
      r.scale.setScalar(0.95 + Math.sin(st.t * 9 + i) * 0.05);
    }

    // Sparks erupt from left helical coil during S02 macro & from upper emitter crown during S03 surge!
    const sparkOrigin = st.sparkAtPod ? [0.25, 2.75, -1.25] : [-1.23, 1.95, -0.97];
    sparks.update(sparkOrigin, st.sparkIntensity, st.t);
  }

  return { group: grp, update };
}
