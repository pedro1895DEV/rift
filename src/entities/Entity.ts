import Phaser from 'phaser';
import { IDamageable } from '../interfaces/IDamageable';
import { GameEvents } from '../events/GameEvents';
import { DimensionSystem } from '../systems/DimensionSystem';

export class Entity extends Phaser.Physics.Arcade.Sprite implements IDamageable {
  private health: number = 5;
  private isImmune: boolean = false;
  private spawnPoint: Phaser.Math.Vector2;
  private targetPlayer: Phaser.Physics.Arcade.Sprite | null = null;
  private dimensionSystem: DimensionSystem;
  private regenTimer: Phaser.Time.TimerEvent | null = null;
  public isActiveEntity: boolean = true;

  constructor(scene: Phaser.Scene, x: number, y: number, dimensionSystem: DimensionSystem) {
    super(scene, x, y, 'entity_idle');
    this.spawnPoint = new Phaser.Math.Vector2(x, y);
    this.dimensionSystem = dimensionSystem;
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCollideWorldBounds(true);
    body.setSize(24, 40);
    this.setTint(0x88aaff);
  }

  public setTarget(player: Phaser.Physics.Arcade.Sprite): void {
    this.targetPlayer = player;
  }

  public setActive(value: boolean): this {
    this.isActiveEntity = value;
    if (!value) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }
    return this;
  }

  public takeDamage(amount: number): void {
    if (this.isImmune || this.health <= 0 || !this.isActiveEntity) return;

    this.health -= amount;
    
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      this.setTint(0x88aaff);
    });

    if (this.health <= 0) {
      this.triggerRetreat();
    }
  }

  public isAlive(): boolean {
    return this.health > 0;
  }

  private triggerRetreat(): void {
    this.isImmune = true;
    this.scene.events.emit(GameEvents.ENTITY_PHASE_CHANGED);

    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.scene.physics.moveToObject(this, this.spawnPoint, 100);

    // Regenera 1 HP por segundo, 3 vezes (3 segundos de imunidade)
    let regenTicks = 0;
    this.regenTimer = this.scene.time.addEvent({
      delay: 1000,
      repeat: 2, // 3 execuções totais (initial + 2 repeats) = 3 segundos
      callback: () => {
        if (this.health < 5) {
          this.health += 1;
        }
        regenTicks++;
        // Após 3 segundos, remove imunidade
        if (regenTicks >= 3) {
          this.isImmune = false;
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          if (this.regenTimer) {
            this.regenTimer.destroy();
            this.regenTimer = null;
          }
        }
      }
    });
  }

  update(): void {
    this.setVisible(this.dimensionSystem.isSpirit);
    
    if (!this.dimensionSystem.isSpirit || !this.targetPlayer || !this.isActiveEntity) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      return;
    }

    if (this.isImmune) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.spawnPoint.x, this.spawnPoint.y);
      if (dist < 10) {
        (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        this.setPosition(this.spawnPoint.x, this.spawnPoint.y);
      }
      return;
    }

    this.scene.physics.moveToObject(this, this.targetPlayer, 60);
  }
}