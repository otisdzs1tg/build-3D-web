import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  warehouseId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  gridWidth: { type: Number, required: true },
  gridHeight: { type: Number, required: true },
  matrix: [[Number]] 
}, { 
  timestamps: true 
});

export default mongoose.model('Warehouse', warehouseSchema);