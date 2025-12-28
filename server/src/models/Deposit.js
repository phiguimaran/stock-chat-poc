import mongoose from 'mongoose';

const DepositSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, index: true },
  nombre: { type: String, required: true, index: true },
  descripcion: { type: String, default: '' },
  aliases: { type: [String], default: [], index: true },
}, { timestamps: true });

export const Deposit = mongoose.model('Deposit', DepositSchema);
