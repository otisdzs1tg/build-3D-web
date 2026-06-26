import React from 'react';
import { useStore } from '../../store/useStore';

export default function Dashboard() {
  const { isMoving, fetchPathFromBackend, agvPos2D } = useStore();

  const handleStart = () => {
    if (isMoving) return; 
    
    const startPos = agvPos2D;
    const endPos = { row: 15, col: 15 }; // Giả lập đích đến, sau này bạn nối với input UI
    
    // Gọi hàm fetch thay vì tự tính toán local
    fetchPathFromBackend(startPos, endPos); 
  };

  return (
    <div style={{
      position: 'absolute', top: 20, left: 20,
      background: 'rgba(0,0,0,0.8)', color: 'white',
      padding: '20px', borderRadius: '8px', pointerEvents: 'auto'
    }}>
      <h2>Bảng Điều Khiển</h2>
      <p>Trạng thái: <strong style={{ color: isMoving ? '#00ff00' : '#ffaa00' }}>
        {isMoving ? 'ĐANG CHẠY' : 'ĐANG DỪNG'}
      </strong></p>
      
      <button 
        onClick={handleStart}
        disabled={isMoving}
        style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}
      >
        Khởi động AGV
      </button>
    </div>
  );
}