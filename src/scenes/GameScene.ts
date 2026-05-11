import Phaser from 'phaser';
import { BaseScene } from './BaseScene';

export class GameScene extends BaseScene {
  constructor() {
    super('GameScene');
  }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('level1', 'assets/tilesets/mapa.tmj');
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level1' });
    
    const tileset = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset = map.addTilesetImage('water_animation_demo', 'img_water')!;
    const assetsTileset = map.addTilesetImage('assets', 'img_assets')!;

    const todosTilesets = [tileset, waterTileset, assetsTileset];

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
    const portal = this.add.zone(96, 16, 64, 32);
    this.physics.add.existing(portal, true);

    this.physics.add.overlap(this.player, portal, () => {
      if (!this.registry.get('hasSeenEntityIntro')) {
        this.registry.set('hasSeenEntityIntro', true);
        this.scene.start('CutsceneScene', { spawnX: 128, spawnY: 1380 });
      } else {
        this.scene.start('Phase2Scene', { spawnX: 128, spawnY: 1380 });
      }
    });
  }
}