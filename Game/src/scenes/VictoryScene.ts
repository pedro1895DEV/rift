import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super('VictoryScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#000000');

    const texts = [
      "Os portais estão selados.",
      "Rodrigo Bjordans finalmente lembra de tudo...",
      "...e encontra o caminho de volta para casa."
    ];

    let currentText = 0;

    const showText = () => {
      if (currentText >= texts.length) {
        this.showFinalScreen();
        return;
      }

      const t = this.add.text(width / 2, height / 2, texts[currentText], {
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: t,
        alpha: 1,
        duration: 1000,
        yoyo: true,
        hold: 2000,
        onComplete: () => {
          t.destroy();
          currentText++;
          showText();
        }
      });
    };

    // Iniciar a sequência após um breve delay
    this.time.delayedCall(500, showText);
  }

  private showFinalScreen(): void {
    const { width, height } = this.scale;
    
    const fimText = this.add.text(width / 2, height / 2 - 40, "FIM", {
      fontFamily: 'serif',
      fontSize: '64px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    const subText = this.add.text(width / 2, height / 2 + 40, "Pressione ENTER para voltar ao menu", {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [fimText, subText],
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