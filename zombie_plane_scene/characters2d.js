// Hand-drawn 2D cel-shaded characters & dangling oxygen masks for Zombie Apocalypse Inside Plane.
// Strictly follows references/06_Characters_Acting_and_Rig_Spec.md:
//   - Oversized round head (~42% height), thick pure-black ink outline (#120E1E)
//   - Flat fills + single soft lavender/indigo shadow crescent + directional warm/crimson rim
//   - Bean torso + rubber-hose stick limbs + solid round ball-hands (ZERO fingers, ZERO 3D face shading)
//   - Emotion code: double-ring eyes + wavy anxious mouth + sweat drop (alive) vs hollow empty-dot eyes (zombie)
import * as THREE from 'three';

const INK = '#120E1E';

function makeCharCanvas(w = 1024, h = 1536) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.lineCap = 'round';
  g.lineJoin = 'round';
  return [c, g];
}

function toCharTex(c) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

function drawCelHead(g, cx, cy, rx, ry, rot = 0, {
  baseColor = '#F0DFD6',
  shadowColor = '#A996C4',
  rimColor = 'rgba(255,216,158,0.52)',
  rimSide = 1, // +1 right/top rim, -1 left rim, 0 top/crimson backlight rim
  inkW = 19,
} = {}) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);

  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.fillStyle = baseColor;
  g.fill();

  g.save();
  g.clip();
  // Soft single-step lavender/indigo cel shadow crescent
  const sh = g.createRadialGradient(
    rimSide * rx * 0.25, -ry * 0.16, rx * 0.34,
    -rimSide * rx * 0.12, ry * 0.15, rx * 1.16
  );
  sh.addColorStop(0.0, 'rgba(150,130,190,0)');
  sh.addColorStop(0.66, 'rgba(128,112,175,0.22)');
  sh.addColorStop(1.0, shadowColor);
  g.fillStyle = sh;
  g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);

  // Directional warm or crimson key rim light
  if (rimSide === 0) {
    // Crimson backlight rim halo around top/sides (for backlit zombies!)
    const br = g.createRadialGradient(0, ry * 0.15, rx * 0.58, 0, 0, rx * 1.06);
    br.addColorStop(0.0, 'rgba(255,75,65,0)');
    br.addColorStop(0.75, 'rgba(255,75,65,0.18)');
    br.addColorStop(1.0, rimColor);
    g.fillStyle = br;
    g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);
  } else {
    const wr = g.createRadialGradient(
      rimSide * rx * 0.72, -ry * 0.25, rx * 0.05,
      rimSide * rx * 0.68, -ry * 0.20, rx * 0.78
    );
    wr.addColorStop(0.0, rimColor);
    wr.addColorStop(1.0, 'rgba(255,220,175,0)');
    g.fillStyle = wr;
    g.fillRect(-rx * 1.25, -ry * 1.25, rx * 2.5, ry * 2.5);
  }
  g.restore();

  // Thick pure-black outline
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.stroke();
  g.restore();
}

// ============================================================================
// 1. FOREGROUND HERO PASSENGER (Crouching beside overturned trolley, terrified)
// ============================================================================
export function makeHeroPassengerTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const inkW = 19;

  // Crouched stick legs (lower half naturally occluded by 3D overturned trolley!)
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  // Left bent leg
  g.beginPath();
  g.moveTo(435, 1020);
  g.quadraticCurveTo(355, 1185, 395, 1410);
  g.lineTo(318, 1422);
  g.stroke();
  // Right crouching leg
  g.beginPath();
  g.moveTo(555, 1020);
  g.quadraticCurveTo(645, 1165, 590, 1400);
  g.lineTo(668, 1412);
  g.stroke();

  // Right arm (reaching out toward bottom-right to brace on overturned trolley edge)
  g.beginPath();
  g.moveTo(605, 790);
  g.quadraticCurveTo(735, 845, 832, 965);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(838, 972, 24, 0, Math.PI * 2); g.fill();

  // Bean torso (classic mustard-yellow vest over white shirt + green frog chest badge!)
  g.save();
  g.translate(495, 845);
  g.rotate(-0.08);
  g.beginPath();
  g.moveTo(-105, -185);
  g.bezierCurveTo(-165, -95, -172, 105, -98, 178);
  g.bezierCurveTo(-32, 224, 48, 224, 105, 174);
  g.bezierCurveTo(175, 102, 165, -95, 102, -185);
  g.closePath();
  g.fillStyle = '#E0A230';
  g.fill();

  g.save();
  g.clip();
  // Soft indigo shadow side on left
  g.fillStyle = 'rgba(26,20,66,0.28)';
  g.fillRect(-185, -200, 105, 440);
  // White center shirt stripe
  g.fillStyle = '#ECE6DC';
  g.fillRect(-36, -195, 72, 420);
  g.strokeStyle = INK;
  g.lineWidth = 9;
  g.strokeRect(-36, -195, 72, 420);
  // Iconic tiny green chest badge (subtle easter-egg nod to Jerry!)
  g.fillStyle = '#4BAE50';
  g.beginPath(); g.arc(0, -68, 28, 0, Math.PI * 2); g.fill();
  g.lineWidth = 8; g.stroke();
  // Warm reading-lamp rim highlight on right shoulder
  g.fillStyle = 'rgba(255,222,165,0.32)';
  g.fillRect(92, -195, 80, 420);
  g.restore();

  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.stroke();
  g.restore();

  // Left arm (raised defensively in front of chest with round ball-hand)
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.beginPath();
  g.moveTo(372, 795);
  g.quadraticCurveTo(230, 825, 224, 678);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(224, 668, 24, 0, Math.PI * 2); g.fill();

  // Oversized round cel head (tilted slightly looking back over shoulder toward zombie!)
  drawCelHead(g, 482, 492, 206, 196, -0.09, {
    baseColor: '#EFE0D8',
    shadowColor: '#9E8AB8',
    rimColor: 'rgba(255,214,150,0.58)',
    rimSide: 1,
    inkW,
  });

  // Spiky orange hair w/ signature dark zig-zag shading & pale highlight strokes
  g.save();
  g.translate(482, 492);
  g.rotate(-0.09);

  g.beginPath();
  g.moveTo(-198, -46);
  g.quadraticCurveTo(-234, -182, -124, -206);
  g.lineTo(-152, -258);
  g.lineTo(-54, -220);
  g.lineTo(-16, -286);
  g.lineTo(48, -218);
  g.lineTo(126, -268);
  g.lineTo(144, -196);
  g.quadraticCurveTo(222, -168, 198, -44);
  g.quadraticCurveTo(86, -110, 0, -104);
  g.quadraticCurveTo(-96, -112, -198, -46);
  g.closePath();
  g.fillStyle = '#D85A26';
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = inkW * 0.9;
  g.stroke();

  // Interior dark zig-zag shading strokes
  g.strokeStyle = '#862E14';
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(-124, -134); g.lineTo(-82, -184); g.lineTo(-40, -134);
  g.lineTo(10, -198); g.lineTo(58, -138); g.lineTo(110, -184);
  g.stroke();
  // Warm amber highlight strokes
  g.strokeStyle = 'rgba(255,218,162,0.68)';
  g.lineWidth = 6;
  g.beginPath();
  g.moveTo(-68, -200); g.lineTo(-18, -246);
  g.moveTo(52, -196); g.lineTo(104, -234);
  g.stroke();

  // WIDE DOUBLE-RING ALARMED EYES (pupils looking nervously up-right toward the aisle zombie!)
  for (const ex of [-54, 68]) {
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.arc(ex, -10, 40, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    // Small dilated panic pupil glancing toward aisle
    g.fillStyle = INK;
    g.beginPath(); g.arc(ex + 10, -14, 11, 0, Math.PI * 2); g.fill();
  }

  // Sharply tilted worried eyebrows
  g.strokeStyle = INK;
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(-92, -52); g.lineTo(-26, -82);
  g.moveTo(36, -82); g.lineTo(104, -52);
  g.stroke();

  // Signature WAVY ZIG-ZAG ANXIOUS MOUTH
  g.lineWidth = 10;
  g.beginPath();
  g.moveTo(-40, 74);
  g.quadraticCurveTo(-20, 52, 0, 74);
  g.quadraticCurveTo(20, 96, 40, 74);
  g.stroke();

  // Iconic cyan-blue SWEAT DROP at temple
  g.fillStyle = '#82D0FF';
  g.strokeStyle = INK;
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(-152, -62);
  g.quadraticCurveTo(-124, -14, -152, 0);
  g.quadraticCurveTo(-180, -14, -152, -62);
  g.closePath();
  g.fill();
  g.stroke();

  // Subtle nervous tremor lines beside cheek
  g.strokeStyle = INK;
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(-232, -26); g.quadraticCurveTo(-248, 8, -232, 42);
  g.stroke();

  g.restore();
  return toCharTex(c);
}

// ============================================================================
// 2. PEEKING TERRIFIED SURVIVOR (Gripping top of 3D seatback in Row 3 right)
// ============================================================================
export function makePeekingSurvivorTexture() {
  const [c, g] = makeCharCanvas(1024, 1024);
  const inkW = 20;

  // Dark teal sweater shoulders (mostly hidden behind 3D seatback!)
  g.fillStyle = '#365878';
  g.beginPath();
  g.ellipse(512, 840, 210, 175, 0, Math.PI, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.stroke();

  // Oversized round terrified head peeking over seat
  drawCelHead(g, 512, 470, 212, 200, 0.06, {
    baseColor: '#EADCD8',
    shadowColor: '#9888B8',
    rimColor: 'rgba(255,140,120,0.35)',
    rimSide: -1,
    inkW,
  });

  g.save();
  g.translate(512, 470);
  g.rotate(0.06);

  // Curly dark-indigo bob hair (distinct silhouette from Hero)
  g.fillStyle = '#2B254A';
  g.beginPath();
  g.arc(-155, -80, 68, 0, Math.PI * 2);
  g.arc(-80, -155, 76, 0, Math.PI * 2);
  g.arc(20, -172, 82, 0, Math.PI * 2);
  g.arc(125, -135, 74, 0, Math.PI * 2);
  g.arc(178, -58, 62, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = inkW * 0.85;
  g.stroke();

  // Wide alarmed double-ring eyes looking left into the aisle
  for (const ex of [-64, 58]) {
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.arc(ex, -8, 38, 0, Math.PI * 2); g.fill();
    g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
    g.fillStyle = INK;
    g.beginPath(); g.arc(ex - 12, -6, 10, 0, Math.PI * 2); g.fill();
  }
  // High terrified brows
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(-98, -68); g.quadraticCurveTo(-64, -92, -32, -68);
  g.moveTo(26, -68); g.quadraticCurveTo(58, -92, 92, -68);
  g.stroke();
  // Tiny shocked 'o' mouth
  g.fillStyle = INK;
  g.beginPath(); g.ellipse(-4, 72, 18, 24, 0, 0, Math.PI * 2); g.fill();

  // Blue sweat drop
  g.fillStyle = '#82D0FF';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(148, -40);
  g.quadraticCurveTo(172, 4, 148, 16);
  g.quadraticCurveTo(124, 4, 148, -40);
  g.closePath();
  g.fill(); g.stroke();
  g.restore();

  // Two round black BALL-HANDS gripping the top edge of the 3D seat headrest!
  g.fillStyle = INK;
  g.beginPath(); g.arc(312, 646, 36, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(712, 646, 36, 0, Math.PI * 2); g.fill();

  return toCharTex(c);
}

// ============================================================================
// 3. LEAD LUNGING ZOMBIE (Center aisle, backlit by crimson EXIT sign!)
// ============================================================================
export function makeLeadZombieTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const inkW = 19;

  // Shambling stick legs (staggered stride down the aisle)
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.beginPath();
  g.moveTo(455, 955);
  g.quadraticCurveTo(422, 1175, 385, 1412);
  g.lineTo(318, 1425);
  g.moveTo(568, 955);
  g.quadraticCurveTo(615, 1165, 650, 1405);
  g.lineTo(725, 1422);
  g.stroke();

  // Outstretched rear/left stick arm reaching forward menacingly
  g.beginPath();
  g.moveTo(395, 710);
  g.quadraticCurveTo(215, 675, 128, 760);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(122, 768, 25, 0, Math.PI * 2); g.fill();

  // Hunched bean torso (tattered dark-indigo business jacket + crooked torn crimson tie)
  g.save();
  g.translate(512, 790);
  g.rotate(0.11);
  g.beginPath();
  g.moveTo(-104, -178);
  g.bezierCurveTo(-164, -92, -162, 102, -96, 175);
  g.bezierCurveTo(-30, 220, 48, 220, 104, 172);
  g.bezierCurveTo(166, 98, 162, -94, 102, -178);
  g.closePath();
  g.fillStyle = '#33385C';
  g.fill();

  g.save();
  g.clip();
  // Tattered shirt V
  g.fillStyle = '#A8B6B4';
  g.beginPath();
  g.moveTo(-48, -182); g.lineTo(0, -18); g.lineTo(48, -182); g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 8; g.stroke();
  // Crooked torn red necktie
  g.fillStyle = '#8F2430';
  g.beginPath();
  g.moveTo(-16, -155); g.lineTo(14, -155); g.lineTo(32, -10); g.lineTo(6, 22); g.lineTo(-10, -14);
  g.closePath();
  g.fill(); g.stroke();
  // Graphic jagged rip patch on jacket side (clean 2D graphic detail, zero gore)
  g.fillStyle = '#8EA69B';
  g.beginPath();
  g.moveTo(75, 20); g.lineTo(145, -10); g.lineTo(155, 68); g.lineTo(88, 52); g.closePath();
  g.fill(); g.stroke();
  // Crimson aft EXIT rim along top-left & right shoulders
  g.fillStyle = 'rgba(255,75,62,0.34)';
  g.fillRect(-170, -195, 58, 410);
  g.fillRect(112, -195, 58, 410);
  g.restore();

  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.stroke();
  g.restore();

  // Outstretched front/right stick arm reaching straight out toward camera/hero
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.beginPath();
  g.moveTo(618, 730);
  g.quadraticCurveTo(790, 685, 895, 795);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(902, 804, 26, 0, Math.PI * 2); g.fill();

  // Oversized round zombie head (tilted eerily at 14 deg, pale sage-lavender flat cel fill!)
  drawCelHead(g, 522, 442, 204, 194, 0.22, {
    baseColor: '#B8CEBD',
    shadowColor: '#5B678C',
    rimColor: 'rgba(255,72,58,0.62)',
    rimSide: 0, // Backlit crimson EXIT rim all around head!
    inkW,
  });

  g.save();
  g.translate(522, 442);
  g.rotate(0.22);

  // Limp tattered messy dark hair (skill rule: limp hair = sick/undead!)
  g.fillStyle = '#252642';
  g.beginPath();
  g.moveTo(-194, -52);
  g.quadraticCurveTo(-185, -192, -32, -196);
  g.lineTo(-10, -148);
  g.lineTo(28, -198);
  g.quadraticCurveTo(182, -184, 196, -48);
  g.quadraticCurveTo(92, -104, 10, -86);
  g.quadraticCurveTo(-86, -112, -194, -52);
  g.closePath();
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = inkW * 0.85;
  g.stroke();

  // ICONIC HOLLOW/UNDEAD EYES (Skill visual code: hollow = empty dot + mismatched dilated ring!)
  // Left eye: sunken dark ring + tiny hollow off-center dot
  g.fillStyle = '#E8EFE4';
  g.beginPath(); g.arc(-62, -14, 36, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK; g.lineWidth = 10; g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(-58, -22, 9, 0, Math.PI * 2); g.fill();
  // Dark tired under-eye arc
  g.lineWidth = 6;
  g.beginPath(); g.arc(-62, -8, 44, Math.PI * 0.18, Math.PI * 0.82); g.stroke();

  // Right eye: PURE EMPTY BLACK DOT (hollow/soul-gone signal from S24!) + small dilated ring
  g.fillStyle = '#E8EFE4';
  g.beginPath(); g.arc(64, -4, 24, 0, Math.PI * 2); g.fill();
  g.strokeStyle = INK; g.lineWidth = 9; g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(64, -4, 13, 0, Math.PI * 2); g.fill();
  g.lineWidth = 6;
  g.beginPath(); g.arc(64, 0, 34, Math.PI * 0.18, Math.PI * 0.82); g.stroke();

  // Crooked uneven brows
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(-98, -66); g.lineTo(-28, -50);
  g.moveTo(36, -42); g.lineTo(96, -68);
  g.stroke();

  // Open graphic crooked zombie mouth with simple flat white teeth (no gore)
  g.fillStyle = '#191026';
  g.beginPath();
  g.moveTo(-64, 58);
  g.quadraticCurveTo(0, 42, 68, 66);
  g.quadraticCurveTo(56, 128, -4, 124);
  g.quadraticCurveTo(-62, 120, -64, 58);
  g.closePath();
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 9; g.stroke();

  // 3 simple graphic teeth blocks
  g.fillStyle = '#E6EBD8';
  g.fillRect(-38, 54, 22, 22);
  g.fillRect(10, 56, 22, 20);
  g.fillRect(-16, 98, 22, 22);
  g.strokeStyle = INK; g.lineWidth = 5;
  g.strokeRect(-38, 54, 22, 22);
  g.strokeRect(10, 56, 22, 20);
  g.strokeRect(-16, 98, 22, 22);

  g.restore();
  return toCharTex(c);
}

// ============================================================================
// 4. FLIGHT ATTENDANT ZOMBIE (Mid-aft left aisle, crooked pillbox cap & scarf)
// ============================================================================
export function makeAttendantZombieTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const inkW = 20;

  // Stick legs
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.beginPath();
  g.moveTo(468, 955); g.lineTo(445, 1410); g.lineTo(395, 1420);
  g.moveTo(558, 955); g.lineTo(598, 1405); g.lineTo(658, 1416);
  g.stroke();

  // Outstretched arms
  g.beginPath();
  g.moveTo(410, 725); g.quadraticCurveTo(265, 700, 175, 775);
  g.moveTo(615, 725); g.quadraticCurveTo(755, 690, 845, 750);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(170, 780, 24, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(850, 755, 24, 0, Math.PI * 2); g.fill();

  // Navy airline uniform torso + crooked yellow/red neck scarf
  g.save();
  g.translate(512, 800);
  g.rotate(-0.08);
  g.beginPath();
  g.moveTo(-98, -172);
  g.bezierCurveTo(-152, -85, -155, 102, -94, 170);
  g.bezierCurveTo(-30, 212, 42, 212, 98, 168);
  g.bezierCurveTo(156, 98, 154, -85, 98, -172);
  g.closePath();
  g.fillStyle = '#253168';
  g.fill();
  g.strokeStyle = INK; g.lineWidth = inkW; g.stroke();

  // Crooked crimson scarf dangling off collar
  g.fillStyle = '#C83B40';
  g.beginPath();
  g.moveTo(-48, -162); g.lineTo(52, -162); g.lineTo(75, -90); g.lineTo(28, -110); g.lineTo(-10, -45); g.lineTo(-42, -108);
  g.closePath();
  g.fill(); g.lineWidth = 10; g.stroke();
  g.restore();

  // Round pale-sage head with crimson aft rim
  drawCelHead(g, 505, 455, 198, 190, -0.18, {
    baseColor: '#AEC4B8',
    shadowColor: '#4E577D',
    rimColor: 'rgba(255,70,58,0.68)',
    rimSide: 0,
    inkW,
  });

  g.save();
  g.translate(505, 455);
  g.rotate(-0.18);

  // Crooked Airline Pillbox Cap perched on top of head!
  g.save();
  g.translate(22, -182);
  g.rotate(0.24);
  g.fillStyle = '#232F68';
  g.beginPath();
  g.roundRect(-105, -56, 210, 82, 22);
  g.fill();
  g.strokeStyle = INK; g.lineWidth = 14; g.stroke();
  // Gold airline wings emblem on cap
  g.fillStyle = '#E6B84C';
  g.beginPath();
  g.moveTo(-44, -14); g.lineTo(44, -14); g.lineTo(28, 4); g.lineTo(-28, 4); g.closePath();
  g.fill();
  g.restore();

  // Pure HOLLOW EMPTY-DOT EYES (unmistakable zombie stare)
  g.fillStyle = INK;
  g.beginPath(); g.arc(-56, -8, 16, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(58, -4, 15, 0, Math.PI * 2); g.fill();
  // Drooping hollow open 'O' mouth
  g.beginPath(); g.ellipse(4, 72, 26, 36, 0.1, 0, Math.PI * 2); g.fill();
  g.restore();

  return toCharTex(c);
}

// ============================================================================
// 5. REAR AISLE SILHOUETTE ZOMBIE (Emerging out of crimson EXIT haze)
// ============================================================================
export function makeRearZombieTexture() {
  const [c, g] = makeCharCanvas(1024, 1536);
  const inkW = 22;

  // Stick legs & raised reaching arms
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.beginPath();
  g.moveTo(465, 960); g.lineTo(440, 1410);
  g.moveTo(560, 960); g.lineTo(595, 1410);
  g.moveTo(415, 720); g.quadraticCurveTo(240, 620, 165, 530);
  g.moveTo(610, 720); g.quadraticCurveTo(775, 650, 865, 620);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath(); g.arc(160, 522, 26, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(872, 620, 26, 0, Math.PI * 2); g.fill();

  // Dark silhouette bean torso w/ crimson rim
  g.beginPath();
  g.ellipse(512, 800, 128, 190, 0.05, 0, Math.PI * 2);
  g.fillStyle = '#231C3E';
  g.fill();
  g.strokeStyle = '#FF5248';
  g.lineWidth = 10;
  g.stroke();
  g.strokeStyle = INK;
  g.lineWidth = inkW;
  g.stroke();

  drawCelHead(g, 512, 450, 195, 188, 0.12, {
    baseColor: '#7C7492',
    shadowColor: '#2B2246',
    rimColor: 'rgba(255,78,64,0.82)',
    rimSide: 0,
    inkW,
  });

  // Glowing pale hollow pin-eyes catching EXIT reflection
  g.fillStyle = '#FFD4CE';
  g.beginPath(); g.arc(462, 444, 13, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(564, 456, 12, 0, Math.PI * 2); g.fill();
  g.fillStyle = INK;
  g.beginPath(); g.ellipse(514, 526, 26, 32, 0, 0, Math.PI * 2); g.fill();

  return toCharTex(c);
}

// ============================================================================
// 6. DANGLING 2D YELLOW OXYGEN MASK & COILED RUBBER HOSE
// ============================================================================
export function makeOxygenMaskTexture() {
  const [c, g] = makeCharCanvas(512, 1024);

  // Thin black coiled rubber hose descending from ceiling panel
  g.strokeStyle = INK;
  g.lineWidth = 14;
  g.beginPath();
  g.moveTo(256, 0);
  g.bezierCurveTo(295, 190, 215, 360, 260, 560);
  g.stroke();
  // Subtle cool highlight along tube
  g.strokeStyle = 'rgba(130,148,225,0.45)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(260, 0);
  g.bezierCurveTo(299, 190, 219, 360, 264, 560);
  g.stroke();

  // Translucent deflated breather bag below mask
  g.fillStyle = 'rgba(218,226,255,0.52)';
  g.strokeStyle = INK;
  g.lineWidth = 12;
  g.beginPath();
  g.moveTo(212, 725);
  g.quadraticCurveTo(170, 880, 256, 945);
  g.quadraticCurveTo(342, 880, 300, 725);
  g.closePath();
  g.fill();
  g.stroke();

  // Iconic bright yellow cup oxygen mask
  const mg = g.createLinearGradient(160, 550, 350, 730);
  mg.addColorStop(0.0, '#F6C84C');
  mg.addColorStop(0.6, '#E2A428');
  mg.addColorStop(1.0, '#A86E1E');
  g.fillStyle = mg;
  g.beginPath();
  g.moveTo(222, 558);
  g.lineTo(294, 558);
  g.quadraticCurveTo(348, 650, 316, 738);
  g.quadraticCurveTo(256, 766, 196, 738);
  g.quadraticCurveTo(164, 650, 222, 558);
  g.closePath();
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 14;
  g.stroke();

  // Elastic head-strap loop hanging off side
  g.strokeStyle = '#DCE2F8';
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(192, 650);
  g.quadraticCurveTo(118, 695, 164, 775);
  g.quadraticCurveTo(205, 810, 225, 745);
  g.stroke();

  return toCharTex(c);
}
