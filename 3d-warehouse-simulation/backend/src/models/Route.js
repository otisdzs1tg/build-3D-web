import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  routeId: { type: String, required: true, unique: true },
  vehicleId: { type: String, required: true },
  
  startNode: { x: Number, y: Number },
  endNode: { x: Number, y: Number },
  
  // Mảng chứa các điểm tọa độ liên tiếp của đường đi (kết quả thuật toán)
  path: [{
    x: Number,
    y: Number
  }],
  
  distance: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  }
}, { timestamps: true });

export default mongoose.model('Route', routeSchema);