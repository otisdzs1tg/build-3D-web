// MetalShelf.jsx — Kệ pallet công nghiệp procedural thay cho các ô obstacle (tường/kệ).
// Phong cách "nhà máy": trụ thép xanh, dầm tải cam, khung đầu có giằng chéo, chân đế,
// và HÀNG HOÁ ĐA DẠNG đặt trên pallet (thùng carton, thùng nhựa màu, thùng phuy, kiện bọc màng).
// Tối ưu: dùng chung 1 BoxGeometry + 1 CylinderGeometry + material cấp module cho cả ngàn mesh.
// Bố cục tất định theo seed (memo) → không nhấp nháy giữa các frame.
import React, { useMemo } from 'react';
import * as THREE from 'three';

// ═══════════════════════════════════════════
// Tài nguyên dùng chung cho TOÀN scene (tạo 1 lần)
// ═══════════════════════════════════════════
const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 14); // phuy đứng, scale theo mesh

// ─── Kết cấu kệ ───
const UPRIGHT_MAT = new THREE.MeshStandardMaterial({ color: '#33475e', metalness: 0.8, roughness: 0.4 });   // trụ thép xanh
const BEAM_MAT = new THREE.MeshStandardMaterial({ color: '#e07d2b', metalness: 0.5, roughness: 0.45 });     // dầm tải cam an toàn
const DECK_MAT = new THREE.MeshStandardMaterial({ color: '#aab0b8', metalness: 0.7, roughness: 0.4 });      // sàn tôn mạ
const FOOT_MAT = new THREE.MeshStandardMaterial({ color: '#20242a', metalness: 0.6, roughness: 0.5 });      // chân đế / bát thép

// ─── Hàng hoá ───
const WOOD_MAT = new THREE.MeshStandardMaterial({ color: '#a9814f', metalness: 0.0, roughness: 0.85 });     // pallet gỗ
const CARD1_MAT = new THREE.MeshStandardMaterial({ color: '#c49a6c', metalness: 0.0, roughness: 0.92 });    // carton
const CARD2_MAT = new THREE.MeshStandardMaterial({ color: '#d8b489', metalness: 0.0, roughness: 0.92 });    // carton sáng
const TOTE_BLUE = new THREE.MeshStandardMaterial({ color: '#2f6fb0', metalness: 0.1, roughness: 0.5 });     // thùng nhựa xanh
const TOTE_GREEN = new THREE.MeshStandardMaterial({ color: '#3a9d5d', metalness: 0.1, roughness: 0.5 });    // thùng nhựa lục
const TOTE_RED = new THREE.MeshStandardMaterial({ color: '#b8433a', metalness: 0.1, roughness: 0.5 });      // thùng nhựa đỏ
const DRUM_STEEL = new THREE.MeshStandardMaterial({ color: '#737d8a', metalness: 0.8, roughness: 0.35 });   // phuy thép
const DRUM_BLUE = new THREE.MeshStandardMaterial({ color: '#35618f', metalness: 0.55, roughness: 0.4 });    // phuy xanh
const WRAP_MAT = new THREE.MeshStandardMaterial({
  color: '#b7cdda', metalness: 0.1, roughness: 0.25, transparent: true, opacity: 0.4, // màng co bọc kiện
});

const TOTE_COLORS = [TOTE_BLUE, TOTE_GREEN, TOTE_RED];

// ─── Kích thước rack (đơn vị = 1 ô lưới) ───
const W = 0.96;      // chiều dài (dọc theo tường)
const D = 0.66;      // chiều sâu — chừa lối đi
const H = 1.5;       // tổng chiều cao
const LEVELS = 3;    // 3 khoang pallet (gọn, giống kệ thật)
const POST = 0.06;
const levelH = H / LEVELS;

function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Mesh dùng chung geometry; hỗ trợ rotation cho giằng chéo
function Part({ position, scale, material, rotation, geometry = UNIT_BOX }) {
  return (
    <mesh
      geometry={geometry}
      material={material}
      position={position}
      scale={scale}
      rotation={rotation}
      castShadow
      receiveShadow
    />
  );
}

export function getWallRotation(matrix, row, col) {
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 0;
  const isObs = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && matrix[r][c] === 1;
  const horizontal = isObs(row, col - 1) || isObs(row, col + 1);
  const vertical = isObs(row - 1, col) || isObs(row + 1, col);
  if (vertical && !horizontal) return Math.PI / 2;
  return 0;
}

export default function MetalShelf({ position = [0, 0, 0], rotation = 0, seed = 1 }) {
  // boxes/cyls = danh sách mesh hộp / trụ (phuy). frame = kết cấu thép.
  const { frame, boxes, cyls } = useMemo(() => {
    const rng = makeRng(seed);
    const hx = W / 2 - POST / 2;
    const hz = D / 2 - POST / 2;

    const frame = [];  // { position, scale, material, rotation? }
    const boxes = [];  // { position, scale, material }
    const cyls = [];   // { position, scale, material }

    // ── Trụ + chân đế 4 góc ──
    for (const [px, pz] of [[hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz]]) {
      frame.push({ position: [px, H / 2, pz], scale: [POST, H, POST], material: UPRIGHT_MAT });
      frame.push({ position: [px, 0.015, pz], scale: [POST * 1.7, 0.03, POST * 1.7], material: FOOT_MAT });
    }

    // ── Khung đầu (2 đầu ±X): giằng ngang trên/dưới + giằng chéo ──
    const braceLen = Math.sqrt(H * H + (2 * hz) * (2 * hz));
    const braceAng = Math.atan2(2 * hz, H);
    for (const px of [hx, -hx]) {
      frame.push({ position: [px, H - 0.03, 0], scale: [POST * 0.7, POST * 0.7, 2 * hz], material: UPRIGHT_MAT });
      frame.push({ position: [px, 0.06, 0], scale: [POST * 0.7, POST * 0.7, 2 * hz], material: UPRIGHT_MAT });
      frame.push({ position: [px, H / 2, 0], scale: [POST * 0.55, braceLen, POST * 0.55], material: UPRIGHT_MAT, rotation: [braceAng, 0, 0] });
    }

    // ── Từng khoang: dầm tải cam + sàn tôn + hàng hoá ──
    for (let i = 0; i < LEVELS; i++) {
      const beamY = i * levelH + 0.06;
      // 2 dầm tải trước/sau
      frame.push({ position: [0, beamY, hz], scale: [W, 0.06, 0.05], material: BEAM_MAT });
      frame.push({ position: [0, beamY, -hz], scale: [W, 0.06, 0.05], material: BEAM_MAT });
      // Sàn tôn
      frame.push({ position: [0, beamY + 0.045, 0], scale: [W * 0.98, 0.02, D * 0.92], material: DECK_MAT });
      const deckTop = beamY + 0.055;

      // 2 ô pallet/khoang — mỗi ô chọn loại hàng theo seed (có thể trống)
      for (const sx of [-W * 0.24, W * 0.24]) {
        const r = rng();
        if (r < 0.16) continue; // ô trống → gọn, thật hơn
        addLoad(sx, deckTop, rng, boxes, cyls);
      }
    }

    return { frame, boxes, cyls };
  }, [seed]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {frame.map((p, i) => (
        <Part key={`f-${i}`} position={p.position} scale={p.scale} material={p.material} rotation={p.rotation} />
      ))}
      {boxes.map((b, i) => (
        <Part key={`b-${i}`} position={b.position} scale={b.scale} material={b.material} />
      ))}
      {cyls.map((c, i) => (
        <Part key={`c-${i}`} position={c.position} scale={c.scale} material={c.material} geometry={UNIT_CYL} />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════
// Sinh 1 kiện hàng trên pallet tại (sx, y) — đa dạng theo rng
// ═══════════════════════════════════════════
function addLoad(sx, y, rng, boxes, cyls) {
  const slotW = 0.34;
  const loadD = D * 0.62;

  // Pallet gỗ nền
  boxes.push({ position: [sx, y + 0.02, 0], scale: [slotW, 0.04, loadD], material: WOOD_MAT });
  const baseY = y + 0.04;

  const kind = rng();

  if (kind < 0.4) {
    // ── Thùng carton xếp gọn (2 hàng × 1–2 lớp) ──
    const layers = 1 + Math.floor(rng() * 2);
    for (let ly = 0; ly < layers; ly++) {
      for (let c = 0; c < 2; c++) {
        const cw = 0.145;
        const ch = 0.13;
        const cx = sx + (c - 0.5) * 0.16;
        const cy = baseY + ch / 2 + ly * (ch + 0.005);
        boxes.push({ position: [cx, cy, 0], scale: [cw, ch, loadD * 0.9], material: (c + ly) % 2 ? CARD2_MAT : CARD1_MAT });
      }
    }
  } else if (kind < 0.66) {
    // ── Thùng nhựa màu xếp chồng ──
    const n = 2 + Math.floor(rng() * 2);
    const th = 0.11;
    const startColor = Math.floor(rng() * 3);
    for (let s = 0; s < n; s++) {
      boxes.push({
        position: [sx, baseY + th / 2 + s * (th + 0.008), 0],
        scale: [slotW * 0.82, th, loadD * 0.86],
        material: TOTE_COLORS[(startColor + s) % 3],
      });
    }
  } else if (kind < 0.85) {
    // ── Thùng phuy (2–4) ──
    const grid = rng() < 0.5 ? 2 : 4;
    const dr = 0.16;   // đường kính
    const dh = 0.26;   // cao
    const mat = rng() < 0.5 ? DRUM_STEEL : DRUM_BLUE;
    const offs = grid === 2 ? [[0, 0.14], [0, -0.14]] : [[-0.09, 0.12], [0.09, 0.12], [-0.09, -0.12], [0.09, -0.12]];
    for (const [dx, dz] of offs) {
      cyls.push({ position: [sx + dx, baseY + dh / 2, dz], scale: [dr, dh, dr], material: mat });
    }
  } else {
    // ── Kiện bọc màng co (lõi carton + màng trong) ──
    const bh = 0.24 + rng() * 0.06;
    boxes.push({ position: [sx, baseY + bh / 2, 0], scale: [slotW * 0.82, bh, loadD * 0.82], material: CARD1_MAT });
    boxes.push({ position: [sx, baseY + bh / 2, 0], scale: [slotW * 0.9, bh + 0.03, loadD * 0.9], material: WRAP_MAT });
  }
}
