// WORLD 2: Moonlit Twilight Mountain Rooftop Destination (Skill v2.0 Single-Frame Standard)
// 22+ bespoke 3D props: Painted wispy twilight cloud sky dome, glowing full moon, misty ridges & valley lights,
// mossy carved stone parapet battlements, 460 instanced 3D grass tufts, swaying warm paper lantern on wooden post,
// waving cloth banner, foreground stone pillar & barrels, jagged glowing teleport crater, streak sparks, & Clone Twist!
import * as THREE from 'three';
import {
  makePaintedTwilightSkyDome,
  makeStoneSlabTexture,
  makeArrivalCraterTexture,
  scatterInstancedGrassTufts,
  makeStreakSparksSystem,
  mulberry32,
} from './env_helpers.js';

function makeBannerTex() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 768;
  const g = c.getContext('2d');
  g.fillStyle = '#E8E2D6';
  g.fillRect(0, 0, 256, 768);
  g.fillStyle = '#1D2234';
  g.fillRect(0, 0, 256, 42);
  g.fillRect(0, 260, 256, 26);
  g.fillRect(0, 304, 256, 14);
  // Crisp circular geometric observatory/clan crest emblem!
  g.strokeStyle = '#1D2234'; g.lineWidth = 14;
  g.beginPath(); g.arc(128, 152, 68, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.arc(128, 152, 28, 0, Math.PI * 2); g.fill();
  g.fillRect(118, 355, 20, 340);
  g.strokeStyle = '#14121E'; g.lineWidth = 12;
  g.strokeRect(6, 6, 244, 756);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildRooftopWorld(parentScene, heroTexture, cloneTexture, shadowTex) {
  const grp = new THREE.Group();
  parentScene.add(grp);

  // 1. Painted Wispy Twilight Cloud Sky Dome + Luminous Full Moon!
  const skyDome = makePaintedTwilightSkyDome(70);
  grp.add(skyDome);

  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(1.55, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(1.45, 1.42, 1.30), fog: false })
  );
  moon.position.set(-1.5, 9.8, -36);
  grp.add(moon);

  // 2. Distant Misty Mountain Ridges + Glowing Warm Valley Town Lights far below!
  const hillMat = new THREE.MeshStandardMaterial({ color: '#1F253E', roughness: 0.94 });
  for (const [hx, hy, hz, rx, ry] of [
    [-14, -2.5, -26, 15, 7.8], [13, -2.8, -28, 17, 8.6], [0, -4.0, -34, 22, 6.8],
  ]) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), hillMat);
    hill.position.set(hx, hy, hz);
    hill.scale.set(rx, ry, 8);
    grp.add(hill);
  }

  // Distant silhouettes of pine trees & tiny flickering warm amber village lights in valley!
  const rng = mulberry32(4044);
  const townLightMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.45, 0.55) });
  for (let i = 0; i < 42; i++) {
    const lx = (rng() - 0.5) * 24;
    const ly = -2.2 + rng() * 3.4;
    const lz = -16 - rng() * 14;
    const dot = new THREE.Mesh(new THREE.PlaneGeometry(0.16 + rng() * 0.16, 0.16 + rng() * 0.16), townLightMat);
    dot.position.set(lx, ly, lz);
    grp.add(dot);
  }

  // Stylized silhouette pine trees rising crisply right behind the stone parapet inside 9:16 FOV!
  const pineMat = new THREE.MeshStandardMaterial({ color: '#16202C', roughness: 0.92 });
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#2F221F', roughness: 0.9 });
  for (const [tx, tz, sc] of [
    [-2.7, -6.8, 1.15], [-1.7, -7.8, 0.95], [1.9, -7.4, 1.1], [2.9, -6.6, 1.25], [-0.4, -8.8, 0.85],
  ]) {
    const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * sc, 0.18 * sc, 3.0 * sc, 8), trunkMat);
    tr.position.set(tx, 1.3 * sc, tz);
    grp.add(tr);
    for (let k = 0; k < 4; k++) {
      const foliage = new THREE.Mesh(new THREE.ConeGeometry((1.05 - k * 0.20) * sc, 1.05 * sc, 10), pineMat);
      foliage.position.set(tx, (1.8 + k * 0.72) * sc, tz);
      grp.add(foliage);
    }
  }

  // 3. Mossy Carved Stone Rooftop Terrace + Crenellated Stone Battlement Parapet!
  const stoneMat = new THREE.MeshStandardMaterial({ map: makeStoneSlabTexture(), roughness: 0.88 });
  const stoneTrim = new THREE.MeshStandardMaterial({ color: '#4A4652', roughness: 0.85 });

  const terrace = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 14), stoneMat);
  terrace.position.set(0, -0.6, 0.5);
  grp.add(terrace);

  // Rear stone battlement parapet wall w/ crisp merlons & dark coping trim!
  const wallBase = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.95, 0.55), stoneMat);
  wallBase.position.set(0, 0.48, -4.6);
  grp.add(wallBase);
  for (let x = -5.6; x <= 5.6; x += 1.25) {
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.52, 0.62), stoneTrim);
    merlon.position.set(x, 1.20, -4.6);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.08, 0.68), new THREE.MeshStandardMaterial({ color: '#2F2C38', roughness: 0.8 }));
    cap.position.set(x, 1.48, -4.6);
    grp.add(merlon, cap);
  }

  // 4. 680 Instanced Wind-Swept 3D Dry Grass Tufts sprouting densely across stones & parapet edges!
  scatterInstancedGrassTufts(grp, {
    minX: -5.5, maxX: 5.5, minZ: -4.2, maxZ: 4.0,
    count: 680, excludeRadius: 1.55, baseColor: '#6C5D43', seed: 1200,
  });

  // 5. Tall Wooden Lantern Post + Swaying Glowing Warm Paper Lantern (Pulled cleanly inside 9:16 left midground!)
  const woodMat = new THREE.MeshStandardMaterial({ color: '#3F271E', roughness: 0.84 });
  const postV = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.25, 8), woodMat);
  postV.position.set(-1.62, 1.62, -2.25);
  const postArm = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.075, 0.075), woodMat);
  postArm.position.set(-1.32, 3.08, -2.25);
  grp.add(postV, postArm);

  const lanternPivot = new THREE.Group();
  lanternPivot.position.set(-1.02, 3.04, -2.25);
  const lCord = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.30, 6), woodMat);
  lCord.position.y = -0.15;
  const lBody = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 14, 12),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 1.72, 0.72) })
  );
  lBody.scale.set(0.85, 1.25, 0.85);
  lBody.position.y = -0.48;
  const lCapTop = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.07, 12), woodMat);
  lCapTop.position.y = -0.24;
  const lCapBot = lCapTop.clone();
  lCapBot.position.y = -0.72;
  lanternPivot.add(lCord, lBody, lCapTop, lCapBot);
  grp.add(lanternPivot);

  // Dedicated warm orange lantern point light illuminating nearby stones, grass & Hero's left cheek!
  const lanternLight = new THREE.PointLight('#FF9638', 9.5, 10.5, 1.4);
  lanternLight.position.set(-1.02, 2.48, -2.1);
  grp.add(lanternLight);

  // 6. Tall Waving Observatory/Clan Cloth Banner (Pulled cleanly inside 9:16 right midground!)
  const bPole = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 4.1, 8), woodMat);
  bPole.position.set(1.62, 2.05, -3.55);
  const bTopBar = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.05, 0.05), woodMat);
  bTopBar.position.set(1.26, 3.98, -3.55);
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(0.70, 2.05),
    new THREE.MeshStandardMaterial({ map: makeBannerTex(), roughness: 0.85, side: THREE.DoubleSide })
  );
  banner.position.set(1.26, 2.90, -3.55);
  grp.add(bPole, bTopBar, banner);

  // Wooden bench + Foreground left stone pillar & right wooden barrels (framing bottom corners in 9:16!)
  const benchTop = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.09, 0.42), woodMat);
  benchTop.position.set(-1.45, 0.48, -3.75);
  grp.add(benchTop);
  for (const bx of [-1.95, -0.95]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.48, 0.34), woodMat);
    leg.position.set(bx, 0.24, -3.75);
    grp.add(leg);
  }
  const barrelMat = new THREE.MeshStandardMaterial({ color: '#5A3726', roughness: 0.82 });
  const fgBarrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.78, 14), barrelMat);
  fgBarrel1.position.set(1.42, 0.39, 2.15);
  const fgBarrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.64, 14), barrelMat);
  fgBarrel2.position.set(1.78, 0.32, 1.58);
  const fgPillar = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.85, 0.62), stoneMat);
  fgPillar.position.set(-1.62, 0.92, 2.38);
  grp.add(fgBarrel1, fgBarrel2, fgPillar);

  // Carved iron-banded wooden railing posts & mossy stone bollards framing left & right midground!
  const ironBandMat = new THREE.MeshStandardMaterial({ color: '#24232E', roughness: 0.6, metalness: 0.5 });
  for (const [bx, bz] of [[-1.55, -0.35], [1.55, -0.45], [-1.35, -3.15], [1.45, -2.55]]) {
    const bol = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.19, 0.76, 8), stoneTrim);
    bol.position.set(bx, 0.38, bz);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 8), ironBandMat);
    band.position.set(bx, 0.64, bz);
    grp.add(bol, band);
  }

  // 7. Jagged Scorched Cyan-Gold Arrival Energy Crater + Crisp Portal Ring + Scattering Sparks!
  const crater = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.2),
    new THREE.MeshBasicMaterial({ map: makeArrivalCraterTexture(), transparent: true, depthWrite: false })
  );
  crater.rotation.x = -Math.PI / 2;
  crater.position.set(0.0, 0.018, 0.0);
  grp.add(crater);

  const portalRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.32, 0.032, 10, 36),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 1.95, 2.35), transparent: true, opacity: 0.82 })
  );
  portalRing.rotation.x = Math.PI / 2;
  portalRing.position.set(0.0, 0.07, 0.0);
  grp.add(portalRing);

  const arrivalLight = new THREE.PointLight('#52D8F5', 4.2, 7.5, 1.6);
  arrivalLight.position.set(0.0, 1.0, 0.2);
  grp.add(arrivalLight);

  const sparks = makeStreakSparksSystem(grp, 46);

  // 8. Hero Inventor + Shimmering Quantum CLONE Billboard (The Twist!)
  const heroMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.32, 1.98),
    new THREE.MeshBasicMaterial({ map: heroTexture, color: '#EFE8E2', transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
  );
  const heroShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.48),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
  );
  heroShadow.rotation.x = -Math.PI / 2;

  const cloneMat = new THREE.MeshBasicMaterial({ map: cloneTexture, color: '#B6F2FF', transparent: true, opacity: 0.0, alphaTest: 0.04, side: THREE.DoubleSide });
  const cloneMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.30, 1.95), cloneMat);
  const cloneShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.46),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.0, depthWrite: false })
  );
  cloneShadow.rotation.x = -Math.PI / 2;
  grp.add(heroMesh, heroShadow, cloneMesh, cloneShadow);

  function update(st, camera) {
    // Lantern gentle breeze sway & banner flutter
    lanternPivot.rotation.z = Math.sin(st.t * 2.4) * 0.09;
    lanternLight.intensity = 9.2 + Math.sin(st.t * 14) * 0.9;
    banner.rotation.y = Math.sin(st.t * 3.1) * 0.14;

    // Arrival ring pulse & scattering sparks
    portalRing.scale.setScalar(0.94 + Math.sin(st.t * 7) * 0.04);
    portalRing.material.opacity = st.portalRingOpacity;
    arrivalLight.intensity = 1.8 + st.portalRingOpacity * 3.2;
    sparks.update([0.0, 0.25, 0.0], st.arrivalSparkIntensity, st.t);

    // Hero positioning
    heroMesh.position.set(...st.heroPos);
    heroMesh.rotation.y = Math.atan2(camera.position.x - st.heroPos[0], camera.position.z - st.heroPos[2]);
    heroShadow.position.set(st.heroPos[0], 0.022, st.heroPos[2]);

    // Quantum Clone materializing right beside him inside the glowing crater for the Twist!
    cloneMesh.visible = st.cloneAlpha > 0.02;
    cloneShadow.visible = cloneMesh.visible;
    if (cloneMesh.visible) {
      cloneMat.opacity = st.cloneAlpha;
      cloneShadow.material.opacity = st.cloneAlpha * 0.7;
      cloneMesh.position.set(...st.clonePos);
      cloneMesh.rotation.y = Math.atan2(camera.position.x - st.clonePos[0], camera.position.z - st.clonePos[2]);
      cloneShadow.position.set(st.clonePos[0], 0.022, st.clonePos[2]);
    }
  }

  return { group: grp, update };
}
