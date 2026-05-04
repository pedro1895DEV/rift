import Phaser from 'phaser';

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'IntroScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    // Fundo preto absoluto
    this.add.rectangle(cx, cy, width, height, 0x000000);

    const narrative = [
      "Rodrigo acorda em uma floresta desconhecida...",
      "Sua memória é um mosaico de sombras e ecos.",
      "Mas algo em seu sangue pulsa em dois ritmos.",
      "A habilidade de caminhar entre o que é real...",
      "...e o que é espírito.",
      "Recupere suas memórias. Sele os portais.",
      "O RIFT o aguarda."
    ];

    let currentLine = 0;

    const showLine = (index: number) => {
      if (index >= narrative.length) {
        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('GameScene');
        });
        return;
      }

      const text = this.add.text(cx, cy, narrative[index], {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'italic',
        align: 'center',
        wordWrap: { width: width * 0.8 }
      }).setOrigin(0.5).setAlpha(0);

      // Fade In
      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 2000,
        hold: 2000, // Tempo que o texto fica visível
        onComplete: () => {
          // Fade Out
          this.tweens.add({
            targets: text,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
              text.destroy();
              showLine(index + 1);
            }
          });
        }
      });
    };

    // Pular intro com qualquer tecla
    this.input.keyboard!.once('keydown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene');
      });
    });

    // Iniciar primeira linha
    showLine(currentLine);
  }
}
