import Warehouse from '../models/Warehouse.js';
import { dijkstra2D, simplifyPath } from '../services/navigationService.js'; 

export const calculateAGVRoute = async (req, res) => {
  try {
    // Frontend bắn lên dạng: { start: {row: 0, col: 0}, end: {row: 29, col: 29} }
    const { start, end } = req.body; 

    // 1. Kiểm tra đầu vào
    if (!start || !end || start.row === undefined || start.col === undefined) {
      return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ tọa độ {row, col} cho điểm xuất phát và đích!" });
    }

    // 2. Lấy cấu hình ma trận kho hàng từ Database
    const warehouse = await Warehouse.findOne({ warehouseId: "WH-DEMO-01" });
    if (!warehouse) {
      return res.status(404).json({ success: false, message: "Không tìm thấy dữ liệu cấu hình kho hàng!" });
    }

    // Bảo vệ: Kiểm tra xem user có click nhầm điểm xuất phát/đích vào trúng kệ hàng không
    if (warehouse.matrix[start.row][start.col] === 1 || warehouse.matrix[end.row][end.col] === 1) {
       return res.status(400).json({ success: false, message: "Điểm xuất phát hoặc đích đến đang bị kệ hàng chiếm chỗ!" });
    }

    // 3. Chạy thuật toán tìm đường đi thô
    const rawPath = dijkstra2D(warehouse.matrix, start, end);

    if (!rawPath) {
      return res.status(400).json({ success: false, message: "🚨 Bị kẹt! Không có đường đi khả thi nào giữa 2 điểm này." });
    }

    // 4. Ép mảng qua hàm nén để tạo đường đi mượt mà cho 3D
    const cleanPath = simplifyPath(rawPath);

    // 5. Trả kết quả về Frontend
    res.status(200).json({
      success: true,
      message: "🚀 Đã vạch đường đi ngắn nhất thành công cho xe AGV!",
      stepsCount: cleanPath.length - 1, 
      data: cleanPath 
    });

  } catch (error) {
    console.error("Lỗi khi tính toán đường đi:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi tính toán đường đi", error: error.message });
  }
};