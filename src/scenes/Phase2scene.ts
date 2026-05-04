import Phaser from 'phaser';
import { DimensionSystem } from '../systems/DimensionSystem';
import { DimensionUI } from '../systems/DimensionUI';
import { Orb } from '../objects/Orb';
import { Rat } from '../objects/Rat';

export class Phase2Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: any;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private dimensionSystem!: DimensionSystem;
  private startData: { spawnX?: number, spawnY?: number } = {};
  private isDialogueActive: boolean = false;
  
  private orbs!: Phaser.Physics.Arcade.StaticGroup;
  private rats!: Phaser.Physics.Arcade.Group;

  constructor() {
    super({ key: 'Phase2Scene' });
  }

  init(data: { spawnX?: number, spawnY?: number }): void {
    this.startData = data;
  }

  preload(): void {
    this.load.tilemapTiledJSON('level2', 'assets/tilesets/mapa2.tmj');
    this.load.image('img_tiles', 'assets/tilesets/tiles.png');
    this.load.image('img_water', 'assets/tilesets/water_animation_demo.png');
    this.load.image('img_assets', 'assets/tilesets/assets.png');
    this.load.image('img_chest', 'assets/tilesets/chest.png');
    this.load.spritesheet('rats', 'assets/tilesets/Rats.png', {
      frameWidth: 48,
      frameHeight: 48
    });
    this.load.spritesheet('character', 'assets/characters/character_demo.png', {
      frameWidth: 44,
      frameHeight: 50
    });
  }

  create(): void {
    // Resetar estado de input
    if (this.input.keyboard) this.input.keyboard.enabled = true;
    this.isDialogueActive = false;

    this.cameras.main.setZoom(4);
    const map = this.make.tilemap({ key: 'level2' });

    const tileset       = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset  = map.addTilesetImage('water_animation_demo', 'img_water')!;
    const assetsTileset = map.addTilesetImage('assets', 'img_assets')!;
    const chestTileset  = map.addTilesetImage('Chest_spritesheet', 'img_chest')!;
    
    const todosTilesets = [tileset, waterTileset, assetsTileset, chestTileset];

    const camada1 = map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0)!;
    const camada2 = map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0)!;

    camada1.setCollisionByProperty({ collides: true });
    camada2.setCollisionByProperty({ collides: true });

    const spawnX = this.startData.spawnX ?? 128;
    const spawnY = this.startData.spawnY ?? 1424;

    this.player = this.physics.add.sprite(spawnX, spawnY, 'character').setDepth(10);

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 20).setOffset(10, 30);

    this.physics.add.collider(this.player, camada1);
    this.physics.add.collider(this.player, camada2);

    const returnPortal = this.add.zone(128, 1424, 64, 32);
    this.physics.add.existing(returnPortal, true);
    this.physics.add.overlap(this.player, returnPortal, () => {
      this.scene.start('GameScene', { spawnX: 96, spawnY: 64 });
    });

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

    this.cursors = {
      ...this.input.keyboard!.createCursorKeys(),
      w: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D)
    };

    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.dimensionSystem = new DimensionSystem(this);

    // GRUPOS CORRETOS: Orbes são estáticas, Ratos são dinâmicos
    this.orbs = this.physics.add.staticGroup();
    this.rats = this.physics.add.group();

    const orbX = 41 * 32 + 16;
    const orbY = 2 * 32 + 16;
    const orb = new Orb(this, orbX, orbY);
    this.orbs.add(orb);

    const ratPositions = [
      { x: orbX - 60, y: orbY, var: 0 }, // Marrom
      { x: orbX + 60, y: orbY, var: 1 }, // Marrom escuro
      { x: orbX, y: orbY + 60, var: 2 }  // Preto
    ];

    ratPositions.forEach(pos => {
      const rat = new Rat(this, pos.x, pos.y, pos.var);
      rat.setTarget(this.player);
      this.rats.add(rat);
    });

    this.physics.add.overlap(this.player, this.orbs, (_p, o) => {
      (o as Orb).collect();
    });

    this.physics.add.collider(this.rats, camada1);
    this.physics.add.collider(this.rats, camada2);
    this.physics.add.overlap(this.player, this.rats, () => {
      // Por enquanto apenas um log para evitar travar o jogo
      console.log("Dano!");
    });
  }

  update(time: number, delta: number): void {
    if (this.isDialogueActive) return;

    this.dimensionSystem.update(delta);
    
    // Update manual dos ratos
    this.rats.getChildren().forEach((rat) => {
      (rat as Rat).update();
    });

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      this.handleDimensionSwitch();
    }

    const speed = 200;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    body.setVelocity(0, 0);

    if (this.cursors.left.isDown || this.cursors.a.isDown)  body.setVelocityX(-speed);
    else if (this.cursors.right.isDown || this.cursors.d.isDown) body.setVelocityX(speed);
    
    if (this.cursors.up.isDown || this.cursors.w.isDown)    body.setVelocityY(-speed);
    else if (this.cursors.down.isDown || this.cursors.s.isDown)  body.setVelocityY(speed);

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(speed);
      this.player.play('walk_down', true);
      this.player.setFlipX(body.velocity.x > 0);
    } else {
      this.player.stop();
      this.player.setFrame(0);
    }
  }

  private handleDimensionSwitch(): void {
    this.dimensionSystem.switch();
    this.player.setTint(this.dimensionSystem.isSpirit ? 0x7ec8e3 : 0xffffff);

    if (!this.registry.get('hasDiscoveredDimension') && this.dimensionSystem.isSpirit) {
      this.registry.set('hasDiscoveredDimension', true);
      this.showDiscoveryDialogue();
    }
  }

  private showDiscoveryDialogue(): void {
    this.isDialogueActive = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.player.stop();

    const w = this.scale.width;
    const h = this.scale.height;
    const cam = this.cameras.main;
    const zoom = cam.zoom;
    
    // Coordenadas centrais visíveis
    const centerX = w / (2 * zoom);
    const centerY = h / zoom - (40 / zoom); // Fica na parte inferior

    // Texto com scale inverso para não ficar estourado
    const text = this.add.text(centerX, centerY, 
      "O que foi isso? O mundo... mudou de cor.\n(Pressione SHIFT para alternar)", {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101).setScale(1 / zoom * 0.5);

    // Caixa baseada no tamanho real do texto após o scale
    const padding = 16 / zoom;
    const boxW = text.displayWidth  + padding * 2;
    const boxH = text.displayHeight + padding * 2;

    const bg = this.add.rectangle(centerX, centerY, boxW, boxH, 0x000000, 0.85)
      .setScrollFactor(0)
      .setDepth(100);

    this.input.keyboard!.once('keydown-SHIFT', () => {
      bg.destroy();
      text.destroy();
      this.isDialogueActive = false;
    });
  }
}
