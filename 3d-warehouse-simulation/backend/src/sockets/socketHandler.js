export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`📡 [Socket] Xe AGV / Client kết nối thành công: ${socket.id}`);

    // Lắng nghe tín hiệu xe di chuyển từ Frontend
    socket.on('agv-moving', (data) => {
      // Phát lại tọa độ cho TẤT CẢ các màn hình khác đang mở
      socket.broadcast.emit('agv-update', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 [Socket] Client ngắt kết nối: ${socket.id}`);
    });
  });
};