// ─── Dimension ───────────────────────────────────────────────────────────────

export enum Dimension {
  REAL   = 'REAL',
  SPIRIT = 'SPIRIT',
}

// ─── Tile data (from Tiled JSON) ──────────────────────────────────────────────

export interface TileObject {
  x: number;
  y: number;
  type: string;
  dimension?: Dimension;
  properties?: Record<string, unknown>;
}

// ─── Level manifest ───────────────────────────────────────────────────────────

export interface LevelConfig {
  key: string;         // Phaser asset key for the tilemap
  name: string;        // Display name shown in HUD
  music: string;       // Phaser asset key for BGM
}

// ─── Game events (used with scene EventEmitter) ───────────────────────────────

export const EVENTS = {
  DIMENSION_CHANGED : 'dimensionChanged',
  PLAYER_DIED       : 'playerDied',
  LEVEL_COMPLETE    : 'levelComplete',
  ENERGY_CHANGED    : 'energyChanged',
} as const;