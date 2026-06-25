import Phaser from 'phaser';
import { DimensionSystem } from '../systems/DimensionSystem';
import { IDamageable } from '../interfaces/IDamageable';

export class WanderingSpirit extends Phaser.Physics.Arcade.Sprite implements IDamageable {
  private dimensionSystem: DimensionSystem;
  private centerPoint: Phaser.Math.Vector2;
  private orbitRadius: number;
  private orbitSpeed: number;
  private orbitAngle: number;
  private lastDrainTime: number = 0;
  private health: number = 1;
  private alive: boolean = true;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    dimensionSystem: DimensionSystem,
    orbitRadius: number = 50,
    orbitSpeed: number = 1.0
  ) {
    super(scene, x, y, 'wisp', 0);
    this.dimensionSystem = dimensionSystem;
    this.centerPoint = new Phaser.Math.Vector2(x, y);
    this.orbitRadius = orbitRadius;
    this.orbitSpeed = orbitSpeed;
    this.orbitAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(10);
    body.setAllowGravity(false);

    this.setDepth(4);
    this.setTint(0x7ec8e3); // recolore o fogo original para o ciano do mundo espiritual
    this.setVisible(this.dimensionSystem.isSpirit);

    if (!scene.anims.exists('wisp_idle')) {
      scene.anims.create({
        key: 'wisp_idle',
        frames: scene.anims.generateFrameNumbers('wisp', { start: 0, end: 9 }),
        frameRate: 10,
        repeat: -1
      });
    }
    this.play('wisp_idle');
  }

  public update(delta: number): void {
    if (!this.alive) return;
    const isSpirit = this.dimensionSystem.isSpirit;
    this.setVisible(isSpirit);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!isSpirit) {
      body.enable = false;
      return;
    }
    body.enable = true;

    this.orbitAngle += this.orbitSpeed * (delta / 1000);
    const newX = this.centerPoint.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    const newY = this.centerPoint.y + Math.sin(this.orbitAngle) * this.orbitRadius;
    this.setPosition(newX, newY);
  }

  public tryDrain(currentTime: number, cooldown: number = 1000): boolean {
    if (currentTime - this.lastDrainTime > cooldown) {
      this.lastDrainTime = currentTime;
      return true;
    }
    return false;
  }

  public isAlive(): boolean {
    return this.alive;
  }

  public takeDamage(amount: number): void {
    if (!this.alive) return;
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.alive = false;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scale: 0.3,
      duration: 200,
      onComplete: () => this.destroy()
    });
  }
}
