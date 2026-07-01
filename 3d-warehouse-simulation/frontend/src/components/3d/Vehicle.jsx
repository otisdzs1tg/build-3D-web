import React, { useRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';
import { gridTo3D } from '../../utils/mapping';
import socket from '../../sockets/socketClient'; // Import Socket

export default function Vehicle() {
  const { scene } = useGLTF('/models/xe.glb'); 
  const vehicleRef = useRef();
  
  const currentPath = useStore((state) => state.currentPath);
  const gridSize = useStore((state) => state.gridSize);
  const stopMoving = useStore((state) => state.stopMoving);

  const targetVec = useRef(new THREE.Vector3()); 
  const pathIndex = useRef(0);
  
  // Biến lưu thời gian để giới hạn việc gửi Socket
  const lastEmitTime = useRef(0); 

  useEffect(() => {
    if (currentPath.length > 0 && vehicleRef.current) {
      pathIndex.current = 1; 
      const nextNode = currentPath[pathIndex.current];
      if (nextNode) {
        const [x, y, z] = gridTo3D(nextNode.row, nextNode.col, gridSize.rows, gridSize.cols);
        targetVec.current.set(x, y, z);
      }
    }
  }, [currentPath, gridSize]);

  useFrame((state, delta) => {
    if (!vehicleRef.current || currentPath.length === 0 || pathIndex.current >= currentPath.length) {
      return; 
    }

    const vehicle = vehicleRef.current;
    const SPEED = 8; 
    let distanceLeftThisFrame = SPEED * delta; 

    // === TOÁN HỌC XOAY & DI CHUYỂN (Giữ nguyên code siêu mượt cũ) ===
    const targetRotation = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(vehicle.position, targetVec.current, vehicle.up)
    );
    vehicle.quaternion.slerp(targetRotation, 12 * delta); 

    while (distanceLeftThisFrame > 0) {
      const distanceToTarget = vehicle.position.distanceTo(targetVec.current);
      if (distanceLeftThisFrame >= distanceToTarget) {
        vehicle.position.copy(targetVec.current);  
        distanceLeftThisFrame -= distanceToTarget; 
        pathIndex.current++; 
        
        if (pathIndex.current >= currentPath.length) {
          stopMoving();
          break;
        } else {
          const nextNode = currentPath[pathIndex.current];
          const [x, y, z] = gridTo3D(nextNode.row, nextNode.col, gridSize.rows, gridSize.cols);
          targetVec.current.set(x, y, z);
        }
      } else {
        const direction = new THREE.Vector3().subVectors(targetVec.current, vehicle.position).normalize();
        vehicle.position.add(direction.multiplyScalar(distanceLeftThisFrame));
        distanceLeftThisFrame = 0; 
      }
    }

    // === LOGIC PHÁT SÓNG SOCKET (THÊM MỚI) ===
    const currentTime = Date.now();
    // Chỉ gửi dữ liệu nếu đã trôi qua ít nhất 100ms (10 lần/giây)
    if (currentTime - lastEmitTime.current > 100) {
      socket.emit('agv-moving', {
        id: 'AGV-001',
        position: {
          x: vehicle.position.x,
          y: vehicle.position.y,
          z: vehicle.position.z
        },
        rotation: vehicle.rotation.y // Gửi cả hướng xoay nếu muốn màn hình khác thấy xe đang quay đầu
      });
      lastEmitTime.current = currentTime; // Cập nhật lại mốc thời gian
    }
  });

  return (
    <primitive ref={vehicleRef} object={scene} scale={1} position={new THREE.Vector3(...gridTo3D(0, 0, 20, 20))} />
  );
}