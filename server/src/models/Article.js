import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, index: true },
  nombre: { type: String, required: true, index: true },
  descripcion: { type: String, default: '' },
  aliases: { type: [String], default: [], index: true },
}, { timestamps: true });

export const Article = mongoose.model('Article', ArticleSchema);
