// ═══════════════════════════════════════════
// ControlPanel — Panel điều khiển bên trái
// ═══════════════════════════════════════════
// Subscribe ĐÚNG các slice UI nó dùng. Gõ ô input chỉ re-render component này,
// KHÔNG re-render <Canvas> (vì App không còn giữ state này nữa).
// ═══════════════════════════════════════════
import { useSimStore } from '../../store/useSimStore.js';
import EventLog from './EventLog';
import Icon from './Icon';

export default function ControlPanel() {
  const matrix = useSimStore((s) => s.matrix);
  const startX = useSimStore((s) => s.startX);
  const startY = useSimStore((s) => s.startY);
  const endX = useSimStore((s) => s.endX);
  const endY = useSimStore((s) => s.endY);
  const isMoving = useSimStore((s) => s.isMoving);

  const setField = useSimStore((s) => s.setField);
  const startMission = useSimStore((s) => s.startMission);

  // ─── Slice mới: Focus mode / chọn điểm / undo-redo ───
  const focusMode = useSimStore((s) => s.focusMode);
  const toggleFocus = useSimStore((s) => s.toggleFocusMode);
  const pickMode = useSimStore((s) => s.pickMode);
  const setPickMode = useSimStore((s) => s.setPickMode);
  const undo = useSimStore((s) => s.undo);
  const redo = useSimStore((s) => s.redo);
  const canUndo = useSimStore((s) => s.past.length > 0);
  const canRedo = useSimStore((s) => s.future.length > 0);
  const recordHistory = useSimStore((s) => s.recordHistory);

  const maxCol = matrix[0]?.length - 1 || 29;
  const maxRow = matrix.length - 1 || 29;

  return (
    <div className={`control-panel ${focusMode ? 'is-focus' : ''}`}>
      <div className="panel-header">
        <span className="panel-icon"><Icon name="cpu" size={20} /></span>
        <div>
          <h2>HỆ THỐNG AGV ĐIỀU PHỐI</h2>
          <p className="panel-subtitle">Kiểm soát hành trình thủ công</p>
        </div>
        <button
          className={`focus-btn ${focusMode ? 'active' : ''}`}
          onClick={toggleFocus}
          title={focusMode ? 'Thoát chế độ tập trung' : 'Chế độ tập trung'}
        >
          <Icon name={focusMode ? 'minimize' : 'maximize'} size={15} />
        </button>
      </div>

      {/* Tọa độ */}
      <div className="section">
        <h3 className="section-title">TRUNG TÂM ĐIỀU PHỐI</h3>

        {/* Chọn điểm trực tiếp trên bản đồ + Undo/Redo */}
        <div className="pick-toolbar">
          <button className={`pick-btn ${pickMode === 'start' ? 'active start' : ''}`} onClick={() => setPickMode('start')}><Icon name="pin" size={13} /> Chọn A</button>
          <button className={`pick-btn ${pickMode === 'end' ? 'active end' : ''}`} onClick={() => setPickMode('end')}><Icon name="target" size={13} /> Chọn B</button>
          <button className="hist-btn" onClick={undo} disabled={!canUndo} title="Hoàn tác"><Icon name="undo" size={15} /></button>
          <button className="hist-btn" onClick={redo} disabled={!canRedo} title="Làm lại"><Icon name="redo" size={15} /></button>
        </div>
        {pickMode && (
          <p className="pick-hint">Nhấp lên sàn 3D để đặt điểm {pickMode === 'start' ? 'XUẤT PHÁT' : 'ĐÍCH'}…</p>
        )}

        <div className="coord-row">
          <span className="coord-label"><Icon name="pin" size={11} className="ico-start" /> Bắt đầu X</span>
          <span className="coord-label-right">Bắt đầu Y</span>
        </div>
        <div className="coord-row">
          <input type="number" min="0" max={maxCol} value={startX} onFocus={recordHistory} onChange={(e) => setField('startX', e.target.value)} className="coord-input" />
          <input type="number" min="0" max={maxRow} value={startY} onFocus={recordHistory} onChange={(e) => setField('startY', e.target.value)} className="coord-input" />
        </div>

        <div className="coord-row" style={{ marginTop: '8px' }}>
          <span className="coord-label"><Icon name="target" size={11} className="ico-end" /> Đích đến X</span>
          <span className="coord-label-right">Đích đến Y</span>
        </div>
        <div className="coord-row">
          <input type="number" min="0" max={maxCol} value={endX} onFocus={recordHistory} onChange={(e) => setField('endX', e.target.value)} className="coord-input" />
          <input type="number" min="0" max={maxRow} value={endY} onFocus={recordHistory} onChange={(e) => setField('endY', e.target.value)} className="coord-input" />
        </div>

        <button onClick={startMission} disabled={isMoving} className="start-btn">
          <Icon name="play" size={15} /> KHỞI HÀNH AGV
        </button>
      </div>

      {/* Nhật ký sự kiện — luôn hiện (thông tin nhiệm vụ chính) */}
      <EventLog />

      {/* CẤU HÌNH & CHẾ ĐỘ CHẠY đã chuyển sang <ConfigPanel/> bên phải (dưới MiniMap) */}

      {/* Status indicator */}
      <div className="status-bar">
        <span className={`status-dot ${isMoving ? 'moving' : 'idle'}`}></span>
        <span>{isMoving ? 'ĐANG CHẠY' : 'SẴN SÀNG'}</span>
        <span className="map-info">
          {matrix.length > 0 ? `Map ${matrix[0].length}×${matrix.length}` : '...'}
        </span>
      </div>
    </div>
  );
}
