export interface IDamageable {
  takeDamage(amount: number): void;
  isAlive(): boolean;
}

export function isDamageable(obj: any): obj is IDamageable {
  return obj !== null && typeof obj === 'object' && 
         'takeDamage' in obj && typeof obj.takeDamage === 'function' && 
         'isAlive' in obj && typeof obj.isAlive === 'function';
}
