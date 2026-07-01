import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import axios from 'axios';
import { useSimStore } from './store/useSimStore.js';
import WarehouseScene from './components/3d/WarehouseScene';
import ControlPanel from './components/ui/ControlPanel';
import LiveStatsBar from './components/ui/LiveStatsBar';
import MiniMap from './components/ui/MiniMap';
import ConfigPanel from './components/ui/ConfigPanel';
import TopHeader from './components/ui/TopHeader';
import './App.css';

// ═══════════════════════════════════════════
// App chính — CHỈ là vỏ bố cục.
// ═══════════════════════════════════════════
// Quan trọng cho hiệu năng: App KHÔNG subscribe state UI hay scene nào cả.
// Gõ ô input / kéo slider chỉ re-render component đăng ký slice đó (ControlPanel),
// KHÔNG re-render App → <Canvas> không bị dựng lại / reconcile lại.
// ═══════════════════════════════════════════
export default function App() {
  const setWarehouse = useSimStore((s) => s.setWarehouse);
  const setLoading = useSimStore((s) => s.setLoading); // action ⇒ ref ổn định ⇒ KHÔNG gây re-render

  // Tải kho hàng 1 lần → đẩy vào store
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
          const oX = Math.floor(data[0].length / 2);
          const oZ = Math.floor(data.length / 2);
          setWarehouse(data, oX, oZ);
          console.log(`✅ Đã tải kho hàng: ${data[0].length}x${data.length}`);
        }
      } catch (error) {
        console.error('Lỗi lấy dữ liệu kho:', error);
      } finally {
        setLoading(false); // tắt skeleton dù thành công hay lỗi
      }
    };
    fetchWarehouse();
  }, [setWarehouse, setLoading]);

  // Phím tắt Undo/Redo (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z).
  // Dùng getState() → KHÔNG subscribe → App không re-render → <Canvas> an toàn.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return; // nhường undo văn bản cho ô nhập
      const k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); useSimStore.getState().undo(); }
      else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); useSimStore.getState().redo(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', backgroundColor: '#17130e', margin: 0, overflow: 'hidden' }}>

      {/* PANEL ĐIỀU KHIỂN */}
      <ControlPanel />

      {/* CỘT PHẢI: Mini-map 2D + Cấu hình xếp chồng dọc */}
      <div className="right-stack">
        <MiniMap />
        <ConfigPanel />
      </div>

      {/* TIÊU ĐỀ TRÊN CÙNG — tự ẩn khi Focus mode */}
      <TopHeader />

      {/* LIVE STATS BAR — Thanh thống kê dưới cùng */}
      <LiveStatsBar />

      {/* CANVAS 3D — không bao giờ dựng lại khi gõ input */}
      <Canvas shadows camera={{ position: [30, 40, 30], fov: 42 }}>
        <WarehouseScene />
      </Canvas>
    </div>
  );
}
