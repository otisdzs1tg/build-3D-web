import express from 'express';
import { seedWarehouse, getWarehouse } from '../controllers/warehouseController.js';

const router = express.Router();

// Dùng phương thức GET cho nút /seed để bạn dễ test trực tiếp trên trình duyệt
router.get('/seed', seedWarehouse);

// API lấy dữ liệu kho hàng
router.get('/', getWarehouse);

export default router;