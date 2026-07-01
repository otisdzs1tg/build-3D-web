// ═══════════════════════════════════════════
// WarehouseScene — Toàn bộ nội dung bên trong <Canvas>
// ═══════════════════════════════════════════
// Component này CHỈ subscribe các slice cảnh cần (matrix/offset/smoothPath/isMoving).
// Gõ ô input hay kéo slider tốc độ KHÔNG re-render component này.
// ═══════════════════════════════════════════
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
  cumulativeLengths,
  sampleAtDistance,
  fromAngle,
  complexSlerp,
  complexArg,
} from '../../utils/complexMotion.js';
import { useSimStore } from '../../store/useSimStore.js';
import { WAREHOUSE_ZONES, isInWarehouseZone } from '../../config/warehouseConfig.js';
import ShelfModel from './ShelfModel';
import WarehouseFloor from './WarehouseFloor';
import MetalShelf, { getWallRotation } from './MetalShelf';
import ManagementOffice from './ManagementOffice';
import ModernWarehouse from './ModernWarehouse';
import Worker from './Worker';

// ═══════════════════════════════════════════
// Component render 1 kho hàng (Storage shed) phủ cả vùng
// ═══════════════════════════════════════════
const WarehouseZone = ({ zone, offsetX, offsetZ }) => {
  const centerCol = (zone.colRange[0] + zone.colRange[1]) / 2;
  const centerRow = (zone.rowRange[0] + zone.rowRange[1]) / 2;
  const posX = centerCol - offsetX;
  const posZ = centerRow - offsetZ;

  return (
    <ShelfModel
      modelPath={zone.modelPath}
      position={[posX, zone.yOffset, posZ]}
      scale={zone.scale}
      rotation={zone.rotation}
      color="#ff7300"
    />
  );
};

// ═══════════════════════════════════════════
// Component AGV — Chuyển động số phức mượt mà
// ═══════════════════════════════════════════
// Chỉ nhận smoothPath/isMoving/offset từ props (do scene truyền).
// Tốc độ/chế độ đọc TỨC THỜI từ store trong useFrame → kéo slider không re-render.
const AGV = ({ smoothPath, isMoving, offsetX, offsetZ }) => {
  const groupRef = useRef();
  const { scene } = useGLTF('/models/xe.glb');
  const initialized = useRef(false);

  // Bật đổ bóng cho mọi mesh con của model xe (GLTF không tự bật castShadow)
  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // State nội bộ cho animation
  const distanceTraveled = useRef(0);
  const cumLengthsRef = useRef([]);
  const smoothPathRef = useRef([]);
  const currentAngle = useRef(0);

  // Throttle ghi telemetry về store (~100ms cho minimap mượt)
  const lastPosUpdateRef = useRef(0);

  // Khi nhận path mới → reset animation
  useEffect(() => {
    if (smoothPath && smoothPath.length > 1) {
      smoothPathRef.current = smoothPath;
      cumLengthsRef.current = cumulativeLengths(smoothPath);
      distanceTraveled.current = 0;

      // Snap xe về điểm đầu
      if (groupRef.current) {
        groupRef.current.position.set(smoothPath[0].x, 0.25, smoothPath[0].z);
        currentAngle.current = smoothPath[0].angle || 0;
        groupRef.current.rotation.y = currentAngle.current;
      }
    }
  }, [smoothPath]);

  // Đặt xe ở KHO 1 khi khởi tạo (col=10, row=0 — ngay trước cửa KHO 1)
  useEffect(() => {
    if (groupRef.current && !initialized.current) {
      const startCol = 10;
      const startRow = 0;
      const posX = startCol - offsetX;
      const posZ = startRow - offsetZ;
      groupRef.current.position.set(posX, 0.25, posZ);
      initialized.current = true;
    }
  }, [offsetX, offsetZ]);

  // Ghi telemetry về store, có throttle
  const pushTelemetry = (pos) => {
    const now = Date.now();
    if (now - lastPosUpdateRef.current > 100) {
      lastPosUpdateRef.current = now;
      const { setAgvPosition, setAgvProgress } = useSimStore.getState();
      setAgvPosition(pos);
      if (pos.traveled !== undefined) {
        setAgvProgress({ traveled: pos.traveled, total: pos.total });
      }
    }
  };

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!isMoving) return;

    const pts = smoothPathRef.current;
    const cumL = cumLengthsRef.current;
    if (!pts.length || !cumL.length) return;

    // Đọc TỨC THỜI cấu hình chuyển động — KHÔNG subscribe → không re-render
    const { straightSpeed: speed, turnSpeedVal: turnSpeed, moveMode: mode, finishMission } =
      useSimStore.getState();

    const totalLen = cumL[cumL.length - 1];

    if (mode === 'discrete') {
      // ═══ CHẾ ĐỘ RỜI RẠC (nhảy từng bước) ═══
      distanceTraveled.current += speed * delta;
      if (distanceTraveled.current >= totalLen) {
        distanceTraveled.current = totalLen;
        const last = pts[pts.length - 1];
        groupRef.current.position.set(last.x, 0.25, last.z);
        groupRef.current.rotation.y = last.angle;
        pushTelemetry({ x: last.x, z: last.z, angle: last.angle, traveled: totalLen, total: totalLen });
        finishMission();
        return;
      }
      const sample = sampleAtDistance(pts, cumL, distanceTraveled.current);
      groupRef.current.position.set(sample.x, 0.25, sample.z);
      groupRef.current.rotation.y = sample.angle;
      pushTelemetry({ x: sample.x, z: sample.z, angle: sample.angle, traveled: distanceTraveled.current, total: totalLen });
    } else {
      // ═══ CHẾ ĐỘ NỘI SUY SỐ PHỨC (Lerp mượt) ═══
      distanceTraveled.current += speed * delta;
      if (distanceTraveled.current >= totalLen) {
        distanceTraveled.current = totalLen;
        const last = pts[pts.length - 1];
        groupRef.current.position.set(last.x, 0.25, last.z);
        groupRef.current.rotation.y = last.angle;
        pushTelemetry({ x: last.x, z: last.z, angle: last.angle, traveled: totalLen, total: totalLen });
        finishMission();
        return;
      }

      const sample = sampleAtDistance(pts, cumL, distanceTraveled.current);

      // Nội suy vị trí mượt
      const targetPos = new THREE.Vector3(sample.x, 0.25, sample.z);
      groupRef.current.position.lerp(targetPos, Math.min(1, turnSpeed * delta));
      pushTelemetry({
        x: groupRef.current.position.x,
        z: groupRef.current.position.z,
        angle: currentAngle.current,
        traveled: distanceTraveled.current,
        total: totalLen,
      });

      // Nội suy góc xoay bằng SỐ PHỨC
      const currentRot = fromAngle(currentAngle.current);
      const targetRot = fromAngle(sample.angle);
      const blended = complexSlerp(currentRot, targetRot, Math.min(1, turnSpeed * delta));
      currentAngle.current = complexArg(blended);
      groupRef.current.rotation.y = currentAngle.current;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={[5, 5, 5]} rotation={[0, 0, 0]} />
    </group>
  );
};

// ═══════════════════════════════════════════
// PickMarkers — Cột mốc Start (xanh) / End (đỏ) trên sàn 3D
// ═══════════════════════════════════════════
// Subscribe tọa độ RIÊNG ở đây → gõ input chỉ re-render 2 hình nón này,
// KHÔNG đụng tới lưới kho (WarehouseScene không subscribe tọa độ).
const PickMarkers = () => {
  const startX = useSimStore((s) => s.startX);
  const startY = useSimStore((s) => s.startY);
  const endX = useSimStore((s) => s.endX);
  const endY = useSimStore((s) => s.endY);
  const offsetX = useSimStore((s) => s.offsetX);
  const offsetZ = useSimStore((s) => s.offsetZ);

  const pin = (col, row, color) => (
    <mesh position={[Number(col) - offsetX, 0.9, Number(row) - offsetZ]}>
      <coneGeometry args={[0.35, 1.4, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
    </mesh>
  );

  return (
    <>
      {pin(startX, startY, '#22c55e')}
      {pin(endX, endY, '#ef4444')}
    </>
  );
};

// ═══════════════════════════════════════════
// Cảnh chính bên trong Canvas
// ═══════════════════════════════════════════
export default function WarehouseScene() {
  // Chỉ subscribe slice cảnh cần — gõ input / kéo slider KHÔNG re-render scene
  const matrix = useSimStore((s) => s.matrix);
  const offsetX = useSimStore((s) => s.offsetX);
  const offsetZ = useSimStore((s) => s.offsetZ);
  const smoothPath = useSimStore((s) => s.smoothPath);
  const isMoving = useSimStore((s) => s.isMoving);

  // ═══ Vị trí công nhân: chọn ô trống trải đều, ưu tiên cạnh kệ / làn dẫn ═══
  const workers = useMemo(() => {
    if (!matrix.length) return [];
    const rows = matrix.length;
    const cols = matrix[0]?.length ?? 0;
    // Ô là KỆ thật = obstacle nhưng KHÔNG thuộc vùng kho/văn phòng (những vùng đó dựng model riêng).
    const isRack = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols && matrix[r][c] === 1 && !isInWarehouseZone(r, c);
    const nearRack = (r, c) => isRack(r - 1, c) || isRack(r + 1, c) || isRack(r, c - 1) || isRack(r, c + 1);
    // Kề công trình (kho/VP) → tránh, để không có công nhân đứng sát toà nhà.
    const nearBuilding = (r, c) =>
      isInWarehouseZone(r - 1, c) || isInWarehouseZone(r + 1, c) ||
      isInWarehouseZone(r, c - 1) || isInWarehouseZone(r, c + 1);
    const chosen = [];
    const far = (c, r) => chosen.every(([cc, rr]) => Math.max(Math.abs(cc - c), Math.abs(rr - r)) >= 3);
    for (let r = 1; r < rows - 1 && chosen.length < 11; r++) {
      for (let c = 1; c < cols - 1 && chosen.length < 11; c++) {
        if (matrix[r][c] !== 0 || isInWarehouseZone(r, c)) continue;
        if (c === 10) continue;                            // chừa làn dẫn AGV (tránh xe chạy xuyên người)
        if (nearBuilding(r, c)) continue;                  // XOÁ công nhân quanh kho/VP
        if (!nearRack(r, c) || !far(c, r)) continue;       // chỉ đứng cạnh KỆ, trải đều
        chosen.push([c, r]);
      }
    }
    return chosen.map(([c, r], i) => ({
      key: `worker-${c}-${r}`,
      position: [c - offsetX, 0, r - offsetZ],
      rotation: (i * 2.399) % (Math.PI * 2),
      seed: r * 97 + c * 13 + 1,
    }));
  }, [matrix, offsetX, offsetZ]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
      />

      {/* ═══ SÀN BÊ TÔNG + LÀN DẪN HƯỚNG VÀNG ═══ */}
      <WarehouseFloor
        size={matrix.length || 30}
        laneAxis="z"
        laneCenter={10 - offsetX}
      />

      {/* ═══ KHO 1 & 2 = kho/cửa hàng hiện đại (procedural) ; KHO 3 & 4 = văn phòng điều hành ═══ */}
      {Object.entries(WAREHOUSE_ZONES).map(([key, zone]) => {
        const w = zone.colRange[1] - zone.colRange[0] + 1;
        const d = zone.rowRange[1] - zone.rowRange[0] + 1;
        const cx = (zone.colRange[0] + zone.colRange[1]) / 2 - offsetX;
        const cz = (zone.rowRange[0] + zone.rowRange[1]) / 2 - offsetZ;
        if (zone.type === 'office') {
          return <ManagementOffice key={key} position={[cx, 0, cz]} width={w} depth={d} />;
        }
        if (zone.type === 'shed') {
          return <ModernWarehouse key={key} position={[cx, 0, cz]} width={w} depth={d} />;
        }
        return <WarehouseZone key={key} zone={zone} offsetX={offsetX} offsetZ={offsetZ} />;
      })}

      {/* ═══ CÁC Ô OBSTACLE KHÁC (tường, kệ, cột trụ) ═══ */}
      {matrix.map((row, z) =>
        row.map((cell, x) => {
          if (cell === 1) {
            // Skip ô thuộc KHO (kho/văn phòng render riêng theo cả vùng)
            if (isInWarehouseZone(z, x)) return null;
            return (
              <MetalShelf
                key={`${x}-${z}`}
                position={[x - offsetX, 0, z - offsetZ]}
                rotation={getWallRotation(matrix, z, x)}
                seed={z * 1000 + x}
              />
            );
          }
          return null;
        })
      )}

      {/* ═══ CÔNG NHÂN KHO ═══ */}
      {workers.map((w) => (
        <Worker key={w.key} position={w.position} rotation={w.rotation} seed={w.seed} />
      ))}

      <AGV
        smoothPath={smoothPath}
        isMoving={isMoving}
        offsetX={offsetX}
        offsetZ={offsetZ}
      />
      <PickMarkers />
      <OrbitControls makeDefault target={[3, 1, 3]} />
    </>
  );
}
