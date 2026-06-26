import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { HealthUI } from '../ui/HealthUI';
import { PhaseObjective } from '../systems/PhaseObjective';

export class GameScene extends BaseScene {
  private healthUI!: HealthUI;
  private phaseObjective!: PhaseObjective;

  // Referências para alternar colisões entre dimensões
  private camadaPedras!: Phaser.Tilemaps.TilemapLayer;
  private pedrasCollider!: Phaser.Physics.Arcade.Collider;

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
    this.load.audio('bgm_phase1', 'assets/sounds/bgm/harumachimusic-forest-moon-mysterious-fantastic-piano-192111-PHASE1.mp3');
    // this.load.audio('bgm_phase1_alt', 'assets/sounds/bgm/mickeyscat-moment-of-peace-mickeyscat-554494-PHASE1.mp3');
    
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

    map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0);  // chão, mais atrás
    map.createLayer('Camada Pedras', todosTilesets, 0, 0);        // pedras
    map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0);   // árvores
    map.createLayer('Camada de Blocos 3', todosTilesets, 0, 0);   // arbustos/troncos, mais na frente

    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    const camada1 = map.getLayer('Camada de Blocos 1')!.tilemapLayer;
    const camada2 = map.getLayer('Camada de Blocos 2')!.tilemapLayer;
    const camada3 = map.getLayer('Camada de Blocos 3')!.tilemapLayer;
    this.camadaPedras = map.getLayer('Camada Pedras')!.tilemapLayer;

    // Cenário permanente — sempre sólido, sempre visível
    camada1.setCollisionByProperty({ collides: true });
    camada2.setCollisionByProperty({ collides: true });
    camada3.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.player, camada1);
    this.physics.add.collider(this.player, camada2);
    this.physics.add.collider(this.player, camada3);

    // Pedras — obstáculo do mundo real, some no espiritual
    this.camadaPedras.setCollisionByProperty({ collides: true });
    this.pedrasCollider = this.physics.add.collider(this.player, this.camadaPedras);
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    const bgmVol = (this.registry.get('bgmVolume') ?? 0.5) as number;
    this.currentBgm = this.sound.add('bgm_phase1', { loop: true, volume: bgmVol });
    // this.currentBgm = this.sound.add('bgm_phase1_alt', { loop: true, volume: bgmVol });
    this.currentBgm.play();

    this.healthUI = new HealthUI(this);
    this.phaseObjective = new PhaseObjective(this, 0, 0);

    // Portal de saída
    const portal = this.add.zone(96, 16, 64, 32);
    this.physics.add.existing(portal, true);
    this.physics.add.overlap(this.player, portal, () => {
      if (this.phaseObjective.canComplete()) {
        if (!this.registry.get('hasSeenEntityIntro')) {
          this.registry.set('hasSeenEntityIntro', true);
          this.scene.start('CutsceneScene');
        } else {
          this.scene.start('Phase2Scene');
        }
      }
    });

    // Alterna visibilidade e colisão da camada de pedras ao trocar de dimensão
    this.events.on('dimensionChanged', () => {
      const isSpirit = this.dimensionSystem.isSpirit;
      this.pedrasCollider.active = !isSpirit;
      this.camadaPedras.setVisible(!isSpirit);
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
      if (this.currentBgm) this.currentBgm.stop();
    });
  }
}