// ManagementOffice.jsx — Nhà quản lý / văn phòng điều hành hiện đại (2 tầng, curtain-wall).
// KHÁC BIỆT có chủ đích với ModernWarehouse (kho): kho = ấm (be + hổ phách + kính đồng),
// văn phòng = LẠNH/CORPORATE (graphite + xanh ngọc teal + kính xanh + đèn trắng lạnh).
// Lối vào đặt ở MẶT SAU (-Z). Dựng procedural theo footprint, tự co giãn vừa vùng kho.
import React, { useMemo } from 'react';
import * as THREE from 'three';

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

// ─── Bảng vật liệu (cool / corporate) — khác hẳn kho ấm ───
const BASE_MAT = new THREE.MeshStandardMaterial({ color: '#242a30', metalness: 0.5, roughness: 0.6 });        // đế bê tông lạnh
const STEEL_MAT = new THREE.MeshStandardMaterial({ color: '#1e242b', metalness: 0.88, roughness: 0.38 });     // trụ/mullion graphite
const ROOF_MAT = new THREE.MeshStandardMaterial({ color: '#2a323a', metalness: 0.5, roughness: 0.6 });        // mái graphite
const SLAB_MAT = new THREE.MeshStandardMaterial({ color: '#c3ccd2', metalness: 0.2, roughness: 0.55 });       // mép sàn expressed (xám lạnh)
const ACCENT_MAT = new THREE.MeshStandardMaterial({ color: '#2fb6a6', metalness: 0.45, roughness: 0.4 });     // nẹp/điểm nhấn teal
const GLASS_MAT = new THREE.MeshStandardMaterial({
  color: '#254048', metalness: 0.62, roughness: 0.08,
  transparent: true, opacity: 0.4, side: THREE.DoubleSide, // kính xanh lạnh (cool)
});
const GLOW_MAT = new THREE.MeshStandardMaterial({
  color: '#1c3036', emissive: '#cfeef2', emissiveIntensity: 0.8, roughness: 0.5, // đèn trắng lạnh bên trong
});
const DESK_MAT = new THREE.MeshStandardMaterial({ color: '#5d6b73', metalness: 0.25, roughness: 0.7 });
const SCREEN_MAT = new THREE.MeshStandardMaterial({
  color: '#08161a', emissive: '#2fb6a6', emissiveIntensity: 0.95, metalness: 0.1, roughness: 0.3, // màn hình teal
});
const SIGN_MAT = new THREE.MeshStandardMaterial({
  color: '#08161a', emissive: '#4fd6c4', emissiveIntensity: 1.0, metalness: 0.1, roughness: 0.4, // biển hiệu teal
});

function Part({ position, scale, material, castShadow = true }) {
  return (
    <mesh geometry={UNIT_BOX} material={material} position={position} scale={scale} castShadow={castShadow} receiveShadow />
  );
}

export default function ManagementOffice({
  position = [0, 0, 0],
  rotation = 0,
  width = 3,
  depth = 2,
  storyHeight = 1.05,
}) {
  const STORIES = 2;
  const FRAME = 0.08;
  const INSET = 0.12;

  const W = Math.max(0.8, width - INSET);
  const D = Math.max(0.8, depth - INSET);
  const hx = W / 2;
  const hz = D / 2;
  const yBase = 0.12;
  const totalH = storyHeight * STORIES;
  const yTop = yBase + totalH;

  const { posts, floorLines, glass, mullions, glows, desks } = useMemo(() => {
    // Trụ thép 4 góc (suốt chiều cao)
    const posts = [[hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz]].map(([px, pz]) => ({
      position: [px, yBase + totalH / 2, pz], scale: [FRAME, totalH, FRAME],
    }));

    // Dải mép sàn expressed ở các mức GIỮA (không tính trệt & mái)
    const floorLines = [];
    for (let lvl = 1; lvl < STORIES; lvl++) {
      floorLines.push({ position: [0, yBase + lvl * storyHeight, 0], scale: [W + 0.07, 0.09, D + 0.07] });
    }

    // Khối đèn lạnh bên trong từng tầng (lộ qua kính) → toà nhà "có người"
    const glows = [];
    for (let s = 0; s < STORIES; s++) {
      glows.push({
        position: [0, yBase + s * storyHeight + storyHeight * 0.5, 0],
        scale: [W * 0.8, storyHeight * 0.72, D * 0.8],
      });
    }

    // Curtain-wall kính: 4 mặt × mỗi tầng
    const glass = [];
    for (let s = 0; s < STORIES; s++) {
      const cy = yBase + s * storyHeight + storyHeight / 2;
      const gh = storyHeight * 0.86;
      glass.push({ position: [0, cy, hz], scale: [W * 0.98, gh, 0.04] });
      glass.push({ position: [0, cy, -hz], scale: [W * 0.98, gh, 0.04] });
      glass.push({ position: [hx, cy, 0], scale: [0.04, gh, D * 0.98] });
      glass.push({ position: [-hx, cy, 0], scale: [0.04, gh, D * 0.98] });
    }

    // Mullion đứng đều quanh 4 mặt
    const mullions = [];
    const nx = Math.max(2, Math.round(W / 0.6));
    for (let i = 1; i < nx; i++) {
      const px = -hx + (i * W) / nx;
      mullions.push({ position: [px, yBase + totalH / 2, hz + 0.005], scale: [FRAME * 0.5, totalH, 0.05] });
      mullions.push({ position: [px, yBase + totalH / 2, -hz - 0.005], scale: [FRAME * 0.5, totalH, 0.05] });
    }
    const nz = Math.max(2, Math.round(D / 0.6));
    for (let i = 1; i < nz; i++) {
      const pz = -hz + (i * D) / nz;
      mullions.push({ position: [hx + 0.005, yBase + totalH / 2, pz], scale: [0.05, totalH, FRAME * 0.5] });
      mullions.push({ position: [-hx - 0.005, yBase + totalH / 2, pz], scale: [0.05, totalH, FRAME * 0.5] });
    }

    // Bàn làm việc + màn hình (tầng trệt, nhìn qua kính)
    const desks = [];
    const spots = [[-W * 0.24, hz * 0.28], [W * 0.24, -hz * 0.26]];
    for (const [dx, dz] of spots) {
      desks.push({ kind: 'desk', position: [dx, yBase + 0.14, dz], scale: [0.5, 0.16, 0.3] });
      desks.push({ kind: 'screen', position: [dx, yBase + 0.34, dz - 0.02], scale: [0.32, 0.2, 0.03] });
    }

    return { posts, floorLines, glass, mullions, glows, desks };
  }, [W, D, hx, hz, storyHeight, totalH]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Đế công trình */}
      <Part position={[0, yBase / 2, 0]} scale={[W + 0.16, yBase, D + 0.16]} material={BASE_MAT} />

      {/* Khối đèn nội thất (vẽ trước kính) */}
      {glows.map((g, i) => (
        <Part key={`glow-${i}`} position={g.position} scale={g.scale} material={GLOW_MAT} castShadow={false} />
      ))}
      {/* Bàn + màn hình tầng trệt */}
      {desks.map((d, i) => (
        <Part key={`desk-${i}`} position={d.position} scale={d.scale} material={d.kind === 'screen' ? SCREEN_MAT : DESK_MAT} />
      ))}

      {/* Trụ thép góc */}
      {posts.map((p, i) => (
        <Part key={`post-${i}`} position={p.position} scale={p.scale} material={STEEL_MAT} />
      ))}

      {/* Curtain-wall kính */}
      {glass.map((g, i) => (
        <Part key={`glass-${i}`} position={g.position} scale={g.scale} material={GLASS_MAT} castShadow={false} />
      ))}
      {/* Mullion đứng */}
      {mullions.map((m, i) => (
        <Part key={`mul-${i}`} position={m.position} scale={m.scale} material={STEEL_MAT} castShadow={false} />
      ))}

      {/* Dải mép sàn giữa */}
      {floorLines.map((s, i) => (
        <Part key={`fl-${i}`} position={s.position} scale={s.scale} material={SLAB_MAT} />
      ))}

      {/* Vây teal đứng ở góc trước (+X,+Z) — dấu ấn nhận diện văn phòng */}
      <Part position={[hx + 0.03, yBase + totalH / 2, hz + 0.03]} scale={[0.07, totalH + 0.24, 0.07]} material={ACCENT_MAT} />

      {/* ─── Mái + sân thượng ─── */}
      {/* Nẹp teal quanh mái (parapet) — lộ viền màu */}
      <Part position={[0, yTop + 0.02, 0]} scale={[W + 0.12, 0.1, D + 0.12]} material={ACCENT_MAT} />
      {/* Mái graphite mỏng, đặt trên nẹp */}
      <Part position={[0, yTop + 0.1, 0]} scale={[W + 0.02, 0.06, D + 0.02]} material={ROOF_MAT} />
      {/* Lan can sân thượng quanh chu vi */}
      <Part position={[0, yTop + 0.28, hz]} scale={[W, FRAME * 0.5, FRAME * 0.5]} material={STEEL_MAT} castShadow={false} />
      <Part position={[0, yTop + 0.28, -hz]} scale={[W, FRAME * 0.5, FRAME * 0.5]} material={STEEL_MAT} castShadow={false} />
      <Part position={[hx, yTop + 0.28, 0]} scale={[FRAME * 0.5, FRAME * 0.5, D]} material={STEEL_MAT} castShadow={false} />
      <Part position={[-hx, yTop + 0.28, 0]} scale={[FRAME * 0.5, FRAME * 0.5, D]} material={STEEL_MAT} castShadow={false} />
      {/* Cụm kỹ thuật mái */}
      <Part position={[-W * 0.24, yTop + 0.22, -D * 0.18]} scale={[0.45, 0.24, 0.36]} material={STEEL_MAT} />

      {/* ─── LỐI VÀO PHÍA SAU (-Z) ─── */}
      {/* Khung cửa chính + kính */}
      <Part position={[0, yBase + storyHeight * 0.42, -hz - 0.03]} scale={[W * 0.24, storyHeight * 0.78, 0.05]} material={STEEL_MAT} />
      <Part position={[0, yBase + storyHeight * 0.42, -hz - 0.05]} scale={[W * 0.17, storyHeight * 0.66, 0.03]} material={GLASS_MAT} castShadow={false} />
      {/* Mái đón cantilever mảnh */}
      <Part position={[0, yBase + storyHeight * 0.86, -hz - 0.22]} scale={[W * 0.42, 0.05, 0.42]} material={ACCENT_MAT} />
      {/* Biển hiệu phát sáng tầng 2 */}
      <Part position={[0, yBase + storyHeight * 1.42, -hz - 0.04]} scale={[W * 0.46, 0.16, 0.04]} material={SIGN_MAT} castShadow={false} />
    </group>
  );
}
