import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  private bgm!: Phaser.Sound.BaseSound;
  private settingsOpen: boolean = false;
  private settingsPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    this.load.audio('bgm_menu', 'assets/sounds/bgm/lorenzobuczek-dark-forest-156382-MENU-SOUNDTRACK-LOOP.mp3');
    this.load.image('menu_bg', 'assets/menu_bg.jpg');
  }

  create(): void {
    // Inicializar volumes no registry se não existirem ainda
    if (this.registry.get('bgmVolume') === undefined) this.registry.set('bgmVolume', 0.5);
    if (this.registry.get('sfxVolume') === undefined) this.registry.set('sfxVolume', 0.8);

    const bgmVol = this.registry.get('bgmVolume') as number;
    this.bgm = this.sound.add('bgm_menu', { loop: true, volume: bgmVol });
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

    // ====== ÍCONE DE CONFIGURAÇÕES (Nota Musical) ======
    const musicIcon = this.add.text(width - 50, 50, '♫', {
      fontSize: '84px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(50);

    musicIcon.on('pointerover', () => musicIcon.setColor('#00ffaa'));
    musicIcon.on('pointerout', () => musicIcon.setColor('#ffffff'));
    musicIcon.on('pointerdown', () => this.toggleSettings(cx, cy));

    // Input para iniciar
    this.input.keyboard!.once('keydown-ENTER', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.bgm.stop();
        this.scene.start('IntroScene');
      });
    });
  }

  private toggleSettings(cx: number, cy: number): void {
    if (this.settingsOpen && this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
      this.settingsOpen = false;
      return;
    }

    this.settingsOpen = true;
    this.settingsPanel = this.add.container(cx, cy).setDepth(200);

    const panelW = 360;
    const panelH = 210;

    // Fundo do painel
    const bg = this.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.92)
      .setStrokeStyle(2, 0x00ffaa);
    this.settingsPanel.add(bg);

    // Título do painel
    const title = this.add.text(0, -80, '♫ VOLUME', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.settingsPanel.add(title);

    // ====== Controle de BGM ======
    this.createVolumeControl(
      this.settingsPanel, 0, -25, '♪ MÚSICA',
      this.registry.get('bgmVolume') as number,
      (val: number) => {
        this.registry.set('bgmVolume', val);
        (this.bgm as any).setVolume(val);
      }
    );

    // ====== Controle de SFX ======
    this.createVolumeControl(
      this.settingsPanel, 0, 35, '⚔ EFEITOS',
      this.registry.get('sfxVolume') as number,
      (val: number) => {
        this.registry.set('sfxVolume', val);
      }
    );

    // Botão de fechar
    const closeBtn = this.add.text(0, 85, '[ FECHAR ]', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#aaaaaa'));
    closeBtn.on('pointerdown', () => this.toggleSettings(cx, cy));

    this.settingsPanel.add(closeBtn);
  }

  private createVolumeControl(
    container: Phaser.GameObjects.Container,
    x: number, y: number,
    label: string,
    initialValue: number,
    onChange: (val: number) => void
  ): void {
    const barW = 160;
    const barH = 14;
    const step = 0.05; // 5% por clique
    let currentVal = initialValue;

    // Label
    const labelText = this.add.text(x, y - 20, label, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(labelText);

    // Botão [-]
    const btnMinus = this.add.text(x - barW / 2 - 30, y + 5, '◀', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    container.add(btnMinus);

    // Track (fundo da barra)
    const trackBg = this.add.rectangle(x, y + 5, barW, barH, 0x333333, 1)
      .setStrokeStyle(1, 0x555555);
    container.add(trackBg);

    // Fill (barra preenchida)
    const fill = this.add.rectangle(
      x - barW / 2, y + 5,
      barW * currentVal, barH,
      0x00ffaa, 1
    ).setOrigin(0, 0.5);
    container.add(fill);

    // Botão [+]
    const btnPlus = this.add.text(x + barW / 2 + 30, y + 5, '▶', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    container.add(btnPlus);

    // Percentual
    const pctText = this.add.text(x + barW / 2 + 65, y + 5, `${Math.round(currentVal * 100)}%`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#00ffaa',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(pctText);

    const updateVisual = () => {
      fill.setDisplaySize(barW * currentVal, barH);
      pctText.setText(`${Math.round(currentVal * 100)}%`);
    };

    // Interações dos botões
    btnMinus.on('pointerover', () => btnMinus.setColor('#ffffff'));
    btnMinus.on('pointerout', () => btnMinus.setColor('#00ffaa'));
    btnMinus.on('pointerdown', () => {
      currentVal = Phaser.Math.Clamp(currentVal - step, 0, 1);
      currentVal = Math.round(currentVal * 100) / 100; // evita float impreciso
      updateVisual();
      onChange(currentVal);
    });

    btnPlus.on('pointerover', () => btnPlus.setColor('#ffffff'));
    btnPlus.on('pointerout', () => btnPlus.setColor('#00ffaa'));
    btnPlus.on('pointerdown', () => {
      currentVal = Phaser.Math.Clamp(currentVal + step, 0, 1);
      currentVal = Math.round(currentVal * 100) / 100;
      updateVisual();
      onChange(currentVal);
    });
  }
}
