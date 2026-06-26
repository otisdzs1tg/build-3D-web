// Thuật toán tìm đường đi ngắn nhất trên ma trận lưới 2D
export const dijkstra2D = (matrix, start, end) => {
  const rows = matrix.length;
  const cols = matrix[0].length;
  
  // Hàng đợi duyệt các ô
  const queue = [start];
  
  // Đánh dấu ô đã đi qua
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  visited[start.row][start.col] = true;
  
  // Lưu vết để truy ngược đường đi
  const parent = Array.from({ length: rows }, () => Array(cols).fill(null));
  
  // 4 hướng di chuyển: Lên, Xuống, Trái, Phải
  const directions = [
    { row: -1, col: 0 }, 
    { row: 1, col: 0 },  
    { row: 0, col: -1 }, 
    { row: 0, col: 1 }   
  ];
  
  let found = false;
  
  while (queue.length > 0) {
    const current = queue.shift(); 
    
    // Đã chạm đích
    if (current.row === end.row && current.col === end.col) {
      found = true;
      break;
    }
    
    // Duyệt 4 hướng
    for (const dir of directions) {
      const nRow = current.row + dir.row;
      const nCol = current.col + dir.col;
      
      // Kiểm tra hợp lệ: Không ra ngoài map, không đâm vào kệ (1), chưa từng đi qua
      if (
        nRow >= 0 && nRow < rows && 
        nCol >= 0 && nCol < cols && 
        matrix[nRow][nCol] === 0 && 
        !visited[nRow][nCol]
      ) {
        visited[nRow][nCol] = true;
        parent[nRow][nCol] = current; 
        queue.push({ row: nRow, col: nCol }); 
      }
    }
  }
  
  if (!found) return null;
  
  // Truy vết ngược từ Đích về Đầu
  const path = [];
  let curr = end;
  while (curr !== null) {
    path.push(curr);
    curr = parent[curr.row][curr.col];
  }
  
  return path.reverse(); 
};

// Thuật toán nén đường thẳng (Giữ lại các góc cua)
export const simplifyPath = (path) => {
  if (!path || path.length <= 2) return path;

  const simplified = [path[0]];
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    const dir1Row = curr.row - prev.row;
    const dir1Col = curr.col - prev.col;
    const dir2Row = next.row - curr.row;
    const dir2Col = next.col - curr.col;

    // Nếu hướng đi thay đổi (nghĩa là xe phải rẽ), ta lưu lại điểm đó
    if (dir1Row !== dir2Row || dir1Col !== dir2Col) {
      simplified.push(curr);
    }
  }
  simplified.push(path[path.length - 1]);
  return simplified;
};