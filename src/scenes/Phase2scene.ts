import Phaser from 'phaser';

export class Phase2Scene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'Phase2Scene' });
  }

  preload(): void {
    this.load.tilemapTiledJSON('level2', '../../assets/tilesets/mapa2.tmj');
    this.load.image('img_tiles', '../../assets/tilesets/tiles.png');
    this.load.image('img_water', '../../assets/tilesets/water_animation_demo.png');
    this.load.image('img_assets', '../../assets/tilesets/assets.png');
    this.load.spritesheet('character', '../../assets/characters/character_demo.png', {
      frameWidth: 44,
      frameHeight: 50
    });
  }

  create(): void {
    this.cameras.main.setZoom(4);
    const map = this.make.tilemap({ key: 'level2' });

    const tileset       = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset  = map.addTilesetImage('water_animation_demo', 'img_water')!;
    const assetsTileset = map.addTilesetImage('assets', 'img_assets')!;
    const todosTilesets = [tileset, waterTileset, assetsTileset];

    map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0);
    map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0);

    this.player = this.physics.add.sprite(100, 100, 'character')
      .setDepth(10)
      .setTint(0xffffff);

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

    this.cursors = this.input.keyboard!.createCursorKeys();
  }

  update(): void {
    const speed = 200;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0, 0);

    if (this.cursors.left.isDown)  body.setVelocityX(-speed);
    if (this.cursors.right.isDown) body.setVelocityX(speed);
    if (this.cursors.up.isDown)    body.setVelocityY(-speed);
    if (this.cursors.down.isDown)  body.setVelocityY(speed);

    if (body.velocity.length() > 0) {
      body.velocity.normalize().scale(speed);
      this.player.play('walk_down', true);
      if (body.velocity.x < 0) this.player.setFlipX(true);
      else if (body.velocity.x > 0) this.player.setFlipX(false);
    } else {
      this.player.stop();
      this.player.setFrame(0);
    }
  }
}