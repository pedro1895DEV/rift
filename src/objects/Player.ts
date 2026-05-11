import Phaser from 'phaser';
import { DimensionSystem } from '../systems/DimensionSystem';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private dimensionSystem: DimensionSystem;
  private cursors: any;
  private speed: number = 200;

  constructor(scene: Phaser.Scene, x: number, y: number, dimensionSystem: DimensionSystem) {
    super(scene, x, y, 'character');
    this.dimensionSystem = dimensionSystem;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configuração da Hitbox (baseada no sprite 44x50, focada nos pés)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 20);
    body.setOffset(10, 30);
    body.setCollideWorldBounds(true);

    // Inicialização do Input
    if (scene.input.keyboard) {
      this.cursors = {
        ...scene.input.keyboard.createCursorKeys(),
        w: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
      };
    }

    this.createAnimations();
  }

  private createAnimations(): void {
    if (!this.scene.anims.exists('walk_down')) {
      this.scene.anims.create({
        key: 'walk_down',
        frames: this.scene.anims.generateFrameNumbers('character', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }
  }

  update(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    body.setVelocity(0, 0);

    const up = this.cursors.up.isDown || this.cursors.w.isDown;
    const down = this.cursors.down.isDown || this.cursors.s.isDown;
    const left = this.cursors.left.isDown || this.cursors.a.isDown;
    const right = this.cursors.right.isDown || this.cursors.d.isDown;

    if (left) body.setVelocityX(-this.speed);
    else if (right) body.setVelocityX(this.speed);

    if (up) body.setVelocityY(-this.speed);
    else if (down) body.setVelocityY(this.speed);

    // Normaliza velocidade para movimento diagonal não ser mais rápido
    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(this.speed);
      this.play('walk_down', true);

      // Inverte o sprite horizontalmente conforme a direção
      if (body.velocity.x < 0) this.setFlipX(false);
      else if (body.velocity.x > 0) this.setFlipX(true);
    } else {
      this.stop();
      this.setFrame(0);
    }

    // Aplica o tom da dimensão
    this.setTint(this.dimensionSystem.isSpirit ? 0x7ec8e3 : 0xffffff);
  }
}