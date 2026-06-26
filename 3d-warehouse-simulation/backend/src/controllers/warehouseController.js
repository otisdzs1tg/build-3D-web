import Warehouse from '../models/Warehouse.js';

// 1. Hàm tạo dữ liệu mẫu (Seed Data)
export const seedWarehouse = async (req, res) => {
  try {
    // Xóa dữ liệu cũ để tránh lỗi trùng lặp khi test nhiều lần
    await Warehouse.deleteMany(); 

    const demoWarehouse = new Warehouse({
      warehouseId: "WH-DEMO-01",
      gridWidth: 5,
      gridHeight: 5,
      matrix: [
        [0, 0, 0, 0, 0],
        [0, 1, 1, 0, 0], // Số 1 đại diện cho kệ hàng/vật cản
        [0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0],
        [0, 0, 0, 0, 0]
      ]
    });
    
    await demoWarehouse.save();
    res.status(201).json({ 
        message: "🎉 Đã tạo ma trận Kho mẫu thành công!", 
        data: demoWarehouse 
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi tạo dữ liệu", error: error.message });
  }
};

// 2. Hàm lấy thông tin kho hàng để hiển thị lên 3D
export const getWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findOne({ warehouseId: "WH-DEMO-01" });
    if (!warehouse) return res.status(404).json({ message: "Không tìm thấy kho hàng" });
    
    res.status(200).json(warehouse);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};