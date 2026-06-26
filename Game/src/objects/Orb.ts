import Phaser from 'phaser';

export class Orb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'orb');
    
    scene.add.existing(this);
    scene.physics.add.existing(this, true);

    if (!scene.textures.exists('orb')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0xffff00, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture('orb', 16, 16);
      this.setTexture('orb');
    }

    // Efeitos
    scene.tweens.add({
      targets: this,
      y: y - 10,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Brilho
    this.setTint(0xffffff);
  }

  collect(): void {
    this.destroy();
  }
}
