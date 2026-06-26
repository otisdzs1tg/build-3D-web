export const simplifyPath = (path) => {
  // Nếu đường đi chỉ có 1 hoặc 2 điểm (ví dụ sát vách) thì không cần nén
  if (!path || path.length <= 2) return path;

  const simplified = [path[0]]; // Mảng mới: Bắt buộc giữ lại điểm xuất phát
  
  // Chạy vòng lặp từ điểm thứ 2 đến điểm áp chót
  for (let i = 1; i < path.length - 1; i++) {
    const prev = path[i - 1];
    const curr = path[i];
    const next = path[i + 1];

    // Tính vector hướng đi (Delta X, Delta Y) của 2 đoạn
    // Ví dụ: Đi ngang thì dirRow = 0, dirCol = 1
    const dir1Row = curr.row - prev.row;
    const dir1Col = curr.col - prev.col;
    
    const dir2Row = next.row - curr.row;
    const dir2Col = next.col - curr.col;

    // So sánh: Nếu hướng thay đổi -> Đây là góc cua -> Giữ lại điểm này
    if (dir1Row !== dir2Row || dir1Col !== dir2Col) {
      simplified.push(curr);
    }
  }
  
  simplified.push(path[path.length - 1]); // Bắt buộc giữ lại điểm đích
  
  console.log("Đường đi thô:", path.length, "điểm");
  console.log("Đường đi sau khi nén:", simplified.length, "điểm");
  
  return simplified;
};