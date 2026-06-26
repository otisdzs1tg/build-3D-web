// Scene.jsx
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Warehouse from './Warehouse';
import Vehicle from './Vehicle';

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 20, 30], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1} />
      <Environment preset="city" />
      
      <Warehouse />
      <Vehicle />
      
      <OrbitControls makeDefault />
    </Canvas>
  );
}