import { create } from 'zustand';
import axios from 'axios'; // Thêm axios

export const useStore = create((set) => ({
  gridSize: { rows: 20, cols: 20 },
  agvPos2D: { row: 0, col: 0 }, 
  currentPath: [],              
  isMoving: false,              

  setAgvPos2D: (pos) => set({ agvPos2D: pos }),
  stopMoving: () => set({ isMoving: false, currentPath: [] }),

  // HÀM MỚI: Gọi API lên Backend xin đường đi
  fetchPathFromBackend: async (startNode, endNode) => {
    try {
      // Giả sử API của bạn ở backend là POST /api/route
      const response = await axios.post('http://localhost:5000/api/route', {
        start: startNode,
        end: endNode
      });

      if (response.data.success) {
        // Lấy mảng đường đi siêu mượt từ Backend trả về và cho xe chạy
        set({ currentPath: response.data.data, isMoving: true });
        console.log("🗺️ Đã nhận lộ trình từ Server:", response.data.data);
      }
    } catch (error) {
      console.error("❌ Lỗi lấy đường đi từ Backend:", error);
      alert("Không thể kết nối đến máy chủ điều phối!");
    }
  }
}));