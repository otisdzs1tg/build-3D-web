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

    // ═══════════════════════════════════════════
    // TẠO BẢN ĐỒ VỚI VÙNG ĐỆM (Buffer Zone)
    // Mở rộng vật cản thêm 1 ô xung quanh để xe không đi sát
    // ═══════════════════════════════════════════
    const BUFFER = 1; // Số ô đệm quanh vật cản
    const bufferedMatrix = matrix.map(row => [...row]); // Clone matrix

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === 1) {
          // Đánh dấu các ô xung quanh (8 hướng) là vùng đệm (giá trị 2)
          for (let dr = -BUFFER; dr <= BUFFER; dr++) {
            for (let dc = -BUFFER; dc <= BUFFER; dc++) {
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && bufferedMatrix[nr][nc] === 0) {
                bufferedMatrix[nr][nc] = 2; // 2 = vùng đệm (không đi được)
              }
            }
          }
        }
      }
    }

    // Đảm bảo điểm xuất phát và đích đến vẫn đi được (mở khóa nếu bị buffer)
    bufferedMatrix[start.y][start.x] = 0;
    bufferedMatrix[end.y][end.x] = 0;

    // ═══════════════════════════════════════════
    // BFS TÌM ĐƯỜNG — Thử bản đồ có buffer trước
    // ═══════════════════════════════════════════
    function bfs(grid, startPos, endPos) {
      const queue = [[startPos]];
      const visited = new Set();
      visited.add(`${startPos.x},${startPos.y}`);

      const directions = [
        { x: 0, y: -1 }, 
        { x: 0, y: 1 },  
        { x: -1, y: 0 }, 
        { x: 1, y: 0 }   
      ];

      while (queue.length > 0) {
        const path = queue.shift();
        const current = path[path.length - 1];

        if (current.x === endPos.x && current.y === endPos.y) {
          return path;
        }

        for (const dir of directions) {
          const nx = current.x + dir.x;
          const ny = current.y + dir.y;

          if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && grid[ny][nx] === 0) {
            const key = `${nx},${ny}`;
            if (!visited.has(key)) {
              visited.add(key);
              queue.push([...path, { x: nx, y: ny }]);
            }
          }
        }
      }
      return null;
    }

    // Thử tìm đường với bản đồ có buffer trước
    let finalPath = bfs(bufferedMatrix, start, end);

    // Nếu không tìm được (bị kẹt do buffer quá chặt) → fallback dùng bản đồ gốc
    if (!finalPath) {
      console.log('⚠ Không tìm được đường với buffer, thử bản đồ gốc...');
      finalPath = bfs(matrix, start, end);
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