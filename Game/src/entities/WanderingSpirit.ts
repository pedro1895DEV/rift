import Phaser from 'phaser';
import { DimensionSystem } from '../systems/DimensionSystem';
import { IDamageable } from '../interfaces/IDamageable';

export class WanderingSpirit extends Phaser.GameObjects.Arc implements IDamageable {
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
    super(scene, x, y, 10, 0, 360, false, 0x7ec8e3, 0.8);
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
    this.setVisible(this.dimensionSystem.isSpirit);

    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.5, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });
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
