import express from 'express';
import Warehouse from '../models/Warehouse.js'; // Bắt buộc phải có đuôi .js

const router = express.Router();

router.post('/calculate', async (req, res) => {
  try {
    const { start, end } = req.body;

    const warehouse = await Warehouse.findOne();
    if (!warehouse) {
      return res.status(404).json({ message: "Không tìm thấy dữ liệu nhà kho!" });
    }
    
    const matrix = warehouse.matrix;
    
    const rows = matrix.length;       
    const cols = matrix[0].length;    

    if (
      start.x < 0 || start.x >= cols || start.y < 0 || start.y >= rows ||
      end.x < 0 || end.x >= cols || end.y < 0 || end.y >= rows
    ) {
      return res.status(400).json({ message: "Tọa độ nằm ngoài bản đồ!" });
    }

    if (matrix[start.y][start.x] === 1 || matrix[end.y][end.x] === 1) {
      return res.status(400).json({ message: "Điểm xuất phát/đích đến đang bị kệ hàng chiếm chỗ!" });
    }

    const queue = [[start]];
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);

    const directions = [
      { x: 0, y: -1 }, 
      { x: 0, y: 1 },  
      { x: -1, y: 0 }, 
      { x: 1, y: 0 }   
    ];

    let finalPath = null;

    while (queue.length > 0) {
      const path = queue.shift();
      const current = path[path.length - 1];

      if (current.x === end.x && current.y === end.y) {
        finalPath = path;
        break;
      }

      for (const dir of directions) {
        const nx = current.x + dir.x;
        const ny = current.y + dir.y;

        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && matrix[ny][nx] === 0) {
          const key = `${nx},${ny}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push([...path, { x: nx, y: ny }]);
          }
        }
      }
    }

    if (!finalPath) {
      return res.status(400).json({ message: "Không có đường đi nào tới đích (Xe bị kẹt)!" });
    }

    res.json({ path: finalPath });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi máy chủ: " + error.message });
  }
});

export default router;