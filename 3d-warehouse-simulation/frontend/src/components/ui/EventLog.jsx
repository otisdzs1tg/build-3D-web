// ═══════════════════════════════════════════
// EventLog — Nhật ký sự kiện thời gian thực
// ═══════════════════════════════════════════
// Subscribe đúng slice `logs`. Re-render riêng component này khi có log mới,
// KHÔNG đụng tới cảnh 3D. Là "thông tin nhiệm vụ chính" → luôn hiện kể cả Focus mode.
// ═══════════════════════════════════════════
import { useSimStore } from '../../store/useSimStore.js';

const CONF = {
  assign:  { dot: 'assign',  label: 'GIAO LỆNH' },
  start:   { dot: 'start',   label: 'KHỞI HÀNH' },
  arrived: { dot: 'arrived', label: 'ĐẾN ĐÍCH' },
  stuck:   { dot: 'stuck',   label: 'KẸT XE' },
  error:   { dot: 'stuck',   label: 'LỖI' },
};

const clock = (t) => new Date(t).toLocaleTimeString('vi-VN', { hour12: false });

export default function EventLog() {
  const logs = useSimStore((s) => s.logs);
  const clearLogs = useSimStore((s) => s.clearLogs);

  return (
    <div className="section">
      <h3 className="section-title">
        NHẬT KÝ SỰ KIỆN
        {logs.length > 0 && <button className="log-clear" onClick={clearLogs}>Xoá</button>}
      </h3>
      <div className="event-log">
        {logs.length === 0
          ? <p className="log-empty">Chưa có sự kiện nào…</p>
          : logs.map((l) => {
              const c = CONF[l.type] || CONF.assign;
              return (
                <div key={l.id} className="log-row">
                  <span className={`log-dot ${c.dot}`}></span>
                  <span className="log-time">{clock(l.t)}</span>
                  <span className="log-msg">{l.message}</span>
                </div>
              );
            })}
      </div>
    </div>
  );
}
