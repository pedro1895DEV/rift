import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  private bgm!: Phaser.Sound.BaseSound;

  constructor() {
    super('VictoryScene');
  }

  preload(): void {
    this.load.audio('bgm_victory', 'assets/sounds/bgm/music_for_creators-piano-emotional-inspiring-cinematic-132225-VICTORY-SCENE.mp3');
  }

  create(): void {
    const bgmVol = (this.registry.get('bgmVolume') ?? 0.5) as number;
    this.bgm = this.sound.add('bgm_victory', { loop: true, volume: bgmVol });
    this.bgm.play();

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
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '28px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      }).setOrigin(0.5).setAlpha(0).setShadow(2, 2, '#000000', 4, true, true);

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
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0).setShadow(0, 0, '#ffffff', 10, true, true);

    const subText = this.add.text(width / 2, height / 2 + 40, "Pressione ENTER para voltar ao menu", {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#aaaaaa',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [fimText, subText],
      alpha: 1,
      duration: 1000,
      onComplete: () => {
        this.input.keyboard!.once('keydown-ENTER', () => {
          this.bgm.stop();
          this.scene.start('MenuScene');
        });
      }
    });
  }
}