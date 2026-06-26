import { io } from 'socket.io-client';

// Kết nối tới port 5000 của Backend Node.js
const socket = io('http://localhost:5000', {
  autoConnect: true, // Tự động kết nối khi mở web
});

socket.on('connect', () => {
  console.log('✅ Đã kết nối bộ đàm với Trung tâm điều phối (Backend)');
});

export default socket;