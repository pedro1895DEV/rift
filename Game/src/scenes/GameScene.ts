import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { HealthUI } from '../ui/HealthUI';
import { PhaseObjective } from '../systems/PhaseObjective';

export class GameScene extends BaseScene {
  private healthUI!: HealthUI;
  private phaseObjective!: PhaseObjective;

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
    map.createLayer('Camada de Blocos 3', todosTilesets, 0, 0);

    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    const camada1 = map.getLayer('Camada de Blocos 1')!.tilemapLayer;
    const camada2 = map.getLayer('Camada de Blocos 2')!.tilemapLayer;
    const camada3 = map.getLayer('Camada de Blocos 3')!.tilemapLayer;
    camada1.setCollisionByProperty({ collides: true });
    camada2.setCollisionByProperty({ collides: true });
    camada3.setCollisionByProperty({ collides: true });

    this.physics.add.collider(this.player, camada1);
    this.physics.add.collider(this.player, camada2);
    this.physics.add.collider(this.player, camada3);
  }

  protected getSpawnX(map: Phaser.Tilemaps.Tilemap): number {
    if (this.startData.spawnX !== undefined) return this.startData.spawnX;
    if (map.getObjectLayer('Objects')) {
      const spawnPoint = map.findObject('Objects', obj => obj.name === 'Spawn Point');
      return spawnPoint?.x ?? 848; // tile 26 * 32 + 16 = 848
    }
    return 848;
  }

  protected getSpawnY(map: Phaser.Tilemaps.Tilemap): number {
    if (this.startData.spawnY !== undefined) return this.startData.spawnY;
    if (map.getObjectLayer('Objects')) {
      const spawnPoint = map.findObject('Objects', obj => obj.name === 'Spawn Point');
      return spawnPoint?.y ?? 432; // tile 13 * 32 + 16 = 432
    }
    return 432;
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    this.healthUI = new HealthUI(this);
    this.phaseObjective = new PhaseObjective(this, 0, 0); // Sem requisitos na Fase 1 por enquanto

    const portal = this.add.zone(96, 16, 64, 32);
    this.physics.add.existing(portal, true);

    this.physics.add.overlap(this.player, portal, () => {
      if (this.phaseObjective.canComplete()) {
        if (!this.registry.get('hasSeenEntityIntro')) {
          this.registry.set('hasSeenEntityIntro', true);
          this.scene.start('CutsceneScene', { spawnX: 128, spawnY: 1380 });
        } else {
          this.scene.start('Phase2Scene', { spawnX: 128, spawnY: 1380 });
        }
      }
    });

    this.events.once('shutdown', () => {
      this.healthUI.destroy();
      this.phaseObjective.destroy();
    });
  }
}