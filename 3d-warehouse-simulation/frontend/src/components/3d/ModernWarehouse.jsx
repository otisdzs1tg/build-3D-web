// ModernWarehouse.jsx — Kho/cửa hàng hiện đại dựng procedural (thay model "Storage shed.glb" mái đỏ cũ).
// Khối phẳng, tường panel be ấm, mái bằng có nẹp hổ phách, mặt tiền kính đồng + mái đón + biển hiệu phát sáng.
// Cùng phong cách với ManagementOffice: dùng chung 1 BoxGeometry + material cấp module, chỉ scale theo mesh.
import React, { useMemo } from 'react';
import * as THREE from 'three';

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);

// ─── Bảng vật liệu (warm/modern) — tạo 1 lần, chia sẻ toàn scene ───
const BASE_MAT = new THREE.MeshStandardMaterial({ color: '#2a2620', metalness: 0.5, roughness: 0.6 });      // đế bê tông
const WALL_MAT = new THREE.MeshStandardMaterial({ color: '#d9cdb8', metalness: 0.12, roughness: 0.7 });     // panel tường be ấm
const STEEL_MAT = new THREE.MeshStandardMaterial({ color: '#2b2722', metalness: 0.86, roughness: 0.4 });    // trụ/nẹp thép tối
const ROOF_MAT = new THREE.MeshStandardMaterial({ color: '#37322a', metalness: 0.5, roughness: 0.6 });      // mái bằng
const ACCENT_MAT = new THREE.MeshStandardMaterial({ color: '#d9a441', metalness: 0.45, roughness: 0.45 });  // nẹp mái hổ phách
const GLASS_MAT = new THREE.MeshStandardMaterial({
  color: '#4a3d28', metalness: 0.6, roughness: 0.14,
  transparent: true, opacity: 0.5, side: THREE.DoubleSide, // kính đồng (bronze) hiện đại
});
const DOOR_MAT = new THREE.MeshStandardMaterial({ color: '#3f3a33', metalness: 0.55, roughness: 0.45 });    // cửa cuốn thép
const SIGN_MAT = new THREE.MeshStandardMaterial({
  color: '#1a1206', emissive: '#e8c069', emissiveIntensity: 1.0, metalness: 0.1, roughness: 0.4, // biển hiệu phát sáng
});

function Part({ position, scale, material, castShadow = true }) {
  return (
    <mesh geometry={UNIT_BOX} material={material} position={position} scale={scale} castShadow={castShadow} receiveShadow />
  );
}

export default function ModernWarehouse({
  position = [0, 0, 0],
  rotation = 0,
  width = 5,    // bề ngang footprint (ô lưới, trục X)
  depth = 4,    // bề sâu footprint (ô lưới, trục Z)
  height = 1.7, // chiều cao thân nhà
}) {
  const INSET = 0.12;
  const FRAME = 0.09;
  const W = Math.max(0.8, width - INSET);
  const D = Math.max(0.8, depth - INSET);
  const hx = W / 2;
  const hz = D / 2;
  const yBase = 0.12;          // đỉnh đế
  const H = height;
  const yTop = yBase + H;       // cao độ mái

  const { posts, reveals, roofUnits } = useMemo(() => {
    // 4 trụ thép góc → khung panel hiện đại
    const posts = [[hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz]].map(([px, pz]) => ({
      position: [px, yBase + H / 2, pz], scale: [FRAME, H, FRAME],
    }));

    // Đường ron ngang chia panel (2 mức) — nẹp thép mảnh chạy quanh
    const reveals = [H * 0.36, H * 0.68].map((ry) => ({
      position: [0, yBase + ry, 0], scale: [W + 0.015, 0.03, D + 0.015],
    }));

    // Thiết bị HVAC trên mái + ống → chi tiết "hiện đại"
    const roofUnits = [
      { position: [-W * 0.22, yTop + 0.11, -D * 0.12], scale: [0.55, 0.2, 0.4] },
      { position: [W * 0.24, yTop + 0.08, D * 0.05], scale: [0.34, 0.14, 0.34] },
    ];

    return { posts, reveals, roofUnits };
  }, [W, D, hx, hz, H, yTop]);

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Đế công trình */}
      <Part position={[0, yBase / 2, 0]} scale={[W + 0.14, yBase, D + 0.14]} material={BASE_MAT} />

      {/* Thân nhà (khối panel đặc) */}
      <Part position={[0, yBase + H / 2, 0]} scale={[W, H, D]} material={WALL_MAT} />

      {/* Trụ thép 4 góc */}
      {posts.map((p, i) => (
        <Part key={`post-${i}`} position={p.position} scale={p.scale} material={STEEL_MAT} />
      ))}

      {/* Ron ngang chia panel */}
      {reveals.map((r, i) => (
        <Part key={`rev-${i}`} position={r.position} scale={r.scale} material={STEEL_MAT} />
      ))}

      {/* Mái bằng + nẹp hổ phách (parapet) */}
      <Part position={[0, yTop + 0.04, 0]} scale={[W + 0.08, 0.08, D + 0.08]} material={ROOF_MAT} />
      <Part position={[0, yTop - 0.04, 0]} scale={[W + 0.03, 0.07, D + 0.03]} material={ACCENT_MAT} />

      {/* Giếng trời trên mái (kính) */}
      <Part position={[0, yTop + 0.09, 0]} scale={[W * 0.42, 0.02, D * 0.34]} material={GLASS_MAT} castShadow={false} />

      {/* Thiết bị mái */}
      {roofUnits.map((u, i) => (
        <Part key={`hvac-${i}`} position={u.position} scale={u.scale} material={STEEL_MAT} />
      ))}

      {/* ─── MẶT TIỀN (+Z, hướng vào trong kho) ─── */}
      {/* Kính đồng lớn */}
      <Part position={[0, yBase + H * 0.42, hz + 0.015]} scale={[W * 0.72, H * 0.62, 0.04]} material={GLASS_MAT} castShadow={false} />
      {/* Nẹp khung kính */}
      <Part position={[0, yBase + H * 0.42, hz + 0.02]} scale={[W * 0.74, 0.04, 0.05]} material={STEEL_MAT} />
      <Part position={[0, yBase + H * 0.72, hz + 0.02]} scale={[W * 0.74, 0.04, 0.05]} material={STEEL_MAT} />
      {/* Cửa cuốn / lối vào trung tâm */}
      <Part position={[0, yBase + H * 0.26, hz + 0.03]} scale={[W * 0.3, H * 0.5, 0.05]} material={DOOR_MAT} />
      {/* Mái đón cantilever */}
      <Part position={[0, yBase + H * 0.6, hz + 0.28]} scale={[W * 0.82, 0.06, 0.55]} material={ACCENT_MAT} />
      {/* Biển hiệu phát sáng phía trên mái đón */}
      <Part position={[0, yBase + H * 0.82, hz + 0.05]} scale={[W * 0.46, 0.16, 0.04]} material={SIGN_MAT} castShadow={false} />
    </group>
  );
}
