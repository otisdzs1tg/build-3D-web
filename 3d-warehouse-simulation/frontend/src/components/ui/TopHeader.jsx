// ═══════════════════════════════════════════
// TopHeader — Tiêu đề trên cùng, tự ẩn khi Focus mode bật.
// ═══════════════════════════════════════════
// Đặt riêng để App KHÔNG phải subscribe focusMode — nếu App subscribe thì
// <Canvas> sẽ re-render mỗi khi bật/tắt Focus, phá vỡ cách ly hiệu năng.
// ═══════════════════════════════════════════
import { useSimStore } from '../../store/useSimStore.js';

export default function TopHeader() {
  const focusMode = useSimStore((s) => s.focusMode);
  if (focusMode) return null;

  return (
    <div className="top-header">
      <h1>MÔ PHỎNG ĐIỀU PHỐI (MANUAL DISPATCH)</h1>
      <p>Xe sẽ dừng yên khi đến đích. Bấm "Khởi hành AGV" để xem xe chạy theo tuyến đường mới.</p>
      <div className="legend">
        <span className="legend-item"><span className="legend-dot green"></span> Thẳng (Nhanh)</span>
        <span className="legend-item"><span className="legend-dot orange"></span> Cua (Chậm)</span>
      </div>
    </div>
  );
}
