# 📦 HƯỚNG DẪN SỬ DỤNG MÔ HÌNH 3D CHO 4 KHỐI HÀNG

> Tài liệu này hướng dẫn cách xuất (export) mô hình 3D từ **Spline** và tích hợp vào dự án
> **3D Warehouse Simulation** để thay thế các khối hộp đơn giản bằng mô hình kệ hàng đẹp mắt.

---

## 🗺️ SƠ ĐỒ 4 KHỐI HÀNG TRONG KHO (Map 30×30)

```
     Cột 0                            Cột 29
      ┌──────────────────────────────────┐
      │                                  │
      │  ╔═══════╗          ╔═════════╗  │
      │  ║ KHO 1 ║          ║  KHO 2  ║  │  Hàng 2-5
      │  ║ (2-6) ║          ║ (22-27) ║  │
      │  ╚═══════╝          ╚═════════╝  │
      │                                  │
      │  ─────── TƯỜNG NGANG 1 ────────  │  Hàng 10
      │                                  │
      │         ┌───┐  │  ┌───┐          │
      │         │Kệ │  │  │Kệ │          │  Hàng 12-13
      │         └───┘  │  └───┘          │
      │                │ (Tường dọc)     │  Cột 14
      │                                  │
      │  ─────── TƯỜNG NGANG 2 ────────  │  Hàng 20
      │                                  │
      │  ╔═══════╗          ╔═════════╗  │
      │  ║ KHO 3 ║          ║  KHO 4  ║  │  Hàng 24-28
      │  ║ (1-5) ║          ║ (23-28) ║  │
      │  ╚═══════╝          ╚═════════╝  │
      │                                  │
      └──────────────────────────────────┘
```

### Chi tiết tọa độ 4 khối hàng:

| Khối | Vị trí     | Hàng (row) | Cột (col)  | Kích thước    |
|------|-----------|------------|------------|---------------|
| KHO 1 | Trên-Trái  | 2 → 5      | 2 → 6     | 4 hàng × 5 cột |
| KHO 2 | Trên-Phải  | 2 → 4      | 22 → 27   | 3 hàng × 6 cột |
| KHO 3 | Dưới-Trái  | 24 → 27    | 1 → 5     | 4 hàng × 5 cột |
| KHO 4 | Dưới-Phải  | 25 → 28    | 23 → 28   | 4 hàng × 6 cột |

---

## 🎨 BƯỚC 1: XUẤT MÔ HÌNH TỪ SPLINE

### 1.1 Mở dự án trong Spline
- Truy cập [app.spline.design](https://app.spline.design)
- Mở file mô hình kệ hàng (Bookcase) mà bạn đã tạo

### 1.2 Xuất file GLB
1. Nhấn nút **Export** (góc trên phải)
2. Chọn định dạng **GLB** (khuyến nghị) hoặc **GLTF**
3. Cài đặt export:
   - ✅ **Draco Compression**: BẬT (giảm dung lượng file)
   - ✅ **Embed Textures**: BẬT (nhúng texture vào file)
   - Texture Size: **1024** hoặc **512** (cân bằng chất lượng/hiệu năng)
4. Nhấn **Download**

> [!IMPORTANT]
> Nên giữ dung lượng mỗi file GLB dưới **2MB** để tải nhanh.
> Nếu file lớn hơn, hãy giảm Texture Size hoặc đơn giản hóa mesh.

### 1.3 Đặt tên file theo quy ước
Đặt tên file rõ ràng để dễ quản lý:

```
📁 frontend/public/models/
├── shelf.glb           ← Mô hình kệ hàng chung
├── shelf_large.glb     ← Kệ hàng lớn (nếu có)
├── shelf_small.glb     ← Kệ hàng nhỏ (nếu có)
├── pallet.glb          ← Pallet hàng hóa
└── agv.glb             ← Xe AGV (đã có sẵn)
```

---

## 📂 BƯỚC 2: ĐẶT FILE VÀO DỰ ÁN

### 2.1 Tạo thư mục models
```bash
mkdir frontend/public/models
```

### 2.2 Copy file GLB vào thư mục
```bash
# Copy file kệ hàng đã export từ Spline
copy shelf.glb frontend/public/models/shelf.glb
```

### 2.3 Cấu trúc thư mục sau khi thêm
```
📁 frontend/
├── public/
│   ├── agv.glb                    ← Xe AGV (đã có)
│   ├── models/
│   │   ├── shelf.glb              ← Kệ hàng MỚI
│   │   ├── shelf_large.glb        ← (tùy chọn)
│   │   └── pallet.glb             ← (tùy chọn)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.jsx                    ← File chính (đã cập nhật)
│   ├── components/
│   │   └── 3d/
│   │       ├── ShelfModel.jsx     ← Component MỚI
│   │       ├── Scene.jsx
│   │       └── Warehouse.jsx
│   └── ...
```

---

## 🔧 BƯỚC 3: TẠO COMPONENT SHELFMODEL

File `frontend/src/components/3d/ShelfModel.jsx` đã được tạo sẵn.
Component này cho phép:

- ✅ Load mô hình GLB từ Spline
- ✅ Tùy chỉnh scale, rotation cho từng khối hàng
- ✅ Fallback về hộp đơn giản nếu chưa có file GLB
- ✅ Tự động sắp xếp kệ theo grid

### Cách sử dụng trong App.jsx

```jsx
import ShelfModel from './components/3d/ShelfModel';

// Trong Canvas 3D:

{/* Dùng mô hình GLB cho kệ hàng */}
<ShelfModel
  modelPath="/models/shelf.glb"
  position={[x, 0, z]}
  scale={[1, 1, 1]}
  rotation={[0, 0, 0]}
/>

{/* Hoặc dùng hộp đơn giản (fallback) */}
<ShelfModel
  position={[x, 0.5, z]}
  scale={[0.9, 1, 0.9]}
/>
```

---

## ⚙️ BƯỚC 4: CẤU HÌNH TRONG APP.JSX

### 4.1 Cấu hình cho từng khối hàng

Trong file `App.jsx`, có sẵn object `ZONE_CONFIGS` để tùy chỉnh từng khu vực:

```jsx
const ZONE_CONFIGS = {
  // KHO 1: Góc trên-trái (row 2-5, col 2-6)
  zone1: {
    modelPath: '/models/shelf.glb',     // Đường dẫn file GLB
    scale: [0.5, 0.5, 0.5],             // Kích thước (điều chỉnh cho phù hợp)
    rotation: [0, 0, 0],                // Xoay [x, y, z] (radian)
    yOffset: 0,                         // Độ cao so với sàn
    rowRange: [2, 5],                   // Phạm vi hàng
    colRange: [2, 6],                   // Phạm vi cột
  },
  // KHO 2: Góc trên-phải
  zone2: {
    modelPath: '/models/shelf.glb',
    scale: [0.5, 0.5, 0.5],
    rotation: [0, Math.PI / 2, 0],      // Xoay 90° nếu cần
    yOffset: 0,
    rowRange: [2, 4],
    colRange: [22, 27],
  },
  // KHO 3: Góc dưới-trái
  zone3: { ... },
  // KHO 4: Góc dưới-phải
  zone4: { ... },
};
```

### 4.2 Cách điều chỉnh Scale

Mô hình từ Spline có thể quá lớn hoặc quá nhỏ. Cách chỉnh:

```jsx
// Thử các giá trị scale khác nhau
scale={[0.01, 0.01, 0.01]}    // Nếu mô hình rất lớn
scale={[0.1, 0.1, 0.1]}       // Nếu mô hình lớn vừa
scale={[0.5, 0.5, 0.5]}       // Nếu mô hình gần đúng
scale={[1, 1, 1]}              // Kích thước gốc
scale={[2, 2, 2]}              // Nếu mô hình quá nhỏ
```

> [!TIP]
> **Mẹo**: Bắt đầu với `scale={[0.01, 0.01, 0.01]}` rồi tăng dần
> cho đến khi mô hình vừa 1 ô trong grid (1 đơn vị = 1 ô).

### 4.3 Cách điều chỉnh Rotation

```jsx
// Các giá trị rotation phổ biến (đơn vị: radian)
rotation={[0, 0, 0]}                    // Không xoay
rotation={[0, Math.PI / 2, 0]}          // Xoay 90° theo trục Y
rotation={[0, Math.PI, 0]}              // Xoay 180° theo trục Y
rotation={[0, -Math.PI / 2, 0]}         // Xoay -90° theo trục Y
```

---

## 🎯 BƯỚC 5: KIỂM TRA VÀ TINH CHỈNH

### 5.1 Chạy dự án
```bash
cd frontend
npm run dev
```

### 5.2 Checklist kiểm tra
- [ ] File GLB đã được copy vào `frontend/public/models/`
- [ ] Mô hình hiển thị đúng vị trí trên bản đồ
- [ ] Scale phù hợp (1 ô grid ≈ 1 đơn vị)
- [ ] Rotation đúng hướng
- [ ] AGV có thể đi vòng quanh các khối hàng
- [ ] Không bị lag khi render nhiều mô hình

### 5.3 Xử lý sự cố

| Vấn đề | Nguyên nhân | Giải pháp |
|--------|-------------|-----------|
| Mô hình không hiển thị | Sai đường dẫn file | Kiểm tra path trong DevTools Network tab |
| Mô hình quá lớn/nhỏ | Scale chưa đúng | Điều chỉnh `scale` trong `ZONE_CONFIGS` |
| Mô hình bị đen | Thiếu ánh sáng | Thêm `ambientLight` hoặc `directionalLight` |
| Mô hình hướng sai | Rotation chưa đúng | Thử các giá trị `rotation` khác nhau |
| Lag/giật | File GLB quá nặng | Giảm dung lượng khi export từ Spline |
| Texture bị mất | Chưa embed texture | Export lại với "Embed Textures" bật |

---

## 🔄 BƯỚC 6: SỬ DỤNG NHIỀU MÔ HÌNH KHÁC NHAU

Bạn có thể dùng mô hình khác nhau cho từng khu vực:

```jsx
const ZONE_CONFIGS = {
  zone1: { modelPath: '/models/shelf_metal.glb', ... },    // Kệ sắt
  zone2: { modelPath: '/models/shelf_wood.glb', ... },     // Kệ gỗ
  zone3: { modelPath: '/models/pallet_stack.glb', ... },   // Pallet chồng
  zone4: { modelPath: '/models/shelf_heavy.glb', ... },    // Kệ hàng nặng
};
```

---

## 📝 TÓM TẮT QUY TRÌNH NHANH

```mermaid
graph LR
    A[Tạo mô hình<br/>trong Spline] --> B[Export GLB]
    B --> C[Copy vào<br/>public/models/]
    C --> D[Cấu hình<br/>ZONE_CONFIGS]
    D --> E[Chỉnh scale<br/>& rotation]
    E --> F[Kiểm tra<br/>& hoàn tất]
```

### Lệnh nhanh:
```bash
# 1. Tạo thư mục
mkdir frontend/public/models

# 2. Copy file GLB (thay bằng đường dẫn thực tế)
copy "C:\Users\LENOVO\Downloads\shelf.glb" "frontend\public\models\shelf.glb"

# 3. Chạy dự án
cd frontend && npm run dev
```

---

## 🔗 TÀI NGUYÊN THAM KHẢO

- [Spline - Export Guide](https://docs.spline.design/doc/export)
- [React Three Fiber - useGLTF](https://docs.pmnd.rs/drei/loaders/gltf)
- [GLTF Viewer Online](https://gltf-viewer.donmccurdy.com/) — Xem trước file GLB
- [GLB Optimizer](https://gltf.report/) — Tối ưu dung lượng file GLB
