import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { HealthUI } from '../ui/HealthUI';
import { PhaseObjective } from '../systems/PhaseObjective';

export class GameScene extends BaseScene {
  private healthUI!: HealthUI;
  private phaseObjective!: PhaseObjective;

  // Referências para alternar colisões entre dimensões
  private camada2!: Phaser.Tilemaps.TilemapLayer;
  private camadaEspiritual!: Phaser.Tilemaps.TilemapLayer;

  constructor() {
    super('GameScene');
  }

  protected getSpawnX(map: Phaser.Tilemaps.Tilemap): number {
    if (this.startData.spawnX !== undefined) return this.startData.spawnX;
    if (map.getObjectLayer('Camada de Objetos 1')) {
      const spawnPoint = map.findObject('Camada de Objetos 1', obj => obj.name === 'Spawn Point');
      return spawnPoint?.x ?? 400;
    }
    return 400;
  }

  protected getSpawnY(map: Phaser.Tilemaps.Tilemap): number {
    if (this.startData.spawnY !== undefined) return this.startData.spawnY;
    if (map.getObjectLayer('Camada de Objetos 1')) {
      const spawnPoint = map.findObject('Camada de Objetos 1', obj => obj.name === 'Spawn Point');
      return spawnPoint?.y ?? 300;
    }
    return 300;
  }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('level1', 'assets/tilesets/mapa.tmj');

    this.load.image('img_tiles', 'assets/tilesets/tiles.png');
    this.load.image('img_assets', 'assets/tilesets/assets.png');
    this.load.image('img_water', 'assets/tilesets/water_animation_demo.png');

    this.load.image('img_tiles_16', 'assets/tilesets/tiles.png');
    this.load.image('img_assets_16', 'assets/tilesets/assets.png');
    this.load.image('img_assets_spaced', 'assets/tilesets/assets.png');
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level1' });
    
    const tileset = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset = map.addTilesetImage('water_animation_demo', 'img_water')!;
    const assetsTileset = map.addTilesetImage('assets', 'img_assets')!;
    const tiles16Tileset = map.addTilesetImage('tiles_16', 'img_tiles')!;
    const assets16Tileset = map.addTilesetImage('assets_16', 'img_assets')!;
    const assetsSpacedTileset = map.addTilesetImage('assets_spaced', 'img_assets_spaced')!;

    const todosTilesets = [tileset, assetsTileset, waterTileset, tiles16Tileset, assets16Tileset, assetsSpacedTileset];

    map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0);
    map.createLayer('Camada Espiritual', todosTilesets, 0, 0);
    map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0);
    map.createLayer('Camada de Blocos 3', todosTilesets, 0, 0);

    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    const camada1 = map.getLayer('Camada de Blocos 1')!.tilemapLayer;
    const camada3 = map.getLayer('Camada de Blocos 3')!.tilemapLayer;

    // Guardar referências para alternar colisão via evento
    this.camada2 = map.getLayer('Camada de Blocos 2')!.tilemapLayer;
    this.camadaEspiritual = map.getLayer('Camada Espiritual')!.tilemapLayer;

    // Camadas sempre sólidas
    camada1.setCollisionByProperty({ collides: true });
    camada3.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.player, camada1);
    this.physics.add.collider(this.player, camada3);

    // Camada 2 — obstáculo do mundo real (começa ATIVA)
    this.camada2.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.player, this.camada2);

    // Camada Espiritual — só existe no mundo espiritual (começa INATIVA)
    this.camadaEspiritual.setCollisionByProperty({ collides: true }, false);
    this.physics.add.collider(this.player, this.camadaEspiritual);
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    this.healthUI = new HealthUI(this);
    this.phaseObjective = new PhaseObjective(this, 0, 0);

    // Portal de saída
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

    // Alterna colisão entre camada real e espiritual ao trocar de dimensão
    this.events.on('dimensionChanged', () => {
      const isSpirit = this.dimensionSystem.isSpirit;
      this.camada2.setCollisionByProperty({ collides: true }, !isSpirit);
      this.camadaEspiritual.setCollisionByProperty({ collides: true }, isSpirit);
    });

    // Tutorial — detecta objeto no Tiled e dispara diálogo uma vez
    const tutorialObj = map.findObject('Camada de Objetos 1', o => o.name === 'tutorial_trigger');
    if (tutorialObj) {
      const tutX = tutorialObj.x ?? 0;
      const tutY = tutorialObj.y ?? 0;
      const tutWidth = tutorialObj.width ?? 80;
      const tutHeight = tutorialObj.height ?? 80;
      
      // Tiled define a coordenada (x,y) de um retângulo no canto superior esquerdo.
      // O Phaser adiciona a zona no centro por padrão. Precisamos ajustar.
      const tutZone = this.add.zone(tutX + (tutWidth / 2), tutY + (tutHeight / 2), tutWidth, tutHeight);
      this.physics.add.existing(tutZone, true);
      let tutorialShown = false;
      this.physics.add.overlap(this.player, tutZone, () => {
        if (!tutorialShown) {
          tutorialShown = true;
          this.showNarrativeDialogue(
            "Estou preso... Mas essa rocha parece estranha.\n[SHIFT] — e se eu tentar algo diferente?"
          );
        }
      });
    }

    this.events.once('shutdown', () => {
      this.healthUI.destroy();
      this.phaseObjective.destroy();
    });
  }
}