// ═══════════════════════════════════════════
// Icon — Bộ icon line (stroke) tối giản, đồng bộ, kế thừa currentColor.
// Thay cho emoji để giao diện chỉn chu / chuyên nghiệp hơn.
// Phong cách Feather/Lucide: viewBox 24, nét bo tròn, fill none (trừ "play").
// ═══════════════════════════════════════════

const PATHS = {
  // Bộ điều khiển / AGV (chip điều phối)
  cpu: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </>
  ),
  // Phóng to / thu gọn (Focus mode)
  maximize: <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />,
  minimize: <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />,
  // Điểm / đích
  pin: (
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  // Khởi hành (play — icon đặc)
  play: <path d="M6 4l14 8-14 8z" fill="currentColor" stroke="none" />,
  // Hoàn tác / làm lại
  undo: (
    <>
      <path d="M3 7v6h6" />
      <path d="M3.5 13a9 9 0 1 1 2.6 6.3" />
    </>
  ),
  redo: (
    <>
      <path d="M21 7v6h-6" />
      <path d="M20.5 13a9 9 0 1 0-2.6 6.3" />
    </>
  ),
  // Quãng đường (thước đo)
  ruler: <path d="M3 12h18M6 9v6M12 8v8M18 9v6" />,
  // Tiến độ (biểu đồ cột)
  chart: <path d="M6 20v-4M12 20V8M18 20V4" />,
  // ETA (đồng hồ)
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
  // Thời gian (bấm giờ)
  timer: (
    <>
      <path d="M10 2h4" />
      <path d="M12 14l3-3" />
      <circle cx="12" cy="14" r="8" />
    </>
  ),
};

export default function Icon({ name, size = 16, strokeWidth = 1.75, className = '', style }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {path}
    </svg>
  );
}
