// ═══════════════════════════════════════════
// CẤU HÌNH KHO HÀNG & KỆ — dùng chung cho Scene 3D và MiniMap 2D
// (Tách khỏi App.jsx để cả cảnh 3D lẫn bản đồ thu nhỏ cùng import, tránh prop-drilling)
// ═══════════════════════════════════════════
export const SHELF_MODEL = '/models/shelf-model.glb';
export const STORAGE_SHED_MODEL = '/models/Storage shed.glb';

// --- 4 KHO HÀNG: mỗi kho render 1 model Storage shed duy nhất ---
export const WAREHOUSE_ZONES = {
  // KHO 1 (góc trên-trái): rows 2-5, cols 2-6 → 4 hàng × 5 cột
  kho1: {
    type: 'shed',
    modelPath: STORAGE_SHED_MODEL,
    rowRange: [2, 5],
    colRange: [2, 6],
    // Tâm: row=(2+5)/2=3.5, col=(2+6)/2=4
    // Kích thước vùng: 5 cột (X) × 4 hàng (Z)
    scale: [5, 5, 4],
    rotation: [0, 0, 0],
    yOffset: 0,
  },
  // KHO 2 (góc trên-phải): rows 2-4, cols 22-27 → 3 hàng × 6 cột
  kho2: {
    type: 'shed',
    modelPath: STORAGE_SHED_MODEL,
    rowRange: [2, 4],
    colRange: [22, 27],
    scale: [6, 5, 3],
    rotation: [0, 0, 0],
    yOffset: 0,
  },
  // KHO 3 (góc dưới-trái): rows 24-27, cols 1-5 → 4 hàng × 5 cột
  kho3: {
    type: 'office',
    modelPath: STORAGE_SHED_MODEL,
    rowRange: [24, 27],
    colRange: [1, 5],
    scale: [5, 5, 4],
    rotation: [0, 0, 0],
    yOffset: 0,
  },
  // KHO 4 (góc dưới-phải): rows 25-28, cols 23-28 → 4 hàng × 6 cột
  kho4: {
    type: 'office',
    modelPath: STORAGE_SHED_MODEL,
    rowRange: [25, 28],
    colRange: [23, 28],
    scale: [6, 5, 4],
    rotation: [0, 0, 0],
    yOffset: 0,
  },
};

// --- 2 KỆ HÀNG GIỮA: render per-cell ---
export const SHELF_ZONES = {
  shelfLeft: {
    modelPath: SHELF_MODEL,
    scale: [0.4, 0.4, 0.4],
    rotation: [0, 0, 0],
    yOffset: 0,
    color: '#ff7300',
    rowRange: [12, 13],
    colRange: [8, 10],
  },
  shelfRight: {
    modelPath: SHELF_MODEL,
    scale: [0.4, 0.4, 0.4],
    rotation: [0, 0, 0],
    yOffset: 0,
    color: '#ff7300',
    rowRange: [12, 13],
    colRange: [18, 20],
  },
};

// Hàm kiểm tra ô thuộc kho hàng nào (để skip render per-cell)
export function isInWarehouseZone(row, col) {
  for (const zone of Object.values(WAREHOUSE_ZONES)) {
    if (
      row >= zone.rowRange[0] && row <= zone.rowRange[1] &&
      col >= zone.colRange[0] && col <= zone.colRange[1]
    ) {
      return true;
    }
  }
  return false;
}

// Hàm kiểm tra ô thuộc kệ hàng nào (render per-cell với model)
export function getShelfZoneForCell(row, col) {
  for (const [key, zone] of Object.entries(SHELF_ZONES)) {
    if (
      row >= zone.rowRange[0] && row <= zone.rowRange[1] &&
      col >= zone.colRange[0] && col <= zone.colRange[1]
    ) {
      return { key, ...zone };
    }
  }
  return null;
}
