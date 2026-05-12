export enum GameEvents {
  HEALTH_CHANGED = 'HEALTH_CHANGED',
  ORB_COLLECTED = 'ORB_COLLECTED',
  ENEMY_DIED = 'ENEMY_DIED',
  SWORD_FOUND = 'SWORD_FOUND'
}

export interface HealthChangedPayload {
  current: number;
  max: number;
}

export interface OrbCollectedPayload {
  current: number;
  required: number;
}

export interface EnemyDiedPayload {
  enemyType: string;
  x: number;
  y: number;
}

