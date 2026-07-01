// ShelfModel.jsx — Component kệ hàng hỗ trợ GLB model từ Spline
import React, { useMemo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Component hiển thị mô hình kệ hàng 3D (GLB) hoặc fallback hộp đơn giản.
 *
 * Props:
 *  - modelPath: string — đường dẫn tới file GLB (VD: '/models/shelf.glb')
 *  - position:  [x, y, z] — vị trí trong không gian 3D
 *  - scale:     [sx, sy, sz] — tỉ lệ kích thước
 *  - rotation:  [rx, ry, rz] — góc xoay (radian)
 *  - color:     string — màu fallback box (mặc định '#ff7300')
 */

// ─── Fallback Box (khi chưa có file GLB) ──────────────────────
const FallbackShelf = ({ position, scale, color }) => (
  <mesh position={position}>
    <boxGeometry args={scale || [0.9, 1, 0.9]} />
    <meshStandardMaterial color={color || '#ff7300'} />
  </mesh>
);

// ─── GLB Model Loader ─────────────────────────────────────────
const GLBShelf = ({ modelPath, position, scale, rotation }) => {
  const { scene } = useGLTF(modelPath);

  // Clone scene để mỗi instance có mesh riêng, tránh xung đột
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={scale || [1, 1, 1]}
      rotation={rotation || [0, 0, 0]}
    />
  );
};

// ─── Component chính: ShelfModel ──────────────────────────────
const ShelfModel = ({
  modelPath,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  color = '#ff7300',
}) => {
  // Nếu không có modelPath → dùng fallback box
  if (!modelPath) {
    return <FallbackShelf position={position} scale={[0.9, 1, 0.9]} color={color} />;
  }

  return (
    <Suspense fallback={<FallbackShelf position={position} scale={[0.9, 1, 0.9]} color={color} />}>
      <GLBShelf
        modelPath={modelPath}
        position={position}
        scale={scale}
        rotation={rotation}
      />
    </Suspense>
  );
};

export default ShelfModel;
