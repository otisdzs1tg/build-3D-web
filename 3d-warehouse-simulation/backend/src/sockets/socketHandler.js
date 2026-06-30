// ═══════════════════════════════════════════
// SOCKET HANDLER — Bộ điều phối WebSocket cho hệ thống AGV
// ═══════════════════════════════════════════

// Lưu trạng thái AGV trong bộ nhớ
const agvStates = new Map();

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`📡 [Socket] Client kết nối: ${socket.id}`);

    // Gửi danh sách AGV hiện tại cho client mới
    socket.emit('agv-list', Array.from(agvStates.values()));

    // ═══════════════════════════════════════════
    // 1. AGV ĐĂNG KÝ — Khi xe mới tham gia hệ thống
    // ═══════════════════════════════════════════
    socket.on('agv-register', (data) => {
      const agv = {
        id: data.id || `AGV-${socket.id.substring(0, 6)}`,
        socketId: socket.id,
        status: 'idle', // idle | moving | charging | error
        position: data.position || { x: 0, y: 0, z: 0 },
        rotation: data.rotation || 0,
        battery: data.battery || 100,
        currentTask: null,
        lastUpdate: Date.now(),
      };
      agvStates.set(agv.id, agv);
      console.log(`🚜 [Socket] AGV đăng ký: ${agv.id}`);
      io.emit('agv-registered', agv);
    });

    // ═══════════════════════════════════════════
    // 2. AGV DI CHUYỂN — Cập nhật vị trí real-time
    // ═══════════════════════════════════════════
    socket.on('agv-moving', (data) => {
      const agvId = data.id || 'AGV-001';
      
      // Cập nhật state
      if (agvStates.has(agvId)) {
        const agv = agvStates.get(agvId);
        agv.position = data.position;
        agv.rotation = data.rotation;
        agv.status = 'moving';
        agv.lastUpdate = Date.now();
      } else {
        // Auto-register nếu chưa có
        agvStates.set(agvId, {
          id: agvId,
          socketId: socket.id,
          status: 'moving',
          position: data.position,
          rotation: data.rotation,
          battery: 100,
          currentTask: null,
          lastUpdate: Date.now(),
        });
      }

      // Phát lại cho TẤT CẢ client khác (multi-screen sync)
      socket.broadcast.emit('agv-update', {
        id: agvId,
        position: data.position,
        rotation: data.rotation,
        status: 'moving',
        timestamp: Date.now(),
      });
    });

    // ═══════════════════════════════════════════
    // 3. AGV DỪNG — Xe đã đến đích
    // ═══════════════════════════════════════════
    socket.on('agv-stopped', (data) => {
      const agvId = data.id || 'AGV-001';
      if (agvStates.has(agvId)) {
        const agv = agvStates.get(agvId);
        agv.status = 'idle';
        agv.lastUpdate = Date.now();
      }
      console.log(`🛑 [Socket] AGV dừng: ${agvId}`);
      io.emit('agv-update', {
        id: agvId,
        position: data.position,
        status: 'idle',
        timestamp: Date.now(),
      });
    });

    // ═══════════════════════════════════════════
    // 4. NHIỆM VỤ MỚI — Dispatch từ bảng điều khiển
    // ═══════════════════════════════════════════
    socket.on('dispatch-mission', (data) => {
      console.log(`📋 [Socket] Nhiệm vụ mới: AGV ${data.agvId} → (${data.start.x},${data.start.y}) ➜ (${data.end.x},${data.end.y})`);
      
      if (agvStates.has(data.agvId)) {
        const agv = agvStates.get(data.agvId);
        agv.currentTask = {
          start: data.start,
          end: data.end,
          createdAt: Date.now(),
        };
        agv.status = 'moving';
      }

      // Phát cho tất cả client để đồng bộ
      io.emit('mission-assigned', {
        agvId: data.agvId,
        start: data.start,
        end: data.end,
        timestamp: Date.now(),
      });
    });

    // ═══════════════════════════════════════════
    // 5. YÊU CẦU TRẠNG THÁI — Client hỏi tình hình
    // ═══════════════════════════════════════════
    socket.on('request-status', () => {
      socket.emit('agv-list', Array.from(agvStates.values()));
    });

    // ═══════════════════════════════════════════
    // 6. DỪNG KHẨN CẤP — Emergency stop
    // ═══════════════════════════════════════════
    socket.on('emergency-stop', (data) => {
      const agvId = data?.agvId;
      if (agvId && agvStates.has(agvId)) {
        agvStates.get(agvId).status = 'error';
        console.log(`🚨 [Socket] DỪNG KHẨN CẤP: ${agvId}`);
      } else {
        // Dừng tất cả xe
        agvStates.forEach((agv) => { agv.status = 'error'; });
        console.log(`🚨 [Socket] DỪNG KHẨN CẤP: TẤT CẢ XE`);
      }
      io.emit('emergency-stop-activated', { agvId: agvId || 'ALL', timestamp: Date.now() });
    });

    // ═══════════════════════════════════════════
    // 7. NGẮT KẾT NỐI
    // ═══════════════════════════════════════════
    socket.on('disconnect', () => {
      // Tìm và đánh dấu AGV offline (không xóa, chỉ đổi status)
      agvStates.forEach((agv) => {
        if (agv.socketId === socket.id) {
          agv.status = 'offline';
          console.log(`🔌 [Socket] AGV offline: ${agv.id}`);
        }
      });
      console.log(`🔌 [Socket] Client ngắt kết nối: ${socket.id}`);
    });
  });

  // ═══════════════════════════════════════════
  // HEARTBEAT — Kiểm tra xe còn sống không (mỗi 10 giây)
  // ═══════════════════════════════════════════
  setInterval(() => {
    const now = Date.now();
    agvStates.forEach((agv, id) => {
      // Nếu xe không cập nhật trong 30 giây → đánh dấu offline
      if (agv.status === 'moving' && now - agv.lastUpdate > 30000) {
        agv.status = 'offline';
        io.emit('agv-update', { id, status: 'offline', timestamp: now });
        console.log(`⚠ [Heartbeat] AGV timeout: ${id}`);
      }
    });
  }, 10000);
};

// Export để truy cập trạng thái AGV từ route/controller
export const getAGVStates = () => agvStates;