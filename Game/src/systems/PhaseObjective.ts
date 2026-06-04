import Phaser from 'phaser';
import { GameEvents, EnemyDiedPayload } from '../events/GameEvents';

export class PhaseObjective {
  private scene: Phaser.Scene;
  public requiredOrbs: number;
  public currentOrbs: number = 0;
  public requiredKills: number;
  public currentKills: number = 0;

  constructor(scene: Phaser.Scene, requiredOrbs: number, requiredKills: number) {
    this.scene = scene;
    this.requiredOrbs = requiredOrbs;
    this.requiredKills = requiredKills;

    this.scene.events.on(GameEvents.ORB_COLLECTED, this.registerOrb, this);
    this.scene.events.on(GameEvents.ENEMY_DIED, this.registerKill, this);
  }

  public registerOrb(): void {
    this.currentOrbs++;
  }

  public registerKill(payload: EnemyDiedPayload): void {
    if (payload.enemyType === 'rat') {
      this.currentKills++;
    }
  }

  public canComplete(): boolean {
    return this.currentOrbs >= this.requiredOrbs && this.currentKills >= this.requiredKills;
  }

  public destroy(): void {
    this.scene.events.off(GameEvents.ORB_COLLECTED, this.registerOrb, this);
    this.scene.events.off(GameEvents.ENEMY_DIED, this.registerKill, this);
  }
}
