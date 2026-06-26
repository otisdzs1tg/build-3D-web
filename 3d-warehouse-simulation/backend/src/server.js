import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http'; // BẮT BUỘC 1: Thư viện HTTP lõi của Node.js
import { Server } from 'socket.io'; // BẮT BUỘC 2: Thư viện WebSockets

import connectDB from './config/db.js';
import routeRoutes from './routes/routeRoutes.js';
import warehouseRoutes from './routes/warehouseRoutes.js';
import Warehouse from './models/Warehouse.js'; // Bắt buộc phải có đuôi .js
import { socketHandler } from './sockets/socketHandler.js'; // Nhập "bộ đàm" của bạn

dotenv.config();

const app = express();
const server = http.createServer(app); // BẮT BUỘC 3: Tạo server HTTP từ Express

app.use(cors({
  origin: 'http://localhost:5173', // Chỉ định rõ nguồn Frontend Vite
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.use('/api/warehouse', warehouseRoutes);
app.use('/api/route', routeRoutes);

connectDB();

app.get('/api/status', (req, res) => {
  res.json({ message: 'Server dự án thông minh đang vận hành tốt!' });
});

// Phép thuật tạo Map 30x30 với nhiều vật cản phức tạp
app.get('/api/seed30x30', async (req, res) => {
  try {
    let m = Array(30).fill().map(() => Array(30).fill(0));

    // ═══════════════════════════════════════════
    // KHU VỰC KHO HÀNG 1 (góc trên-trái) — 4 hàng kệ
    // ═══════════════════════════════════════════
    for (let row = 2; row <= 5; row++) {
      for (let col = 2; col <= 6; col++) {
        m[row][col] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // KHU VỰC KHO HÀNG 2 (góc trên-phải) — 3 hàng kệ
    // ═══════════════════════════════════════════
    for (let row = 2; row <= 4; row++) {
      for (let col = 22; col <= 27; col++) {
        m[row][col] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // KHU VỰC KHO HÀNG 3 (góc dưới-trái) — 3 hàng kệ
    // ═══════════════════════════════════════════
    for (let row = 24; row <= 27; row++) {
      for (let col = 1; col <= 5; col++) {
        m[row][col] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // KHU VỰC KHO HÀNG 4 (góc dưới-phải) — 4 hàng kệ
    // ═══════════════════════════════════════════
    for (let row = 25; row <= 28; row++) {
      for (let col = 23; col <= 28; col++) {
        m[row][col] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // TƯỜNG NGANG 1 (hàng 10) — có 2 lối đi ở cột 4 và cột 20
    // ═══════════════════════════════════════════
    for (let col = 0; col < 30; col++) {
      if (col !== 4 && col !== 20 && col !== 21) {
        m[10][col] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // TƯỜNG NGANG 2 (hàng 20) — có 2 lối đi ở cột 8 và cột 25
    // ═══════════════════════════════════════════
    for (let col = 0; col < 30; col++) {
      if (col !== 8 && col !== 9 && col !== 25) {
        m[20][col] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // TƯỜNG DỌC (cột 14, hàng 11-19) — chắn giữa, có lối đi ở hàng 15
    // ═══════════════════════════════════════════
    for (let row = 11; row <= 19; row++) {
      if (row !== 15) {
        m[row][14] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // KỆ HÀNG GIỮA — 2 cụm kệ ở khu vực trung tâm
    // ═══════════════════════════════════════════
    // Cụm kệ trái (hàng 12-13, cột 8-10)
    for (let row = 12; row <= 13; row++) {
      for (let col = 8; col <= 10; col++) {
        m[row][col] = 1;
      }
    }
    // Cụm kệ phải (hàng 12-13, cột 18-20)
    for (let row = 12; row <= 13; row++) {
      for (let col = 18; col <= 20; col++) {
        m[row][col] = 1;
      }
    }

    // ═══════════════════════════════════════════
    // CỘT TRỤ RẢI RÁC — tạo thêm thử thách cho pathfinding
    // ═══════════════════════════════════════════
    m[7][10] = 1; m[7][11] = 1;
    m[8][15] = 1; m[8][16] = 1;
    m[16][5] = 1; m[17][5] = 1;
    m[16][24] = 1; m[17][24] = 1;
    m[22][12] = 1; m[22][13] = 1;
    m[22][17] = 1; m[22][18] = 1;

    await Warehouse.deleteMany({});
    await Warehouse.create({
      warehouseId: "WH-DEMO-01",
      gridWidth: 30,
      gridHeight: 30,
      matrix: m
    });

    res.send("🎉 Đã tạo Map 30x30 với nhà kho phức tạp: 4 khu kệ hàng, 2 tường ngang, 1 tường dọc, cột trụ rải rác!");
  } catch (error) {
    res.status(500).send("🚨 Lỗi: " + error.message);
  }
});

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

socketHandler(io);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy thành công tại: http://localhost:${PORT}`);
});