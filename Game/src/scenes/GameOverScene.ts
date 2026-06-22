import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#1a0000');

    const gameOverText = this.add.text(width / 2, height / 2 - 40, 'GAME OVER', {
      fontFamily: 'serif',
      fontSize: '64px',
      color: '#cc0000',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    const subText = this.add.text(width / 2, height / 2 + 40, 'Pressione ENTER para voltar ao menu', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [gameOverText, subText],
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        this.input.keyboard!.once('keydown-ENTER', () => {
          this.scene.start('MenuScene');
        });
      }
    });
  }
}
