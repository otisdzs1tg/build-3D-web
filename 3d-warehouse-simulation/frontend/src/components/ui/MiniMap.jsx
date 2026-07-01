// MiniMap.jsx — Bản đồ 2D thu nhỏ hiển thị lưới, AGV, đường đi
// Đọc trực tiếp từ store (không nhận props) → App không cần prop-drill / re-render.
import React, { useRef, useEffect, useMemo } from 'react';
import { useSimStore } from '../../store/useSimStore.js';
import { WAREHOUSE_ZONES } from '../../config/warehouseConfig.js';

// Bảng màu "warm editorial" — đồng bộ token trong App.css
const COLORS = {
  bg: '#120f0a',
  gridLine: 'rgba(217, 164, 65, 0.06)',
  obstacle: 'rgba(200, 120, 50, 0.50)',
  warehouse: 'rgba(170, 90, 60, 0.42)',
  free: 'rgba(255, 244, 228, 0.02)',
  path: '#b9832c',
  pathGlow: 'rgba(217, 164, 65, 0.25)',
  start: '#7bae5e',
  startGlow: 'rgba(123, 174, 94, 0.38)',
  end: '#c85a43',
  endGlow: 'rgba(200, 90, 67, 0.4)',
  agv: '#f2c14e',
  agvGlow: 'rgba(242, 193, 78, 0.45)',
  border: 'rgba(217, 164, 65, 0.18)',
};

const MiniMap = () => {
  // Chỉ subscribe state CẤU TRÚC (đổi hiếm) → re-render component.
  // Mọi state đổi nhanh (telemetry AGV, tọa độ nhập, đường đi) đọc TỨC THỜI bằng
  // getState() trong vòng lặp vẽ → 1 rAF loop bền, KHÔNG dựng lại mỗi tick telemetry.
  const matrix = useSimStore((s) => s.matrix);
  const isLoading = useSimStore((s) => s.isLoading);

  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);

  // Cache gridPath: chỉ tính lại khi smoothPath ĐỔI THAM CHIẾU (mỗi lần có tuyến mới)
  const lastSmoothRef = useRef(null);
  const gridPathRef = useRef([]);

  // Precompute warehouse zone set for fast lookup
  const warehouseCells = useMemo(() => {
    const cells = new Set();
    Object.values(WAREHOUSE_ZONES).forEach(zone => {
      for (let r = zone.rowRange[0]; r <= zone.rowRange[1]; r++) {
        for (let c = zone.colRange[0]; c <= zone.colRange[1]; c++) {
          cells.add(`${c},${r}`);
        }
      }
    });
    return cells;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || matrix.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;

    // Set canvas resolution
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const rows = matrix.length;
    const cols = matrix[0]?.length || 30;
    const cellW = displayW / cols;
    const cellH = displayH / rows;

    const draw = (time) => {
      timeRef.current = time;

      // ── Đọc TỨC THỜI state đổi nhanh (không subscribe → không re-render) ──
      const { smoothPath, agvPosition, offsetX, offsetZ, startX, startY, endX, endY } = useSimStore.getState();
      const startPos = { x: Number(startX), y: Number(startY) };
      const endPos = { x: Number(endX), y: Number(endY) };
      // Tính lại gridPath chỉ khi tuyến đổi tham chiếu
      if (smoothPath !== lastSmoothRef.current) {
        lastSmoothRef.current = smoothPath;
        gridPathRef.current = smoothPath.map((p) => ({ x: p.x + offsetX, y: p.z + offsetZ }));
      }
      const gridPath = gridPathRef.current;

      ctx.clearRect(0, 0, displayW, displayH);

      // ── Background ──
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(0, 0, displayW, displayH);

      // ── Grid cells ──
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellW;
          const y = r * cellH;
          const isWarehouse = warehouseCells.has(`${c},${r}`);
          const isObstacle = matrix[r][c] === 1;

          if (isWarehouse) {
            ctx.fillStyle = COLORS.warehouse;
          } else if (isObstacle) {
            ctx.fillStyle = COLORS.obstacle;
          } else {
            ctx.fillStyle = COLORS.free;
          }
          ctx.fillRect(x + 0.5, y + 0.5, cellW - 1, cellH - 1);
        }
      }

      // ── Grid lines (subtle) ──
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 0.5;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * cellH);
        ctx.lineTo(displayW, r * cellH);
        ctx.stroke();
      }
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.moveTo(c * cellW, 0);
        ctx.lineTo(c * cellW, displayH);
        ctx.stroke();
      }

      // ── Path ──
      if (gridPath.length > 1) {
        // Path glow
        ctx.save();
        ctx.strokeStyle = COLORS.pathGlow;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(gridPath[0].x * cellW + cellW / 2, gridPath[0].y * cellH + cellH / 2);
        // Sample every Nth point for performance
        const step = Math.max(1, Math.floor(gridPath.length / 100));
        for (let i = step; i < gridPath.length; i += step) {
          ctx.lineTo(gridPath[i].x * cellW + cellW / 2, gridPath[i].y * cellH + cellH / 2);
        }
        ctx.lineTo(
          gridPath[gridPath.length - 1].x * cellW + cellW / 2,
          gridPath[gridPath.length - 1].y * cellH + cellH / 2
        );
        ctx.stroke();

        // Path line
        ctx.strokeStyle = COLORS.path;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        // Animated dash offset
        ctx.lineDashOffset = -(time * 0.02);
        ctx.beginPath();
        ctx.moveTo(gridPath[0].x * cellW + cellW / 2, gridPath[0].y * cellH + cellH / 2);
        for (let i = step; i < gridPath.length; i += step) {
          ctx.lineTo(gridPath[i].x * cellW + cellW / 2, gridPath[i].y * cellH + cellH / 2);
        }
        ctx.lineTo(
          gridPath[gridPath.length - 1].x * cellW + cellW / 2,
          gridPath[gridPath.length - 1].y * cellH + cellH / 2
        );
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // ── Start point ──
      const sx = startPos.x * cellW + cellW / 2;
      const sy = startPos.y * cellH + cellH / 2;
      const pointRadius = Math.min(cellW, cellH) * 0.35;

      // Start glow
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, pointRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.startGlow;
      ctx.fill();
      // Start dot
      ctx.beginPath();
      ctx.arc(sx, sy, pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.start;
      ctx.fill();
      // Start label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(7, cellW * 0.6)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('S', sx, sy + 0.5);
      ctx.restore();

      // ── End point ──
      const ex = endPos.x * cellW + cellW / 2;
      const ey = endPos.y * cellH + cellH / 2;

      ctx.save();
      // End glow
      ctx.beginPath();
      ctx.arc(ex, ey, pointRadius * 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.endGlow;
      ctx.fill();
      // End dot
      ctx.beginPath();
      ctx.arc(ex, ey, pointRadius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.end;
      ctx.fill();
      // End label
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${Math.max(7, cellW * 0.6)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', ex, ey + 0.5);
      ctx.restore();

      // ── AGV position (animated pulsing dot) ──
      if (agvPosition) {
        const ax = (agvPosition.x + offsetX) * cellW + cellW / 2;
        const ay = (agvPosition.z + offsetZ) * cellH + cellH / 2;
        const pulseScale = 1 + 0.3 * Math.sin(time * 0.005);

        ctx.save();
        // Outer glow ring (pulsing)
        ctx.beginPath();
        ctx.arc(ax, ay, pointRadius * 2.5 * pulseScale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250, 204, 21, ${0.15 * pulseScale})`;
        ctx.fill();

        // Inner glow
        ctx.beginPath();
        ctx.arc(ax, ay, pointRadius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.agvGlow;
        ctx.fill();

        // AGV dot
        ctx.beginPath();
        ctx.arc(ax, ay, pointRadius * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.agv;
        ctx.shadowColor = COLORS.agv;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Direction indicator (small triangle)
        if (agvPosition.angle !== undefined) {
          const angle = agvPosition.angle;
          const triLen = pointRadius * 1.8;
          ctx.beginPath();
          // Note: canvas Y is down, grid Z is down, angle is rotation.y
          // In scene: angle 0 = facing -Z (up on minimap)
          // Canvas: up is -Y
          const drawAngle = -angle - Math.PI / 2;
          ctx.moveTo(
            ax + Math.cos(drawAngle) * triLen,
            ay + Math.sin(drawAngle) * triLen
          );
          ctx.lineTo(
            ax + Math.cos(drawAngle + 2.5) * triLen * 0.4,
            ay + Math.sin(drawAngle + 2.5) * triLen * 0.4
          );
          ctx.lineTo(
            ax + Math.cos(drawAngle - 2.5) * triLen * 0.4,
            ay + Math.sin(drawAngle - 2.5) * triLen * 0.4
          );
          ctx.closePath();
          ctx.fillStyle = 'rgba(250, 204, 21, 0.7)';
          ctx.fill();
        }
        ctx.restore();
      }

      // ── Border ──
      ctx.strokeStyle = COLORS.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, displayW - 1, displayH - 1);

      // Continue animation loop
      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
    // Chỉ phụ thuộc state CẤU TRÚC → loop chỉ dựng lại khi kích thước lưới đổi
  }, [matrix, warehouseCells]);

  // Skeleton khi chưa có dữ liệu bản đồ (thay vì ẩn hẳn)
  if (matrix.length === 0) {
    return (
      <div className="minimap-container">
        <div className="minimap-header">
          <span className="minimap-title">BẢN ĐỒ TỔNG QUAN</span>
        </div>
        <div className="minimap-canvas-wrapper">
          <div className="skeleton skeleton-map" />
        </div>
        {!isLoading && <p className="log-empty">Chưa tải được bản đồ.</p>}
      </div>
    );
  }

  return (
    <div className="minimap-container">
      <div className="minimap-header">
        <span className="minimap-title">BẢN ĐỒ TỔNG QUAN</span>
      </div>
      <div className="minimap-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="minimap-canvas"
        />
      </div>
      <div className="minimap-legend">
        <span className="minimap-legend-item">
          <span className="minimap-legend-dot" style={{ background: COLORS.start }}></span>
          Xuất phát
        </span>
        <span className="minimap-legend-item">
          <span className="minimap-legend-dot" style={{ background: COLORS.end }}></span>
          Đích đến
        </span>
        <span className="minimap-legend-item">
          <span className="minimap-legend-dot" style={{ background: COLORS.agv }}></span>
          AGV
        </span>
        <span className="minimap-legend-item">
          <span className="minimap-legend-dot" style={{ background: COLORS.path }}></span>
          Đường đi
        </span>
      </div>
    </div>
  );
};

export default MiniMap;
