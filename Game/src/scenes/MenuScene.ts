import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private bgm!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    this.load.audio('bgm_menu', 'assets/sounds/bgm/lorenzobuczek-dark-forest-156382-MENU-SOUNDTRACK-LOOP.mp3');
  }

  create(): void {
    this.bgm = this.sound.add('bgm_menu', { loop: true, volume: 0.5 });
    this.bgm.play();

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.rectangle(cx, cy, width, height, 0x050510);

    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const star = this.add.rectangle(x, y, 2, 2, 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
      
      this.tweens.add({
        targets: star,
        alpha: 0,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    this.add.text(cx, cy - 60, 'RIFT', {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: '#f4e4d0',
      stroke: '#000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, 'entre dois mundos', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#888899',
    }).setOrigin(0.5);

    const startBtn = this.add.text(cx, cy + 40, '[ PRESSIONE ENTER ]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#7ec8e3',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startBtn,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.add.text(cx, height - 40, 'Setas / AWSD: Movimentação do personagem | SHIFT: Dimensão', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#444455',
    }).setOrigin(0.5);
// Input para iniciar
this.input.keyboard!.once('keydown-ENTER', () => {
  this.cameras.main.fadeOut(500, 0, 0, 0);
  this.cameras.main.once('camerafadeoutcomplete', () => {
    this.bgm.stop();
    this.scene.start('IntroScene');
  });
});
  }
}
