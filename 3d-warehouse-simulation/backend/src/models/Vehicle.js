import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['idle', 'moving', 'error'], // Chỉ nhận 1 trong 3 trạng thái này
    default: 'idle' 
  },
  currentPosition: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  batteryLevel: { type: Number, default: 100 }
}, { timestamps: true });

export default mongoose.model('Vehicle', vehicleSchema);