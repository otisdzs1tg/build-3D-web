import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Cấu hình để đọc được dữ liệu từ file .env
dotenv.config();

const connectDB = async (retries = 5) => {
  for (let i = 1; i <= retries; i++) {
    try {
      // Thực hiện kết nối tới MongoDB với các options tối ưu
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 10000, // Timeout 10s
        socketTimeoutMS: 45000,
        family: 4, // Force IPv4 — tránh lỗi IPv6 DNS
      });
      console.log(`✅ Kết nối MongoDB thành công: ${conn.connection.host}`);
      return; // Kết nối thành công, thoát hàm
    } catch (error) {
      console.error(`❌ Lần ${i}/${retries} — Lỗi kết nối Database: ${error.message}`);
      if (i < retries) {
        console.log(`⏳ Thử lại sau 3 giây...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.error(`🚨 Không thể kết nối MongoDB sau ${retries} lần thử. Server vẫn chạy nhưng DB không khả dụng.`);
        // KHÔNG gọi process.exit(1) — để server vẫn chạy và thử kết nối lại khi có request
      }
    }
  }
};

export default connectDB;