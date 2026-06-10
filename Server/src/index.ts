import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import scoresRouter from './routes/scores';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Inicializar database
initDatabase();

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Rotas
app.use('/api', scoresRouter);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   RIFT Backend rodando!                ║
║   🚀 http://localhost:${PORT}           ║
║   📝 POST /api/scores — salvar score    ║
║   📊 GET /api/scores — listar top 10    ║
║   🤖 POST /api/ai-comment — N8N        ║
╚════════════════════════════════════════╝
  `);
});

export default app;
