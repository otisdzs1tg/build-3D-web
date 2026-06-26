/**
 * ═══════════════════════════════════════════════════════════════════
 * COMPLEX NUMBER MOTION ENGINE — Toán Số Phức cho chuyển động AGV
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Sử dụng phép nhân số phức để nội suy góc xoay:
 *   z = r * e^(iθ) = r * (cosθ + i·sinθ)
 * 
 * Ưu điểm so với lerp thông thường:
 *   - Xoay mượt không bị gimbal lock
 *   - Chuyển động cong tự nhiên tại góc cua
 *   - Tốc độ đều trên toàn bộ đường cong
 */

// ═══════════════════════════════════════════
// Phép toán Số Phức cơ bản
// ═══════════════════════════════════════════

/** Tạo số phức từ phần thực và phần ảo */
export const complex = (re, im) => ({ re, im });

/** Tạo số phức từ góc (dạng cực): e^(iθ) = cosθ + i·sinθ */
export const fromAngle = (theta) => ({
  re: Math.cos(theta),
  im: Math.sin(theta)
});

/** Nhân 2 số phức: (a+bi)(c+di) = (ac-bd) + (ad+bc)i */
export const complexMul = (a, b) => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re
});

/** Liên hợp số phức: conj(a+bi) = a-bi */
export const complexConj = (z) => ({ re: z.re, im: -z.im });

/** Độ lớn (modulus) |z| = sqrt(a²+b²) */
export const complexAbs = (z) => Math.sqrt(z.re * z.re + z.im * z.im);

/** Góc (argument) arg(z) = atan2(b, a) */
export const complexArg = (z) => Math.atan2(z.im, z.re);

/** Chuẩn hóa số phức về đơn vị */
export const complexNormalize = (z) => {
  const len = complexAbs(z);
  if (len < 1e-10) return { re: 1, im: 0 };
  return { re: z.re / len, im: z.im / len };
};

/**
 * Nội suy số phức trên đường tròn đơn vị (SLERP cho 2D)
 * Dùng để nội suy góc xoay mượt mà
 * 
 * Công thức: result = a * (conj(a) * b)^t
 * Tức là: tìm phép quay từ a đến b, rồi thực hiện t phần của phép quay đó
 */
export const complexSlerp = (a, b, t) => {
  // Tính "chênh lệch" quay: delta = conj(a) * b
  const delta = complexMul(complexConj(a), b);
  
  // Lấy góc quay chênh lệch
  let angle = complexArg(delta);
  
  // Chọn đường ngắn nhất (tránh quay 270° thay vì -90°)
  if (angle > Math.PI) angle -= 2 * Math.PI;
  if (angle < -Math.PI) angle += 2 * Math.PI;
  
  // Quay t phần: a * e^(i * angle * t)
  const partialRotation = fromAngle(angle * t);
  return complexMul(a, partialRotation);
};

// ═══════════════════════════════════════════
// Catmull-Rom Spline — Đường cong mượt qua các waypoint
// ═══════════════════════════════════════════

/**
 * Nội suy Catmull-Rom cho 1 chiều
 * Cho 4 điểm p0,p1,p2,p3 và t ∈ [0,1], tính điểm trên đường cong giữa p1 và p2
 */
const catmullRom1D = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
};

/**
 * Tạo đường cong mượt từ danh sách waypoint (các điểm grid rời rạc)
 * 
 * @param {Array<{x: number, z: number}>} waypoints - Các điểm ngoặt
 * @param {number} subdivisions - Số điểm nội suy giữa mỗi cặp waypoint
 * @returns {Array<{x: number, z: number, angle: number}>} - Đường cong mượt + góc xoay
 */
export const generateSmoothPath = (waypoints, subdivisions = 12) => {
  if (!waypoints || waypoints.length < 2) return waypoints || [];
  
  const smoothPoints = [];
  const n = waypoints.length;
  
  for (let i = 0; i < n - 1; i++) {
    // 4 điểm điều khiển cho Catmull-Rom
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(n - 1, i + 2)];
    
    for (let j = 0; j < subdivisions; j++) {
      const t = j / subdivisions;
      const x = catmullRom1D(p0.x, p1.x, p2.x, p3.x, t);
      const z = catmullRom1D(p0.z, p1.z, p2.z, p3.z, t);
      smoothPoints.push({ x, z });
    }
  }
  
  // Thêm điểm cuối cùng
  smoothPoints.push({ 
    x: waypoints[n - 1].x, 
    z: waypoints[n - 1].z 
  });
  
  // Tính góc xoay (dùng số phức) cho mỗi điểm
  for (let i = 0; i < smoothPoints.length; i++) {
    if (i < smoothPoints.length - 1) {
      const dx = smoothPoints[i + 1].x - smoothPoints[i].x;
      const dz = smoothPoints[i + 1].z - smoothPoints[i].z;
      // Góc xoay = arg(dx + i*dz) — hướng di chuyển dưới dạng số phức
      smoothPoints[i].angle = Math.atan2(dx, dz);
    } else {
      // Điểm cuối: giữ nguyên góc của điểm trước
      smoothPoints[i].angle = smoothPoints[i - 1]?.angle || 0;
    }
  }
  
  return smoothPoints;
};

/**
 * Tính tổng chiều dài đường đi (để ước lượng thời gian)
 */
export const pathLength = (points) => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dz = points[i].z - points[i - 1].z;
    total += Math.sqrt(dx * dx + dz * dz);
  }
  return total;
};

/**
 * Tính tổng chiều dài tích lũy tại mỗi điểm (cumulative arc length)
 * Dùng cho di chuyển đều tốc (constant-speed parameterization)
 */
export const cumulativeLengths = (points) => {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dz = points[i].z - points[i - 1].z;
    lengths.push(lengths[i - 1] + Math.sqrt(dx * dx + dz * dz));
  }
  return lengths;
};

/**
 * Lấy vị trí và góc xoay trên đường cong tại khoảng cách s (arc length)
 * Đảm bảo tốc độ đều - không bị nhanh/chậm bất thường
 * 
 * @param {Array} points - Mảng điểm mượt
 * @param {Array} cumLengths - Mảng chiều dài tích lũy
 * @param {number} s - Khoảng cách đã đi
 * @returns {{x, z, angle}} - Vị trí và góc xoay hiện tại
 */
export const sampleAtDistance = (points, cumLengths, s) => {
  const totalLen = cumLengths[cumLengths.length - 1];
  
  // Clamp s vào phạm vi hợp lệ
  s = Math.max(0, Math.min(s, totalLen));
  
  // Tìm đoạn chứa s bằng binary search
  let lo = 0, hi = cumLengths.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumLengths[mid] <= s) lo = mid;
    else hi = mid;
  }
  
  const segStart = cumLengths[lo];
  const segEnd = cumLengths[hi];
  const segLen = segEnd - segStart;
  
  if (segLen < 1e-10) {
    return { ...points[lo] };
  }
  
  const t = (s - segStart) / segLen;
  
  const p0 = points[lo];
  const p1 = points[hi];
  
  // Nội suy vị trí tuyến tính giữa 2 điểm mượt
  const x = p0.x + (p1.x - p0.x) * t;
  const z = p0.z + (p1.z - p0.z) * t;
  
  // Nội suy góc xoay bằng SỐ PHỨC (tránh vấn đề wrap-around 360°)
  const rot0 = fromAngle(p0.angle);
  const rot1 = fromAngle(p1.angle);
  const rotInterp = complexSlerp(rot0, rot1, t);
  const angle = complexArg(rotInterp);
  
  return { x, z, angle };
};
