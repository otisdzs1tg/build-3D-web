// ═══════════════════════════════════════════
// LiveStatsBar — Thanh thống kê dưới cùng
// ═══════════════════════════════════════════
// Đọc telemetry (vị trí/tiến độ) do AGV ghi vào store. Re-render khi telemetry đổi
// (~10 lần/giây nhờ throttle trong AGV) — chỉ component này, không phải cả cây.
// ═══════════════════════════════════════════
import { useState, useEffect } from 'react';
import { useSimStore } from '../../store/useSimStore.js';
import Icon from './Icon';

export default function LiveStatsBar() {
  const isMoving = useSimStore((s) => s.isMoving);
  const missionStartedAt = useSimStore((s) => s.missionStartedAt);
  const agvPosition = useSimStore((s) => s.agvPosition);
  const agvProgress = useSimStore((s) => s.agvProgress);
  const offsetX = useSimStore((s) => s.offsetX);
  const offsetZ = useSimStore((s) => s.offsetZ);
  const startX = useSimStore((s) => s.startX);
  const startY = useSimStore((s) => s.startY);
  const straightSpeed = useSimStore((s) => s.straightSpeed);

  // Mission timer — chỉ tick khi đang chạy
  const [missionElapsed, setMissionElapsed] = useState(0);
  useEffect(() => {
    let interval;
    if (isMoving && missionStartedAt) {
      interval = setInterval(() => {
        setMissionElapsed(Date.now() - missionStartedAt);
      }, 200);
    } else {
      setMissionElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isMoving, missionStartedAt]);

  // Stats dẫn xuất
  const progressPercent = agvProgress.total > 0 ? Math.min(100, (agvProgress.traveled / agvProgress.total) * 100) : 0;
  const gridPos = agvPosition
    ? { col: Math.round(agvPosition.x + offsetX), row: Math.round(agvPosition.z + offsetZ) }
    : { col: Number(startX), row: Number(startY) };
  const remainingDist = Math.max(0, agvProgress.total - agvProgress.traveled);
  const eta = (isMoving && straightSpeed > 0 && remainingDist > 0)
    ? (remainingDist / straightSpeed).toFixed(1)
    : '—';

  return (
    <div className="live-stats-bar">
      <div className="stats-item">
        <span className="stats-icon"><Icon name="cpu" size={15} /></span>
        <div className="stats-content">
          <span className="stats-label">AGV-01</span>
          <span className={`stats-status ${isMoving ? 'active' : ''}`}>
            {isMoving ? 'HOẠT ĐỘNG' : 'CHỜ LỆNH'}
          </span>
        </div>
      </div>

      <div className="stats-divider"></div>

      <div className="stats-item">
        <span className="stats-icon"><Icon name="pin" size={15} /></span>
        <div className="stats-content">
          <span className="stats-label">Vị trí</span>
          <span className="stats-value">({gridPos.col}, {gridPos.row})</span>
        </div>
      </div>

      <div className="stats-divider"></div>

      <div className="stats-item">
        <span className="stats-icon"><Icon name="ruler" size={15} /></span>
        <div className="stats-content">
          <span className="stats-label">Quãng đường</span>
          <span className="stats-value">{agvProgress.traveled.toFixed(1)} / {agvProgress.total.toFixed(1)} ô</span>
        </div>
      </div>

      <div className="stats-divider"></div>

      <div className="stats-item">
        <span className="stats-icon"><Icon name="chart" size={15} /></span>
        <div className="stats-content">
          <span className="stats-label">Tiến độ</span>
          <div className="stats-progress-wrapper">
            <div className="stats-progress-bar">
              <div className="stats-progress-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <span className="stats-progress-text">{progressPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <div className="stats-divider"></div>

      <div className="stats-item">
        <span className="stats-icon"><Icon name="clock" size={15} /></span>
        <div className="stats-content">
          <span className="stats-label">ETA</span>
          <span className="stats-value">{eta === '—' ? '—' : `${eta}s`}</span>
        </div>
      </div>

      <div className="stats-divider"></div>

      <div className="stats-item">
        <span className="stats-icon"><Icon name="timer" size={15} /></span>
        <div className="stats-content">
          <span className="stats-label">Thời gian</span>
          <span className="stats-value">{isMoving ? `${(missionElapsed / 1000).toFixed(1)}s` : '—'}</span>
        </div>
      </div>
    </div>
  );
}
