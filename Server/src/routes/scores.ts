import { Router, Request, Response } from 'express';
import axios from 'axios';
import { saveScore, getTopScores } from '../database';

const router = Router();

// POST /scores — salva um novo score
router.post('/scores', async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerName, score } = req.body;

    if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
      res.status(400).json({ error: 'playerName é obrigatório e deve ser uma string não vazia' });
      return;
    }

    if (!Number.isInteger(score) || score < 0) {
      res.status(400).json({ error: 'score é obrigatório e deve ser um número inteiro não negativo' });
      return;
    }

    const result = saveScore(playerName.trim(), score);
    res.status(201).json({
      message: 'Score salvo com sucesso',
      data: result
    });
  } catch (error) {
    console.error('Erro ao salvar score:', error);
    res.status(500).json({ error: 'Erro ao salvar score' });
  }
});

// GET /scores — retorna top 10 scores
router.get('/scores', (req: Request, res: Response): void => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
    const scores = getTopScores(Math.min(limit, 100)); // máximo 100
    res.status(200).json({
      count: scores.length,
      data: scores
    });
  } catch (error) {
    console.error('Erro ao buscar scores:', error);
    res.status(500).json({ error: 'Erro ao buscar scores' });
  }
});

// POST /ai-comment — envia dados ao N8N para gerar comentário personalizado
router.post('/ai-comment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerName, score } = req.body;

    if (!playerName || !score) {
      res.status(400).json({ error: 'playerName e score são obrigatórios' });
      return;
    }

    // URL do webhook N8N (configurar com a URL real)
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/rift-ai';

    const response = await axios.post(N8N_WEBHOOK_URL, {
      playerName,
      score,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      message: 'Comentário gerado com sucesso',
      data: response.data
    });
  } catch (error: any) {
    console.error('Erro ao gerar comentário via N8N:', error.message);
    
    // Se N8N não responder, retornar um comentário genérico (fallback)
    const { playerName, score } = req.body;
    const fallbackComment = `Parabéns ${playerName}! Você completou RIFT com um score de ${score}. Excelente jogo!`;
    
    res.status(200).json({
      message: 'Comentário (fallback)',
      data: {
        comment: fallbackComment,
        isGenerated: false,
        fallback: true
      }
    });
  }
});

export default router;
