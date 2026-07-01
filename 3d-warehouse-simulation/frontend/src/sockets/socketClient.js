import { io } from 'socket.io-client';

// ═══════════════════════════════════════════
// SOCKET CLIENT — Kết nối WebSocket tới Backend
// ═══════════════════════════════════════════

const BACKEND_URL = 'http://localhost:5000';

const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

// ═══ Trạng thái kết nối ═══
socket.on('connect', () => {
  console.log('✅ [WebSocket] Đã kết nối Backend:', socket.id);
  
  // Tự đăng ký AGV khi kết nối
  socket.emit('agv-register', {
    id: 'AGV-001',
    position: { x: 0, y: 0.25, z: 0 },
    battery: 100,
  });
});

socket.on('disconnect', (reason) => {
  console.log('🔌 [WebSocket] Ngắt kết nối:', reason);
});

socket.on('connect_error', (error) => {
  console.warn('⚠ [WebSocket] Lỗi kết nối:', error.message);
});

socket.on('reconnect', (attemptNumber) => {
  console.log(`🔄 [WebSocket] Kết nối lại thành công (lần ${attemptNumber})`);
});

// ═══ Nhận cập nhật từ server ═══
socket.on('agv-update', (data) => {
  // Log hoặc xử lý cập nhật từ xe khác
  console.log(`📡 [AGV Update] ${data.id}: ${data.status}`, data.position);
});

socket.on('agv-list', (agvList) => {
  console.log(`📋 [AGV List] ${agvList.length} xe trong hệ thống:`, agvList);
});

socket.on('mission-assigned', (data) => {
  console.log(`📋 [Mission] AGV ${data.agvId}: (${data.start.x},${data.start.y}) ➜ (${data.end.x},${data.end.y})`);
});

socket.on('emergency-stop-activated', (data) => {
  console.log(`🚨 [EMERGENCY] Dừng khẩn cấp: ${data.agvId}`);
});

export default socket;