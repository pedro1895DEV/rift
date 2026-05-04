import Phaser from 'phaser';

export class CutsceneScene extends Phaser.Scene {
  private playerSpawn: { x: number, y: number } = { x: 0, y: 0 };

  constructor() {
    super({ key: 'CutsceneScene' });
  }

  init(data: { spawnX: number, spawnY: number }): void {
    this.playerSpawn = data;
  }

  create(): void {
    const { width, height } = this.scale;
    
    // Fundo preto para a transição
    this.add.rectangle(width/2, height/2, width, height, 0x000000);

    // Texto de suspense
    const text = this.add.text(width/2, height/2 - 50, "Você sente um olhar gélido em suas costas...", {
      fontFamily: 'serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'italic'
    }).setOrigin(0.5).setAlpha(0);

    // Criando uma representação visual temporária da Entidade (um retângulo preto alto e magro)
    const entity = this.add.rectangle(width/2, height/2 + 50, 10, 40, 0x000000)
      .setAlpha(0)
      .setStrokeStyle(1, 0xff0000); // Contorno vermelho sutil

    // Sequência da Cutscene
    this.tweens.chain({
      targets: [text, entity],
      tweens: [
        {
          targets: text,
          alpha: 1,
          duration: 2000,
          hold: 1000
        },
        {
          targets: entity,
          alpha: 0.8,
          duration: 3000,
          onStart: () => {
            // Som de suspense se houver
            // this.sound.play('sfx_entity_appear');
          }
        },
        {
          targets: [text, entity],
          alpha: 0,
          duration: 1000,
          delay: 1000,
          onComplete: () => {
            // Inicia a Fase 2 após a cutscene
            this.scene.start('Phase2Scene', this.playerSpawn);
          }
        }
      ]
    });

    // Permitir pular
    this.input.keyboard!.once('keydown', () => {
      this.scene.start('Phase2Scene', this.playerSpawn);
    });
  }
}
