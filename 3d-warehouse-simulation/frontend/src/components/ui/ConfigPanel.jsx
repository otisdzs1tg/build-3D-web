// ═══════════════════════════════════════════
// ConfigPanel — Cấu hình & chế độ chạy (Auto-Patrol, cơ chế, tốc độ)
// ═══════════════════════════════════════════
// Tách khỏi ControlPanel để đặt bên PHẢI, ngay dưới MiniMap.
// Subscribe đúng slice cấu hình → kéo slider chỉ re-render panel này, KHÔNG đụng Canvas.
// Ẩn khi Focus mode (là panel phụ), giữ đúng hành vi cũ.
// ═══════════════════════════════════════════
import { useSimStore } from '../../store/useSimStore.js';

export default function ConfigPanel() {
  const focusMode = useSimStore((s) => s.focusMode);
  const autoPatrol = useSimStore((s) => s.autoPatrol);
  const moveMode = useSimStore((s) => s.moveMode);
  const straightSpeed = useSimStore((s) => s.straightSpeed);
  const turnSpeedVal = useSimStore((s) => s.turnSpeedVal);

  const setAutoPatrol = useSimStore((s) => s.setAutoPatrol);
  const setMoveMode = useSimStore((s) => s.setMoveMode);
  const setStraightSpeed = useSimStore((s) => s.setStraightSpeed);
  const setTurnSpeedVal = useSimStore((s) => s.setTurnSpeedVal);

  if (focusMode) return null;

  return (
    <div className="config-panel">
      <h3 className="section-title">CẤU HÌNH & CHẾ ĐỘ CHẠY</h3>

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
  );
}
