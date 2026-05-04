import Phaser from 'phaser';
import { DimensionSystem } from '../systems/DimensionSystem';

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: any;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private dimensionSystem!: DimensionSystem;
  private startData: { spawnX?: number, spawnY?: number } = {};
  private isDialogueActive: boolean = false;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { spawnX?: number, spawnY?: number }): void {
    this.startData = data;
  }

  preload(): void {
    this.load.tilemapTiledJSON('level1', 'assets/tilesets/mapa.tmj');
    this.load.image('img_tiles', 'assets/tilesets/tiles.png');
    this.load.image('img_water', 'assets/tilesets/water_animation_demo.png');
    this.load.image('img_assets', 'assets/tilesets/assets.png');
    this.load.spritesheet('character', 'assets/characters/character_demo.png', { 
      frameWidth: 44, 
      frameHeight: 50
    });
  }

  create(): void {
    this.cameras.main.setZoom(4);
    const map = this.make.tilemap({ key: 'level1' });
    
    const tileset = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset = map.addTilesetImage('water_animation_demo', 'img_water')!;
    const assetsTileset = map.addTilesetImage('assets', 'img_assets')!;

    const todosTilesets = [tileset, waterTileset, assetsTileset];

    const camada1 = map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0)!;
    const camada2 = map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0)!;

    camada1.setCollisionByProperty({ collides: true });
    camada2.setCollisionByProperty({ collides: true });

    // Posição inicial: Prioridade para os dados passados na transição, depois Spawn Point do Tiled, depois fallback.
    const spawnPoint = map.findObject('Objects', obj => obj.name === 'Spawn Point');
    
    const x = this.startData.spawnX ?? (spawnPoint?.x ?? 896);
    const y = this.startData.spawnY ?? (spawnPoint?.y ?? 416);

    this.player = this.physics.add.sprite(x, y, 'character')
      .setDepth(10)
      .setTint(0xffffff);

    // Ajuste da Hitbox: menor e focada nos pés (baseado no sprite 44x50)
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 20);
    body.setOffset(10, 30);

    this.physics.add.collider(this.player, camada1);
    this.physics.add.collider(this.player, camada2);

    if (!this.anims.exists('walk_down')) {
      this.anims.create({
        key: 'walk_down',
        frames: this.anims.generateFrameNumbers('character', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1
      });
    }

    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.player.setCollideWorldBounds(true);
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Input: Setas + WASD
    this.cursors = {
      ...this.input.keyboard!.createCursorKeys(),
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.dimensionSystem = new DimensionSystem(this);

    // Transição para a próxima fase
    // Tiles (2,0) e (3,0) -> X: 64-128, Y: 0-32. Centro: (96, 16)
    const portal = this.add.zone(96, 16, 64, 32);
    this.physics.add.existing(portal, true);

    this.physics.add.overlap(this.player, portal, () => {
      // Verifica se a cutscene já passou (podemos usar o registro global da cena)
      if (!this.registry.get('hasSeenEntityIntro')) {
        this.registry.set('hasSeenEntityIntro', true);
        this.scene.start('CutsceneScene', { spawnX: 128, spawnY: 1380 });
      } else {
        this.scene.start('Phase2Scene', { spawnX: 128, spawnY: 1380 });
      }
    });
  }

  update(time: number, delta: number): void {
    if (this.isDialogueActive) return;

    this.dimensionSystem.update(delta);

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      this.handleDimensionSwitch();
    }

    const speed = 200;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0, 0);

    if (this.cursors.left.isDown || this.cursors.a.isDown)  body.setVelocityX(-speed);
    else if (this.cursors.right.isDown || this.cursors.d.isDown) body.setVelocityX(speed);
    
    if (this.cursors.up.isDown || this.cursors.w.isDown)    body.setVelocityY(-speed);
    else if (this.cursors.down.isDown || this.cursors.s.isDown)  body.setVelocityY(speed);

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(speed);
      this.player.play('walk_down', true);
      
      if (body.velocity.x < 0) this.player.setFlipX(false);
      else if (body.velocity.x > 0) this.player.setFlipX(true);
    } else {
      this.player.stop();
      this.player.setFrame(0);
    }
  }

  private handleDimensionSwitch(): void {
    const isFirstTime = !this.registry.get('hasDiscoveredDimension');
    
    this.dimensionSystem.switch();
    
    // Aplica o tom azulado no personagem se estiver no mundo espiritual
    this.player.setTint(this.dimensionSystem.isSpirit ? 0x7ec8e3 : 0xffffff);

    if (isFirstTime && this.dimensionSystem.isSpirit) {
      this.registry.set('hasDiscoveredDimension', true);
      this.showDiscoveryDialogue();
    }
  }

  private showDiscoveryDialogue(): void {
    this.isDialogueActive = true;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.player.stop();

    const { width, height } = this.scale;
    
    // Overlay de diálogo
    const bg = this.add.rectangle(width/2, height - 60, width * 0.8, 60, 0x000000, 0.8)
      .setScrollFactor(0)
      .setDepth(100);
    
    const text = this.add.text(width/2, height - 60, 
      "O que foi isso? O mundo... mudou de cor.\n(Pressione SHIFT para alternar dimensões)", {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.input.keyboard!.once('keydown-SHIFT', () => {
      bg.destroy();
      text.destroy();
      this.isDialogueActive = false;
    });
  }
}