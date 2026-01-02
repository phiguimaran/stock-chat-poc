import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './lib/mongo.js';
import apiRouter from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// CORS sí puede ser global
app.use(cors());

// ⚠️ NO express.json global
// El parseo JSON se hace por-route en api.js

// Static (si lo usás)
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

app.get('/health', (_req, res) => res.json({ ok: true }));

// API
app.use('/api', apiRouter);

// Error handler al final
app.use(errorHandler);

const port = Number(process.env.PORT || 3001);

await connectMongo();

app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});

