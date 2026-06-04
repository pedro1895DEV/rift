import Phaser from 'phaser';
import { DimensionSystem } from '../systems/DimensionSystem';
import { DimensionUI } from '../systems/DimensionUI';
import { Player } from '../entities/Player';

export interface SceneData {
  spawnX?: number;
  spawnY?: number;
}

export abstract class BaseScene extends Phaser.Scene {
  protected player!: Player;
  protected dimensionSystem!: DimensionSystem;
  protected dimensionUI!: DimensionUI;
  protected shiftKey!: Phaser.Input.Keyboard.Key;
  protected startData: SceneData = {};
  protected isDialogueActive: boolean = false;

  constructor(key: string) {
    super({ key });
  }

  init(data: SceneData): void {
    this.startData = data;
  }

  preload(): void {
    // Assets comuns que todas as fases usam
    this.load.image('img_tiles', 'assets/tilesets/tiles.png');
    this.load.image('img_water', 'assets/tilesets/water_animation_demo.png');
    this.load.image('img_assets', 'assets/tilesets/assets.png');
    this.load.image('img_sword', 'assets/items/sword.png');
    this.load.spritesheet('character', 'assets/characters/character_demo.png', { 
      frameWidth: 44, 
      frameHeight: 50
    });
    
    this.onPreload();
  }

  /** Gancho para subclasses carregarem assets específicos */
  protected abstract onPreload(): void;

  create(): void {
    this.cameras.main.setZoom(4);
    
    const map = this.createMap();
    
    // Configura o sistema de dimensões
    this.dimensionSystem = new DimensionSystem(this);
    this.dimensionUI = new DimensionUI(this, this.dimensionSystem);

    // Configura o jogador
    const spawnX = this.getSpawnX(map);
    const spawnY = this.getSpawnY(map);
    this.player = new Player(this, spawnX, spawnY, this.dimensionSystem);

    // Configura colisões e limites
    this.setupCollisions(map);
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    // Configura câmera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

    // Input global
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    this.onCreate(map);
  }

  /** Implementado pela subclasse para criar o Tilemap */
  protected abstract createMap(): Phaser.Tilemaps.Tilemap;
  
  /** Implementado pela subclasse para configurar colisões específicas */
  protected abstract setupCollisions(map: Phaser.Tilemaps.Tilemap): void;

  /** Gancho para lógica adicional após a criação base */
  protected abstract onCreate(map: Phaser.Tilemaps.Tilemap): void;

  protected getSpawnX(map: Phaser.Tilemaps.Tilemap): number {
    if (this.startData.spawnX !== undefined) return this.startData.spawnX;
    if (map.getObjectLayer('Objects')) {
      const spawnPoint = map.findObject('Objects', obj => obj.name === 'Spawn Point');
      return spawnPoint?.x ?? 400;
    }
    return 400;
  }

  protected getSpawnY(map: Phaser.Tilemaps.Tilemap): number {
    if (this.startData.spawnY !== undefined) return this.startData.spawnY;
    if (map.getObjectLayer('Objects')) {
      const spawnPoint = map.findObject('Objects', obj => obj.name === 'Spawn Point');
      return spawnPoint?.y ?? 300;
    }
    return 300;
  }

  update(time: number, delta: number): void {
    if (this.isDialogueActive) return;

    this.dimensionSystem.update(delta);
    this.player.update();

    if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) {
      this.handleDimensionSwitch();
    }

    this.onUpdate(time, delta);
  }

  /** Gancho para update específico da fase */
  protected onUpdate(time: number, delta: number): void { }

  protected handleDimensionSwitch(): void {
    const isFirstTime = !this.registry.get('hasDiscoveredDimension');
    this.dimensionSystem.switch();

    if (isFirstTime && this.dimensionSystem.isSpirit) {
      this.registry.set('hasDiscoveredDimension', true);
      this.showDiscoveryDialogue();
    }
  }

  protected showDiscoveryDialogue(): void {
    this.isDialogueActive = true;
    (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.player.stop();

    const cam = this.cameras.main;
    const zoom = cam.zoom;
    const w = cam.width;
    const h = cam.height;

    const centerX = w / 2;
    const visibleBottomY = (h / 2) + ((h / 2) / zoom);
    const boxWidth  = (w * 0.8) / zoom;
    const boxHeight = 80 / zoom;
    const yPos = visibleBottomY - (boxHeight / 2) - (10 / zoom);

    const bg = this.add.rectangle(centerX, yPos, boxWidth, boxHeight, 0x000000, 0.8)
      .setScrollFactor(0)
      .setDepth(100);

    const text = this.add.text(centerX, yPos,
      "O que foi isso? O mundo... mudou de cor.\n(Pressione SHIFT para alternar)", {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
      lineSpacing: 6,
      wordWrap: { width: boxWidth * zoom }
    }).setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(101)
      .setScale(1 / zoom);

    this.input.keyboard!.once('keydown-SHIFT', () => {
      bg.destroy();
      text.destroy();
      this.isDialogueActive = false;
    });
  }
}