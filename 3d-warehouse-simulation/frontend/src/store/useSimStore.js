// ═══════════════════════════════════════════
// useSimStore — Store Zustand TRUNG TÂM
// ═══════════════════════════════════════════
// Mục tiêu hiệu năng: TÁCH state UI (gõ liên tục) ra khỏi cây <Canvas>.
//
// Nguyên tắc:
//  - Mỗi component chỉ subscribe ĐÚNG slice nó cần (selector) → gõ ô input chỉ
//    re-render panel, KHÔNG re-render cảnh 3D.
//  - AGV đọc tốc độ/chế độ TỨC THỜI bằng getState() trong useFrame → kéo slider
//    KHÔNG hề re-render scene.
//  - Telemetry (vị trí xe) do AGV GHI, UI ĐỌC — AGV không subscribe telemetry.
// ═══════════════════════════════════════════
import { create } from 'zustand';
import axios from 'axios';
import { generateSmoothPath } from '../utils/complexMotion.js';

const API_BASE = 'http://localhost:5000';

// Chuyển path thô (BFS, toạ độ lưới {x,y}) → smooth path (toạ độ cảnh {x,z,angle})
function buildSmoothPath(rawPath, offsetX, offsetZ, moveMode) {
  const waypoints = rawPath.map((p) => ({
    x: p.x - offsetX,
    z: p.y - offsetZ,
  }));
  // Số điểm nội suy: mode lerp cần nhiều hơn
  const subdivisions = moveMode === 'lerp' ? 16 : 4;
  return generateSmoothPath(waypoints, subdivisions);
}

export const useSimStore = create((set, get) => ({
  // ─── Dữ liệu kho (tải 1 lần, gần như tĩnh) ───
  matrix: [],
  offsetX: 0,
  offsetZ: 0,
  setWarehouse: (matrix, offsetX, offsetZ) => set({ matrix, offsetX, offsetZ }),

  // ─── State NHẬP LIỆU UI (đổi liên tục khi gõ — KHÔNG được chạm Canvas) ───
  startX: 10,
  startY: 0,
  endX: 25,
  endY: 25,
  // setField gọn cho onChange từng input: setField('startX', value)
  setField: (key, value) => set({ [key]: value }),

  // ─── Cấu hình chuyển động ───
  autoPatrol: false,
  moveMode: 'lerp', // 'discrete' | 'lerp'
  straightSpeed: 8,
  turnSpeedVal: 3.5,
  setAutoPatrol: (v) => set({ autoPatrol: v }),
  setMoveMode: (m) => set({ moveMode: m }),
  setStraightSpeed: (v) => set({ straightSpeed: v }),
  setTurnSpeedVal: (v) => set({ turnSpeedVal: v }),

  // ─── State CẢNH 3D (AGV thực sự cần phản ứng) ───
  smoothPath: [],
  isMoving: false,
  missionStartedAt: null,

  // ─── Telemetry: AGV GHI, UI ĐỌC ───
  agvPosition: null,
  agvProgress: { traveled: 0, total: 0 },
  setAgvPosition: (pos) => set({ agvPosition: pos }),
  setAgvProgress: (p) => set({ agvProgress: p }),

  // ─── LOADING (skeleton) — App tắt sau khi fetch xong ───
  isLoading: true,
  setLoading: (v) => set({ isLoading: v }),

  // ─── FOCUS MODE (chỉ UI, KHÔNG ai trong <Canvas> nặng subscribe) ───
  focusMode: false,
  toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),

  // ─── NHẬT KÝ SỰ KIỆN (Event log) ───
  logs: [],
  addLog: (type, message) => set((s) => ({
    logs: [{ id: Date.now() + Math.random(), t: Date.now(), type, message }, ...s.logs].slice(0, 50),
  })),
  clearLogs: () => set({ logs: [] }),

  // ─── CHỌN ĐIỂM TRỰC TIẾP TRÊN SÀN 3D ───
  pickMode: null, // 'start' | 'end' | null
  setPickMode: (m) => set((s) => ({ pickMode: s.pickMode === m ? null : m })),
  // Nhận toạ độ CẢNH (x,z) từ raycaster onClick → quy về ô lưới → ghi start/end
  setCellFromScene: (sceneX, sceneZ) => {
    const { pickMode, offsetX, offsetZ, matrix } = get();
    if (!pickMode) return;
    const maxCol = (matrix[0]?.length || 30) - 1;
    const maxRow = (matrix.length || 30) - 1;
    const cx = Math.max(0, Math.min(maxCol, Math.round(sceneX + offsetX)));
    const cy = Math.max(0, Math.min(maxRow, Math.round(sceneZ + offsetZ)));
    if (matrix[cy]?.[cx] === 1) {
      get().addLog('error', `Ô (${cx}, ${cy}) là vật cản — chọn ô trống khác`);
      return;
    }
    get().recordHistory(); // lưu trạng thái TRƯỚC khi đổi để undo được
    if (pickMode === 'start') {
      set({ startX: cx, startY: cy, pickMode: null });
      get().addLog('assign', `📍 Đặt XUẤT PHÁT tại (${cx}, ${cy})`);
    } else {
      set({ endX: cx, endY: cy, pickMode: null });
      get().addLog('assign', `🎯 Đặt ĐÍCH ĐẾN tại (${cx}, ${cy})`);
    }
  },

  // ─── UNDO / REDO cho thiết lập tọa độ ───
  past: [],
  future: [],
  recordHistory: () => set((s) => {
    const snap = { startX: s.startX, startY: s.startY, endX: s.endX, endY: s.endY };
    const last = s.past[s.past.length - 1];
    if (last && last.startX === snap.startX && last.startY === snap.startY &&
        last.endX === snap.endX && last.endY === snap.endY) return {}; // bỏ qua trùng
    return { past: [...s.past, snap].slice(-30), future: [] };
  }),
  undo: () => set((s) => {
    if (!s.past.length) return {};
    const prev = s.past[s.past.length - 1];
    const current = { startX: s.startX, startY: s.startY, endX: s.endX, endY: s.endY };
    return { ...prev, past: s.past.slice(0, -1), future: [current, ...s.future] };
  }),
  redo: () => set((s) => {
    if (!s.future.length) return {};
    const next = s.future[0];
    const current = { startX: s.startX, startY: s.startY, endX: s.endX, endY: s.endY };
    return { ...next, past: [...s.past, current], future: s.future.slice(1) };
  }),

  // ─── Hành động: KHỞI HÀNH AGV ───
  startMission: async () => {
    const { startX, startY, endX, endY, offsetX, offsetZ, moveMode } = get();
    get().addLog('assign', `Giao lệnh: (${startX},${startY}) → (${endX},${endY})`);
    try {
      const response = await axios.post(`${API_BASE}/api/route/calculate`, {
        start: { x: Number(startX), y: Number(startY) },
        end: { x: Number(endX), y: Number(endY) },
      });
      const smooth = buildSmoothPath(response.data.path, offsetX, offsetZ, moveMode);
      set({
        smoothPath: smooth,
        agvProgress: { traveled: 0, total: 0 },
        missionStartedAt: Date.now(),
        isMoving: true,
      });
      get().addLog('start', '🚀 AGV bắt đầu chạy theo tuyến mới');
    } catch (error) {
      const msg = error.response?.data?.message || 'Xe bị kẹt hoặc tọa độ nằm ngoài bản đồ!';
      get().addLog('stuck', `🚨 ${msg}`);
      alert(`🚨 ${msg}`);
    }
  },

  // ─── Hành động: KẾT THÚC hành trình (AGV gọi qua onFinish) ───
  finishMission: () => {
    const { autoPatrol, startX, startY, endX, endY } = get();
    get().addLog('arrived', '✅ AGV đã đến đích');
    set({ isMoving: false, missionStartedAt: null });
    if (autoPatrol) {
      // Đảo ngược start/end rồi chạy lại
      setTimeout(() => {
        set({ startX: endX, startY: endY, endX: startX, endY: startY });
        setTimeout(() => get().startMission(), 300);
      }, 500);
    }
  },
}));
