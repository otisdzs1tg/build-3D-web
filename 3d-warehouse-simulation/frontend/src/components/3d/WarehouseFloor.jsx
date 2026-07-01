// WarehouseFloor.jsx — Sàn kho công nghiệp + vạch kẻ đường vàng cho AGV
// Bê tông đánh bóng xám nhạt + 1 làn dẫn hướng trung tâm (2 vạch biên + nấc thang ngang)
// Đơn vị = 1 ô lưới. Mặt sàn nằm ở y = 0 (trùng với mặt phẳng AGV/kệ hiện tại).
import React, { useMemo } from 'react';
import { useSimStore } from '../../store/useSimStore.js';

// ═══════════════════════════════════════════
// Bảng màu — vàng phải nổi bật trên nền bê tông xám
// ═══════════════════════════════════════════
const CONCRETE = '#b9bec4'; // bê tông xám nhạt
const YELLOW = '#ffce1f';   // vàng vạch kẻ đường

export default function WarehouseFloor({
  size = 30,             // sàn vuông size × size (ô lưới)
  position = [0, 0, 0],  // tâm sàn (mặt trên ở y = position[1])
  slabThickness = 0.2,   // độ dày tấm bê tông (nhìn như slab đặc từ cạnh)

  // ─── Cấu hình làn dẫn hướng ───
  laneAxis = 'z',        // 'z' = làn chạy theo chiều sâu, 'x' = chạy ngang
  laneCenter = 0,        // lệch tâm làn so với gốc (theo trục vuông góc làn)
  laneLength,            // chiều dài làn (mặc định = size)
  laneWidth = 2.4,       // khoảng cách giữa 2 vạch biên
  lineThickness = 0.14,  // bề rộng vạch biên dọc
  rungThickness = 0.18,  // bề rộng mỗi nấc thang ngang
  rungGap = 1.4,         // khoảng cách tâm-tâm giữa các nấc
}) {
  const length = laneLength ?? size;
  const markY = 0.012; // nhấc vạch lên cực nhẹ để tránh z-fighting với mặt sàn

  // ─── Chọn điểm trực tiếp trên sàn (raycaster) ───
  const pickMode = useSimStore((s) => s.pickMode);
  const setCellFromScene = useSimStore((s) => s.setCellFromScene);

  const handleFloorClick = (e) => {
    if (!pickMode) return;             // chỉ chọn khi đang bật chế độ chọn điểm
    e.stopPropagation();
    setCellFromScene(e.point.x, e.point.z); // e.point = toạ độ thế giới (world space)
  };

  // Vị trí tâm các nấc thang ngang, rải đều dọc theo làn
  const rungOffsets = useMemo(() => {
    const arr = [];
    const half = length / 2 - rungGap / 2;
    for (let p = -half; p <= half + 1e-6; p += rungGap) arr.push(p);
    return arr;
  }, [length, rungGap]);

  // Bề rộng mỗi nấc = khoảng trống giữa 2 vạch biên (không phủ lên vạch)
  const rungWidth = laneWidth - lineThickness;

  // Material dùng chung cho mọi vạch vàng — hơi phát sáng để nổi trên bê tông.
  // polygonOffset đẩy vạch về phía camera trong depth buffer, chống nhấp nháy.
  const markingMaterial = (
    <meshStandardMaterial
      color={YELLOW}
      roughness={0.45}
      metalness={0.05}
      emissive={YELLOW}
      emissiveIntensity={0.18}
      polygonOffset
      polygonOffsetFactor={-2}
      polygonOffsetUnits={-2}
    />
  );

  // Helper: chuyển toạ độ (dọc-làn, ngang-làn) → [x, z] theo trục đã chọn
  const along = laneAxis === 'z' ? 'z' : 'x';
  const toXZ = (alongVal, acrossVal) =>
    along === 'z' ? [acrossVal, alongVal] : [alongVal, acrossVal];

  // Kích thước plane cho vạch biên / nấc, phụ thuộc hướng làn
  const lineArgs = along === 'z' ? [lineThickness, length] : [length, lineThickness];
  const rungArgs = along === 'z' ? [rungWidth, rungThickness] : [rungThickness, rungWidth];

  return (
    <group position={position}>
      {/* ─── TẤM SÀN BÊ TÔNG (mặt trên ở y = 0) — nhận click để chọn điểm ─── */}
      <mesh
        position={[0, -slabThickness / 2, 0]}
        receiveShadow
        onClick={handleFloorClick}
        onPointerOver={() => { if (pickMode) document.body.style.cursor = 'crosshair'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[size, slabThickness, size]} />
        <meshStandardMaterial
          color={CONCRETE}
          roughness={0.5}   // bê tông đánh bóng → hơi bóng, không gương
          metalness={0.12}  // chút metalness tạo ánh sheen công nghiệp
        />
      </mesh>

      {/* ─── 2 VẠCH BIÊN SONG SONG ─── */}
      {[-1, 1].map((side) => {
        const [x, z] = toXZ(0, laneCenter + side * (laneWidth / 2));
        return (
          <mesh key={`line-${side}`} position={[x, markY, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={lineArgs} />
            {markingMaterial}
          </mesh>
        );
      })}

      {/* ─── NẤC THANG NGANG (kiểu vạch sang đường / ladder) ─── */}
      {rungOffsets.map((alongVal, i) => {
        const [x, z] = toXZ(alongVal, laneCenter);
        return (
          <mesh key={`rung-${i}`} position={[x, markY, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={rungArgs} />
            {markingMaterial}
          </mesh>
        );
      })}
    </group>
  );
}
