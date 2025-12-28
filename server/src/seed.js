import 'dotenv/config';
import { connectMongo } from './lib/mongo.js';
import { Article } from './models/Article.js';
import { Deposit } from './models/Deposit.js';

await connectMongo();

const articles = [
  { codigo: 'MAIZ', nombre: 'Maíz', descripcion: 'Maíz grano', aliases: ['maiz', 'maíz'] },
  { codigo: 'SOJA', nombre: 'Soja', descripcion: 'Soja grano', aliases: ['soya'] },
];

const deposits = [
  { codigo: 'CASA_CENTRAL', nombre: 'Casa Central', descripcion: 'Depósito principal', aliases: ['central', 'casa central'] },
  { codigo: 'NORTE', nombre: 'Norte', descripcion: 'Depósito norte', aliases: ['depósito norte'] },
  { codigo: 'SUR', nombre: 'Sur', descripcion: 'Depósito sur', aliases: [] },
];

await Article.deleteMany({});
await Deposit.deleteMany({});

await Article.insertMany(articles);
await Deposit.insertMany(deposits);

console.log('Seed OK');
process.exit(0);
