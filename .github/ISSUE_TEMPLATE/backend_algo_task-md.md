---
name: backend_algo_task.md
about: Là người thiết kế hệ thống, các task liên quan đến luồng dữ liệu Node.js, cấu
  trúc bảng hay thuật toán tìm đường cần được định nghĩa đầu vào/đầu ra cực kỳ khắt
  khe.
title: ''
labels: algorithm, backend, database
assignees: ''

---

---
name: ⚙️ Backend / Database / Algorithm
about: Giao task liên quan đến API, xử lý Database hoặc Thuật toán A*
title: '[BE/ALGO] - '
labels: 'module: backend, module: algorithm'
assignees: ''
---

### 🎯 Mục tiêu chính
[Mô tả logic cần xử lý. Ví dụ: Thiết kế schema quản lý các tuyến đường (routes), viết trigger cập nhật trạng thái kho, hoặc triển khai tính toán heuristic cho A* dựa trên lưới ma trận.]

### ✅ Checklist công việc
- [ ] Định nghĩa cấu trúc dữ liệu / Schema (nếu có).
- [ ] Viết logic xử lý (Controller / Algorithm helper).
- [ ] Viết API Endpoint và format JSON trả về đúng chuẩn.
- [ ] Xử lý bắt lỗi (Try/Catch, validation dữ liệu đầu vào).

### 📡 API Specification (Nếu task làm API)
- **Endpoint:** `GET /api/...`
- **Params / Body mong đợi:** `{ "startPoint": { "x": 0, "y": 0 }, ... }`
- **Response thành công:** `200 OK` (Đính kèm mẫu JSON trả về)
- **Response thất bại:** `400 Bad Request` hoặc `500 Internal Error`

### 🧠 Yêu cầu kỹ thuật / Thuật toán
- [Ghi rõ ràng yêu cầu. VD: Thuật toán cần trả về mảng các tọa độ [x,y] từ điểm xuất phát đến đích, tránh đi xuyên tường (giá trị node = 1).]

### 🔗 Tài liệu đính kèm
- Link Database Schema Diagram:
