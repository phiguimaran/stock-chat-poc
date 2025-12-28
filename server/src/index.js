import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectMongo } from './lib/mongo.js';
import { apiRouter } from './routes/api.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' })); // texto + metadatos (audio va por multipart)
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', apiRouter);

app.use(errorHandler);

const port = Number(process.env.PORT || 3001);

await connectMongo();

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
