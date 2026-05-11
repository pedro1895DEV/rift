import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { Orb } from '../objects/Orb';
import { Rat } from '../objects/Rat';

export class Phase2Scene extends BaseScene {
  private orbs!: Phaser.Physics.Arcade.StaticGroup;
  private rats!: Phaser.Physics.Arcade.Group;

  constructor() {
    super('Phase2Scene');
  }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('level2', 'assets/tilesets/mapa2.tmj');
    this.load.image('img_chest', 'assets/tilesets/chest.png');
    this.load.spritesheet('rats', 'assets/tilesets/Rats.png', {
      frameWidth: 48,
      frameHeight: 48
    });
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level2' });

    const tileset       = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset  = map.addTilesetImage('water_animation_demo', 'img_water')!;
    const assetsTileset = map.addTilesetImage('assets', 'img_assets')!;
    const chestTileset  = map.addTilesetImage('Chest_spritesheet', 'img_chest')!;
    
    const todosTilesets = [tileset, waterTileset, assetsTileset, chestTileset];

    map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0);
    map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0);

    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    const camada1 = map.getLayer('Camada de Blocos 1')!.tilemapLayer;
    const camada2 = map.getLayer('Camada de Blocos 2')!.tilemapLayer;

    camada1.setCollisionByProperty({ collides: true });
    camada2.setCollisionByProperty({ collides: true });

    this.physics.add.collider(this.player, camada1);
    this.physics.add.collider(this.player, camada2);
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    const returnPortal = this.add.zone(128, 1424, 64, 32);
    this.physics.add.existing(returnPortal, true);
    this.physics.add.overlap(this.player, returnPortal, () => {
      this.scene.start('GameScene', { spawnX: 96, spawnY: 64 });
    });

    // Grupos de Objetos
    this.orbs = this.physics.add.staticGroup();
    this.rats = this.physics.add.group();

    const orbX = 41 * 32 + 16;
    const orbY = 2 * 32 + 16;
    const orb = new Orb(this, orbX, orbY);
    this.orbs.add(orb);

    const ratPositions = [
      { x: orbX - 60, y: orbY, var: 0 },
      { x: orbX + 60, y: orbY, var: 1 },
      { x: orbX, y: orbY + 60, var: 2 }
    ];

    ratPositions.forEach(pos => {
      const rat = new Rat(this, pos.x, pos.y, pos.var);
      rat.setTarget(this.player);
      this.rats.add(rat);
    });

    this.physics.add.overlap(this.player, this.orbs, (_p, o) => {
      (o as Orb).collect();
    });

    const camada1 = map.getLayer('Camada de Blocos 1')!.tilemapLayer;
    const camada2 = map.getLayer('Camada de Blocos 2')!.tilemapLayer;
    
    this.physics.add.collider(this.rats, camada1);
    this.physics.add.collider(this.rats, camada2);
    this.physics.add.overlap(this.player, this.rats, () => {
      console.log("Dano!");
    });
  }

  protected onUpdate(): void {
    this.rats.getChildren().forEach((rat) => {
      (rat as Rat).update();
    });
  }
}
