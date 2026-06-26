import Phaser from 'phaser';

export class CutsceneScene extends Phaser.Scene {
  private playerSpawn: any = {};

  constructor() {
    super({ key: 'CutsceneScene' });
  }

  init(data: any): void {
    this.playerSpawn = data || {};
  }

  preload(): void {
    this.load.spritesheet('entity_idle', 'assets/characters/Idle.png', {
      frameWidth: 250,
      frameHeight: 250
    });
  }

  create(): void {
    const { width, height } = this.scale;
    
    // Fundo preto para a transição
    this.add.rectangle(width/2, height/2, width, height, 0x000000);

    // Texto de suspense
    const text = this.add.text(width/2, height/2 - 80, "Você sente um olhar gélido em suas costas...", {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '20px',
      fontStyle: 'italic bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    // Substituindo o objeto image por um Sprite com frame específico
    const entity = this.add.sprite(width/2, height/2 + 50, 'entity_idle', 0)
      .setAlpha(0.8)
      .setTint(0x88aaff) // Tom espiritual azulado
      .setScale(2); // Ajuste de escala conforme necessário
      // .setDepth(10);

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
