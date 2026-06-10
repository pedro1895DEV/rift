import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../rift.db');
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Criar tabela de scores se não existir
export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playerName TEXT NOT NULL,
      score INTEGER NOT NULL,
      completedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log(`✓ Database initialized at ${dbPath}`);
}

// Salvar score
export function saveScore(playerName: string, score: number): { id: number; playerName: string; score: number; completedAt: string } {
  const stmt = db.prepare(`
    INSERT INTO scores (playerName, score)
    VALUES (?, ?)
  `);
  const result = stmt.run(playerName, score);

  // Recuperar o score inserido
  const select = db.prepare(`
    SELECT id, playerName, score, completedAt FROM scores WHERE id = ?
  `);
  const row = select.get(result.lastInsertRowid) as any;
  return row;
}

// Buscar top 10 scores
export function getTopScores(limit: number = 10): Array<{ id: number; playerName: string; score: number; completedAt: string }> {
  const stmt = db.prepare(`
    SELECT id, playerName, score, completedAt FROM scores
    ORDER BY score DESC
    LIMIT ?
  `);
  return stmt.all(limit) as Array<{ id: number; playerName: string; score: number; completedAt: string }>;
}

// Buscar todos os scores (para debug)
export function getAllScores(): Array<{ id: number; playerName: string; score: number; completedAt: string }> {
  const stmt = db.prepare(`SELECT id, playerName, score, completedAt FROM scores ORDER BY score DESC`);
  return stmt.all() as Array<{ id: number; playerName: string; score: number; completedAt: string }>;
}

export default db;
