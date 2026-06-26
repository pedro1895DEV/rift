import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private bgm!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    this.load.audio('bgm_menu', 'assets/sounds/bgm/lorenzobuczek-dark-forest-156382-MENU-SOUNDTRACK-LOOP.mp3');
    this.load.image('menu_bg', 'assets/menu_bg.jpg');
  }

  create(): void {
    this.bgm = this.sound.add('bgm_menu', { loop: true, volume: 0.5 });
    this.bgm.play();

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.add.image(cx, cy, 'menu_bg').setDisplaySize(width, height);

    // Título
    this.add.text(cx, cy - 80, 'RIFT', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '72px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setShadow(0, 0, '#00ffaa', 15, true, true);

    // Subtítulo
    this.add.text(cx, cy - 20, 'ENTRE DOIS MUNDOS', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#aaddff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setShadow(2, 2, '#000000', 4, true, true);

    // Botão de Iniciar
    const startBtn = this.add.text(cx, cy + 60, '▶ PRESSIONE ENTER PARA INICIAR ◀', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setShadow(0, 0, '#00ffaa', 10, true, true);

    this.tweens.add({
      targets: startBtn,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Controles (Rodapé)
    this.add.text(cx, height - 30, 'WASD/Setas: Mover  |  ESPAÇO: Atacar  |  SHIFT: Trocar Dimensão  |  E: Interagir', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
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
