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
  private realWorldFollowDistance: number = 120;
  private hasBeenTriggered: boolean = false;
  private isResetting: boolean = false;
  private portalsSealedCount: number = 0;
  private retreatDistance: number = 80;
  private retreatTarget: Phaser.Math.Vector2 | null = null;

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

  public activate(): void {
    if (!this.hasBeenTriggered) {
      this.scene.sound.play('sfx_entity_scream', { volume: 0.8 });
    }
    this.hasBeenTriggered = true;
  }

  public onPortalSealed(): void {
    this.portalsSealedCount++;
    this.scene.sound.play('sfx_entity_scream', { volume: 1.0 });
  }

  public spookAway(playerX: number, playerY: number): void {
    if (this.isResetting || this.dimensionSystem.isSpirit) return;
    this.isResetting = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        const angle = Phaser.Math.Angle.Between(playerX, playerY, this.x, this.y);
        const newX = playerX + Math.cos(angle) * this.realWorldFollowDistance;
        const newY = playerY + Math.sin(angle) * this.realWorldFollowDistance;
        this.setPosition(newX, newY);

        this.scene.tweens.add({
          targets: this,
          alpha: 0.5,
          duration: 400,
          onComplete: () => {
            this.isResetting = false;
          }
        });
      }
    });
  }

  public takeDamage(amount: number): void {
    if (this.isImmune || this.health <= 0 || !this.isActiveEntity) return;

    this.scene.sound.play('sfx_entity_scream', { volume: 0.6, rate: 1.2 }); // Grito agudo ao levar dano
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

  public get hasBecomeAggressive(): boolean {
    return this.portalsSealedCount >= 1;
  }

  private triggerRetreat(): void {
    this.isImmune = true;
    this.scene.events.emit(GameEvents.ENTITY_PHASE_CHANGED);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    if (this.targetPlayer) {
      const angle = Phaser.Math.Angle.Between(this.targetPlayer.x, this.targetPlayer.y, this.x, this.y);
      this.retreatTarget = new Phaser.Math.Vector2(
        this.x + Math.cos(angle) * this.retreatDistance,
        this.y + Math.sin(angle) * this.retreatDistance
      );
      this.scene.physics.moveTo(this, this.retreatTarget.x, this.retreatTarget.y, 100);
    } else {
      this.retreatTarget = new Phaser.Math.Vector2(this.x, this.y);
    }

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
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (!this.hasBeenTriggered) {
      this.setVisible(false);
      body.setVelocity(0, 0);
      return;
    }

    if (this.isResetting) {
      body.setVelocity(0, 0);
      return;
    }

    if (!this.targetPlayer || !this.isActiveEntity) {
      body.setVelocity(0, 0);
      return;
    }

    // Sempre visível agora — sólida no espiritual, "fantasmagórica" no real
    this.setVisible(true);
    this.setAlpha(this.dimensionSystem.isSpirit ? 1 : 0.5);

    if (this.isImmune) {
      if (this.retreatTarget) {
        const dist = Phaser.Math.Distance.Between(this.x, this.y, this.retreatTarget.x, this.retreatTarget.y);
        if (dist < 10) {
          body.setVelocity(0, 0);
          this.setPosition(this.retreatTarget.x, this.retreatTarget.y);
        }
      } else {
        body.setVelocity(0, 0);
      }
      return;
    }

    if (this.dimensionSystem.isSpirit) {
      // Perseguição total — velocidade escala com portais selados (60 → 75 → 90 → 105)
      const spiritSpeed = 60 + this.portalsSealedCount * 15;
      this.scene.physics.moveToObject(this, this.targetPlayer, spiritSpeed);
    } else {
      if (this.hasBecomeAggressive) {
        // Já está furiosa o suficiente para atacar mesmo no mundo real
        const realAggressiveSpeed = 55 + this.portalsSealedCount * 10;
        this.scene.physics.moveToObject(this, this.targetPlayer, realAggressiveSpeed);
      } else {
        // Mundo real: distância mínima diminui e velocidade aumenta com cada portal selado
        const followDistance = Math.max(60, this.realWorldFollowDistance - this.portalsSealedCount * 15);
        const realSpeed = 50 + this.portalsSealedCount * 10;
        const distToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
        if (distToPlayer > followDistance) {
          this.scene.physics.moveToObject(this, this.targetPlayer, realSpeed);
        } else {
          body.setVelocity(0, 0);
        }
      }
    }
  }
}