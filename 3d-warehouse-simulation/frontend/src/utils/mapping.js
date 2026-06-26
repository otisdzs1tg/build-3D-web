export const CELL_SIZE = 2; // Kích thước 1 ô

export const gridTo3D = (row, col, maxRows = 20, maxCols = 20) => {
    const x = (col - maxCols / 2) * CELL_SIZE;
    const z = (row - maxRows / 2) * CELL_SIZE;
    return [x, 0, z]; 
};