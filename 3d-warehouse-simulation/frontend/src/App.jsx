import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, useGLTF } from '@react-three/drei';
import axios from 'axios';
import * as THREE from 'three';
import {
  generateSmoothPath,
  cumulativeLengths,
  sampleAtDistance,
  fromAngle,
  complexSlerp,
  complexArg
} from './utils/complexMotion.js';
import './App.css';

// ═══════════════════════════════════════════
// 1. Component vẽ Kệ hàng (GIỮ NGUYÊN)
// ═══════════════════════════════════════════
const Shelf = ({ position }) => (
  <mesh position={position}>
    <boxGeometry args={[0.9, 1, 0.9]} />
    <meshStandardMaterial color="#ff7300" />
  </mesh>
);

// ═══════════════════════════════════════════
// 2. Component AGV — Chuyển động số phức mượt mà
// ═══════════════════════════════════════════
const AGV = ({ smoothPath, isMoving, onFinish, speed, turnSpeed, mode }) => {
  const groupRef = useRef();
  const { scene } = useGLTF('/agv.glb');
  const initialized = useRef(false);

  // State nội bộ cho animation
  const distanceTraveled = useRef(0);
  const cumLengthsRef = useRef([]);
  const smoothPathRef = useRef([]);
  const currentAngle = useRef(0);

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

  // Set vị trí ban đầu khi mount
  useEffect(() => {
    if (groupRef.current && !initialized.current) {
      initialized.current = true;
    }
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (!isMoving) return;

    const pts = smoothPathRef.current;
    const cumL = cumLengthsRef.current;
    if (!pts.length || !cumL.length) return;

    const totalLen = cumL[cumL.length - 1];

    if (mode === 'discrete') {
      // ═══ CHẾ ĐỘ RỜI RẠC (nhảy từng bước) ═══
      distanceTraveled.current += speed * delta;
      if (distanceTraveled.current >= totalLen) {
        distanceTraveled.current = totalLen;
        const last = pts[pts.length - 1];
        groupRef.current.position.set(last.x, 0.25, last.z);
        groupRef.current.rotation.y = last.angle;
        onFinish?.();
        return;
      }
      const sample = sampleAtDistance(pts, cumL, distanceTraveled.current);
      groupRef.current.position.set(sample.x, 0.25, sample.z);
      groupRef.current.rotation.y = sample.angle;
    } else {
      // ═══ CHẾ ĐỘ NỘI SUY SỐ PHỨC (Lerp mượt) ═══
      distanceTraveled.current += speed * delta;
      if (distanceTraveled.current >= totalLen) {
        distanceTraveled.current = totalLen;
        const last = pts[pts.length - 1];
        groupRef.current.position.set(last.x, 0.25, last.z);
        groupRef.current.rotation.y = last.angle;
        onFinish?.();
        return;
      }

      const sample = sampleAtDistance(pts, cumL, distanceTraveled.current);

      // Nội suy vị trí mượt
      const targetPos = new THREE.Vector3(sample.x, 0.25, sample.z);
      groupRef.current.position.lerp(targetPos, Math.min(1, turnSpeed * delta));

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
      <primitive object={scene} scale={[10, 10, 10]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  );
};

// ═══════════════════════════════════════════
// 3. App chính
// ═══════════════════════════════════════════
export default function App() {
  const [matrix, setMatrix] = useState([]);
  const [smoothPath, setSmoothPath] = useState([]);
  const [isMoving, setIsMoving] = useState(false);

  const [offsetX, setOffsetX] = useState(0);
  const [offsetZ, setOffsetZ] = useState(0);

  // Input tọa độ
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(25);
  const [endY, setEndY] = useState(25);

  // Cấu hình chuyển động
  const [autoPatrol, setAutoPatrol] = useState(false);
  const [moveMode, setMoveMode] = useState('lerp'); // 'discrete' | 'lerp'
  const [straightSpeed, setStraightSpeed] = useState(8);
  const [turnSpeedVal, setTurnSpeedVal] = useState(3.5);

  // Load warehouse
  useEffect(() => {
    const fetchWarehouse = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/warehouse');
        let data = [];
        if (Array.isArray(response.data) && response.data.length > 0) {
          data = response.data[0].matrix;
        } else if (response.data.matrix) {
          data = response.data.matrix;
        } else {
          data = response.data;
        }

        if (data && data.length > 0) {
          setMatrix(data);
          const oX = Math.floor(data[0].length / 2);
          const oZ = Math.floor(data.length / 2);
          setOffsetX(oX);
          setOffsetZ(oZ);
          console.log(`✅ Đã tải kho hàng: ${data[0].length}x${data.length}`);
        }
      } catch (error) {
        console.error('Lỗi lấy dữ liệu kho:', error);
      }
    };
    fetchWarehouse();
  }, []);

  // Chuyển path BFS thành smooth path bằng Catmull-Rom + số phức
  const convertToSmoothPath = useCallback((rawPath) => {
    const waypoints = rawPath.map(p => ({
      x: p.x - offsetX,
      z: p.y - offsetZ
    }));
    // Số điểm nội suy: mode lerp cần nhiều hơn
    const subdivisions = moveMode === 'lerp' ? 16 : 4;
    return generateSmoothPath(waypoints, subdivisions);
  }, [offsetX, offsetZ, moveMode]);

  const handleStartMission = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/route/calculate', {
        start: { x: Number(startX), y: Number(startY) },
        end: { x: Number(endX), y: Number(endY) }
      });

      const rawPath = response.data.path;
      const smooth = convertToSmoothPath(rawPath);
      setSmoothPath(smooth);
      setIsMoving(true);
    } catch (error) {
      const msg = error.response?.data?.message || "Xe bị kẹt hoặc tọa độ nằm ngoài bản đồ!";
      alert(`🚨 ${msg}`);
    }
  };

  const handleFinish = useCallback(() => {
    setIsMoving(false);
    if (autoPatrol) {
      // Đảo ngược start/end rồi chạy lại
      setTimeout(() => {
        const tmpSX = startX, tmpSY = startY;
        setStartX(endX); setStartY(endY);
        setEndX(tmpSX); setEndY(tmpSY);
        // Trigger re-run
        setTimeout(() => handleStartMission(), 300);
      }, 500);
    }
  }, [autoPatrol, startX, startY, endX, endY]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#0f1923', margin: 0, overflow: 'hidden' }}>

      {/* ═══════════════════════════════════════ */}
      {/* PANEL ĐIỀU KHIỂN */}
      {/* ═══════════════════════════════════════ */}
      <div className="control-panel">
        <div className="panel-header">
          <span className="panel-icon">🤖</span>
          <div>
            <h2>HỆ THỐNG AGV ĐIỀU PHỐI</h2>
            <p className="panel-subtitle">Kiểm soát hành trình thủ công</p>
          </div>
        </div>

        {/* Tọa độ */}
        <div className="section">
          <h3 className="section-title">TRUNG TÂM ĐIỀU PHỐI</h3>
          <div className="coord-row">
            <span className="coord-label">📍 Bắt đầu X</span>
            <span className="coord-label-right">Bắt đầu Y</span>
          </div>
          <div className="coord-row">
            <input type="number" min="0" max={matrix[0]?.length - 1 || 29} value={startX} onChange={(e) => setStartX(e.target.value)} className="coord-input" />
            <input type="number" min="0" max={matrix.length - 1 || 29} value={startY} onChange={(e) => setStartY(e.target.value)} className="coord-input" />
          </div>

          <div className="coord-row" style={{ marginTop: '8px' }}>
            <span className="coord-label">🎯 Đích đến X</span>
            <span className="coord-label-right">Đích đến Y</span>
          </div>
          <div className="coord-row">
            <input type="number" min="0" max={matrix[0]?.length - 1 || 29} value={endX} onChange={(e) => setEndX(e.target.value)} className="coord-input" />
            <input type="number" min="0" max={matrix.length - 1 || 29} value={endY} onChange={(e) => setEndY(e.target.value)} className="coord-input" />
          </div>

          <button onClick={handleStartMission} disabled={isMoving} className="start-btn">
            🚀 KHỞI HÀNH AGV
          </button>
        </div>

        {/* Cấu hình */}
        <div className="section">
          <h3 className="section-title">⚙ CẤU HÌNH & CHẾ ĐỘ CHẠY</h3>

          {/* Auto patrol toggle */}
          <div className="toggle-row">
            <div>
              <span className="toggle-label">Chạy liên tục (Auto-Patrol)</span>
              <p className="toggle-desc">Lặp đi lặp lại khi hoàn thành</p>
            </div>
            <label className="switch">
              <input type="checkbox" checked={autoPatrol} onChange={(e) => setAutoPatrol(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>

          {/* Move mode */}
          <div className="mode-section">
            <span className="mode-label">Cơ chế di chuyển</span>
            <div className="mode-btns">
              <button className={`mode-btn ${moveMode === 'discrete' ? 'active' : ''}`} onClick={() => setMoveMode('discrete')}>
                Rời rạc (Giật)
              </button>
              <button className={`mode-btn ${moveMode === 'lerp' ? 'active' : ''}`} onClick={() => setMoveMode('lerp')}>
                Nội suy (Lerp mượt)
              </button>
            </div>
          </div>

          {/* Speed: straight */}
          <div className="speed-row">
            <span className="speed-dot green"></span>
            <span className="speed-label">Tốc độ đi thẳng</span>
            <span className="speed-value">{straightSpeed} ô/giây</span>
          </div>
          <input type="range" min="1" max="20" step="0.5" value={straightSpeed} onChange={(e) => setStraightSpeed(Number(e.target.value))} className="speed-slider green-slider" />

          {/* Speed: turn */}
          <div className="speed-row">
            <span className="speed-dot orange"></span>
            <span className="speed-label">Tốc độ ôm cua</span>
            <span className="speed-value">{turnSpeedVal} ô/giây</span>
          </div>
          <input type="range" min="0.5" max="12" step="0.5" value={turnSpeedVal} onChange={(e) => setTurnSpeedVal(Number(e.target.value))} className="speed-slider orange-slider" />
        </div>

        {/* Status indicator */}
        <div className="status-bar">
          <span className={`status-dot ${isMoving ? 'moving' : 'idle'}`}></span>
          <span>{isMoving ? 'ĐANG CHẠY' : 'SẴN SÀNG'}</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.5 }}>
            {matrix.length > 0 ? `Map ${matrix[0].length}×${matrix.length}` : '...'}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* TIÊU ĐỀ TRÊN CÙNG */}
      {/* ═══════════════════════════════════════ */}
      <div className="top-header">
        <h1>MÔ PHỎNG ĐIỀU PHỐI (MANUAL DISPATCH)</h1>
        <p>Xe sẽ dừng yên khi đến đích. Bấm "Khởi hành AGV" để xem xe chạy theo tuyến đường mới.</p>
        <div className="legend">
          <span className="legend-item"><span className="legend-dot green"></span> Thẳng (Nhanh)</span>
          <span className="legend-item"><span className="legend-dot orange"></span> Cua (Chậm)</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* CANVAS 3D — GIỮ NGUYÊN ĐỊA HÌNH */}
      {/* ═══════════════════════════════════════ */}
      <Canvas camera={{ position: [20, 30, 20], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />

        <Grid args={[40, 40]} cellSize={1} cellThickness={1} cellColor="#6f6f6f" sectionSize={5} sectionThickness={1.5} sectionColor="#4d88ff" fadeDistance={60} />

        {matrix.map((row, z) =>
          row.map((cell, x) => {
            if (cell === 1) {
              return <Shelf key={`${x}-${z}`} position={[x - offsetX, 0.5, z - offsetZ]} />;
            }
            return null;
          })
        )}

        <AGV
          smoothPath={smoothPath}
          isMoving={isMoving}
          onFinish={handleFinish}
          speed={straightSpeed}
          turnSpeed={turnSpeedVal}
          mode={moveMode}
        />
        <OrbitControls />
      </Canvas>
    </div>
  );
}