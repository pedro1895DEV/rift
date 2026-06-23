import Phaser from 'phaser';
import { IDamageable } from '../interfaces/IDamageable';
import { GameEvents, EnemyDiedPayload } from '../events/GameEvents';
import { DimensionSystem } from '../systems/DimensionSystem';

export class RatEnemy extends Phaser.Physics.Arcade.Sprite implements IDamageable {
  private health: number = 2;
  private alive: boolean = true;
  
  // Lógica herdada do Rat original
  private spawnPoint: Phaser.Math.Vector2;
  private detectionRange: number = 150;
  private leashRange: number = 250;
  private speed: number = 100;
  private targetPlayer: Phaser.Physics.Arcade.Sprite | null = null;
  private variant: number;
  private dimensionSystem: DimensionSystem;

  private isInvulnerable: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number, variant: number = 0, dimensionSystem: DimensionSystem) {
    super(scene, x, y, 'rats');
    this.variant = variant;
    this.dimensionSystem = dimensionSystem;
    this.spawnPoint = new Phaser.Math.Vector2(x, y);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics body sem gravidade (top-down)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(false);
    body.setCollideWorldBounds(true);
    
    // Configura o corpo físico para o tamanho do rato lateral
    body.setSize(28, 24);
    body.setOffset(10, 20);

    this.createAnimations();
    
    // Inicia com a animação de caminhada
    if (scene.anims.exists(`rat_${this.variant}_walk`)) {
      this.play(`rat_${this.variant}_walk`);
    }
    this.stop();
  }

  private createAnimations(): void {
    const v = this.variant;
    if (!this.scene.anims.exists(`rat_${v}_walk`)) {
      this.scene.anims.create({
        key: `rat_${v}_walk`,
        frames: this.scene.anims.generateFrameNumbers('rats', {
          start: 12 + v * 3,
          end: 14 + v * 3
        }),
        frameRate: 10,
        repeat: -1
      });
    }
  }

  public takeDamage(amount: number): void {
    if (!this.alive || this.isInvulnerable) return;

    this.health -= amount;
    this.isInvulnerable = true;
    
    // Feedback visual simples ao levar dano
    this.setTint(0xff0000);
    this.scene.time.delayedCall(150, () => {
      if (this.alive) {
        this.clearTint();
      }
      this.isInvulnerable = false;
    });

    if (this.health <= 0) {
      this.die();
    }
  }

  public isAlive(): boolean {
    return this.alive;
  }

  private die(): void {
    this.alive = false;
    this.health = 0;
    
    // Emitir evento de morte
    const payload: EnemyDiedPayload = {
      enemyType: 'rat',
      x: this.x,
      y: this.y
    };
    this.scene.events.emit(GameEvents.ENEMY_DIED, payload);

    // Desabilita física imediatamente
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;

    // Efeito de sumiço antes de destruir
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.5,
      duration: 200,
      onComplete: () => {
        this.destroy();
      }
    });
  }

  setTarget(player: Phaser.Physics.Arcade.Sprite): void {
    this.targetPlayer = player;
  }

  update(): void {
    if (!this.alive || !this.targetPlayer) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.dimensionSystem.isSpirit) {
      body.setVelocity(0, 0);
      this.updateAnimation();
      return;
    }

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
    const distanceToSpawn = Phaser.Math.Distance.Between(this.x, this.y, this.spawnPoint.x, this.spawnPoint.y);

    if (distanceToPlayer < this.detectionRange && distanceToSpawn < this.leashRange) {
      this.scene.physics.moveToObject(this, this.targetPlayer, this.speed);
    } 
    else if (distanceToSpawn > 10) {
      this.scene.physics.moveTo(this, this.spawnPoint.x, this.spawnPoint.y, this.speed * 0.7);
    } else {
      body.setVelocity(0, 0);
    }

    this.updateAnimation();
  }

  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    if (body.velocity.length() > 0) {
      this.play(`rat_${this.variant}_walk`, true);
      if (body.velocity.x > 0) this.setFlipX(true);
      else if (body.velocity.x < 0) this.setFlipX(false);
    } else {
      this.stop();
      this.setFrame(12 + this.variant * 3);
    }
  }
}
