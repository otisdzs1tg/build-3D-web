// Worker.jsx — Công nhân kho low-poly, sạch & đẹp (nón bảo hộ, áo phản quang, ủng).
// Dựng procedural bằng capsule/sphere bo tròn → dáng gọn gàng, hiện đại.
// Màu sắc đa dạng theo seed. Dùng chung geometry/material cấp module cho hiệu năng.
import React from 'react';
import * as THREE from 'three';

// ─── Geometry dùng chung ───
const CYL = new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
const SPH = new THREE.SphereGeometry(0.5, 18, 14);
const BOX = new THREE.BoxGeometry(1, 1, 1);
const TORSO = new THREE.CapsuleGeometry(0.16, 0.26, 6, 16);   // thân (áo vest)
const ARM = new THREE.CapsuleGeometry(0.055, 0.24, 5, 12);    // tay áo
const LEG = new THREE.CapsuleGeometry(0.08, 0.26, 5, 12);     // chân (quần)
const STRIPE = new THREE.TorusGeometry(0.172, 0.02, 8, 24);   // dải phản quang quanh thân

// ─── Vật liệu ───
const STRIPE_MAT = new THREE.MeshStandardMaterial({ color: '#eef2f4', emissive: '#cfe0d0', emissiveIntensity: 0.25, metalness: 0.2, roughness: 0.3 });
const BOOT_MAT = new THREE.MeshStandardMaterial({ color: '#1c1f24', metalness: 0.3, roughness: 0.7 });

// Bảng màu đa dạng theo seed
const SKINS = [
  new THREE.MeshStandardMaterial({ color: '#e6b98f', roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: '#c98b63', roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: '#a8734d', roughness: 0.7 }),
];
const VESTS = [
  new THREE.MeshStandardMaterial({ color: '#d7e14a', metalness: 0.1, roughness: 0.55 }), // hi-vis vàng-lục
  new THREE.MeshStandardMaterial({ color: '#f0912e', metalness: 0.1, roughness: 0.55 }), // cam
  new THREE.MeshStandardMaterial({ color: '#e8c53a', metalness: 0.1, roughness: 0.55 }), // hổ phách
];
const SHIRTS = [
  new THREE.MeshStandardMaterial({ color: '#3a4a63', roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: '#4a5560', roughness: 0.7 }),
  new THREE.MeshStandardMaterial({ color: '#5b4a52', roughness: 0.7 }),
];
const PANTS = [
  new THREE.MeshStandardMaterial({ color: '#2a3550', roughness: 0.75 }),
  new THREE.MeshStandardMaterial({ color: '#33383f', roughness: 0.75 }),
  new THREE.MeshStandardMaterial({ color: '#3e3a34', roughness: 0.75 }),
];
const HATS = [
  new THREE.MeshStandardMaterial({ color: '#eef0f2', metalness: 0.1, roughness: 0.4 }), // trắng
  new THREE.MeshStandardMaterial({ color: '#f2c53d', metalness: 0.1, roughness: 0.4 }), // vàng
  new THREE.MeshStandardMaterial({ color: '#e0662f', metalness: 0.1, roughness: 0.4 }), // cam
  new THREE.MeshStandardMaterial({ color: '#3f7fb0', metalness: 0.1, roughness: 0.4 }), // xanh
];

function Part({ geometry = BOX, position, scale, rotation, material }) {
  return (
    <mesh geometry={geometry} position={position} scale={scale} rotation={rotation} material={material} castShadow receiveShadow />
  );
}

export default function Worker({ position = [0, 0, 0], rotation = 0, seed = 1 }) {
  const s = seed >>> 0;
  const skin = SKINS[s % SKINS.length];
  const vest = VESTS[(s >> 2) % VESTS.length];
  const shirt = SHIRTS[(s >> 3) % SHIRTS.length];
  const pants = PANTS[(s >> 4) % PANTS.length];
  const hat = HATS[(s >> 5) % HATS.length];

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Ủng */}
      <Part geometry={BOX} position={[0.08, 0.04, 0.03]} scale={[0.12, 0.08, 0.22]} material={BOOT_MAT} />
      <Part geometry={BOX} position={[-0.08, 0.04, 0.03]} scale={[0.12, 0.08, 0.22]} material={BOOT_MAT} />

      {/* Chân (quần) */}
      <Part geometry={LEG} position={[0.08, 0.3, 0]} material={pants} />
      <Part geometry={LEG} position={[-0.08, 0.3, 0]} material={pants} />

      {/* Thân — áo phản quang */}
      <Part geometry={TORSO} position={[0, 0.72, 0]} material={vest} />
      {/* Dải phản quang quanh thân */}
      <Part geometry={STRIPE} position={[0, 0.64, 0]} rotation={[Math.PI / 2, 0, 0]} material={STRIPE_MAT} />
      <Part geometry={STRIPE} position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]} material={STRIPE_MAT} />

      {/* Tay áo + bàn tay */}
      <Part geometry={ARM} position={[0.205, 0.72, 0]} material={shirt} />
      <Part geometry={ARM} position={[-0.205, 0.72, 0]} material={shirt} />
      <Part geometry={SPH} position={[0.205, 0.56, 0]} scale={[0.12, 0.12, 0.12]} material={skin} />
      <Part geometry={SPH} position={[-0.205, 0.56, 0]} scale={[0.12, 0.12, 0.12]} material={skin} />

      {/* Cổ + đầu */}
      <Part geometry={CYL} position={[0, 1.0, 0]} scale={[0.09, 0.08, 0.09]} material={skin} />
      <Part geometry={SPH} position={[0, 1.13, 0]} scale={[0.24, 0.26, 0.24]} material={skin} />

      {/* Nón bảo hộ: vành + chỏm */}
      <Part geometry={CYL} position={[0, 1.19, 0.01]} scale={[0.34, 0.025, 0.34]} material={hat} />
      <Part geometry={SPH} position={[0, 1.25, 0]} scale={[0.28, 0.2, 0.28]} material={hat} />
    </group>
  );
}
