import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { Orb } from '../objects/Orb';
import { HealthUI } from '../ui/HealthUI';
import { PhaseObjective } from '../systems/PhaseObjective';
import { GameEvents } from '../events/GameEvents';

export class Phase3Scene extends BaseScene {
  private orbs!: Phaser.Physics.Arcade.StaticGroup;
  private healthUI!: HealthUI;
  private phaseObjective!: PhaseObjective;

  private camada1!: Phaser.Tilemaps.TilemapLayer;
  private camada2!: Phaser.Tilemaps.TilemapLayer;
  private camada3: Phaser.Tilemaps.TilemapLayer | null = null;
  private riverLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private lastSafePosition!: Phaser.Math.Vector2;

  constructor() {
    super('Phase3Scene');
  }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('level3', 'assets/tilesets/mapa3.tmj');
    this.load.image('img_impr', 'assets/tilesets/imprtileset.png');
    this.load.spritesheet('entity_idle', 'assets/characters/Idle.png', {
      frameWidth: 44,
      frameHeight: 50
    });
    this.load.spritesheet('purple_portal', 'assets/tilesets/Purple%20Portal%20Sprite%20Sheet.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level3' });
    const imprTileset = map.addTilesetImage('imprtileset', 'img_impr')!;
    const todosTilesets = [imprTileset];

    // Ordem inversa ao Tiled (de baixo pra cima)
    map.createLayer('Camada de Blocos 3', todosTilesets, 0, 0); // mais atrás
    
    map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0);

    if (map.getLayer('Camada do Rio')) {
      map.createLayer('Camada do Rio', todosTilesets, 0, 0);
    }

    map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0); // mais na frente

    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    this.camada1 = map.getLayer('Camada de Blocos 1')!.tilemapLayer;
    this.camada2 = map.getLayer('Camada de Blocos 2')!.tilemapLayer;
    
    const layer3 = map.getLayer('Camada de Blocos 3');
    if (layer3) this.camada3 = layer3.tilemapLayer;
    
    const river = map.getLayer('Camada do Rio');
    if (river) this.riverLayer = river.tilemapLayer;

    // Só colide nas camadas certas
    this.camada2.setCollisionByProperty({ collides: true });
    
    if (this.riverLayer) {
      // Rio começa sem colisão (fase inicia no espiritual)
      this.riverLayer.setCollisionByProperty({ collides: true }, false);
      this.riverLayer.setVisible(!this.dimensionSystem.isSpirit);
    }

    // Colliders apenas com camada 2 e rio
    this.physics.add.collider(this.player, this.camada2);
    
    if (this.riverLayer) {
      this.physics.add.collider(this.player, this.riverLayer);
    }
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    this.healthUI = new HealthUI(this);

    // Estado inicial do ataque
    const hasFoundSword = this.registry.get('hasFoundSword') || false;
    this.player.setCanAttack(hasFoundSword);

    // Forçar início na dimensão espiritual
    if (!this.dimensionSystem.isSpirit) {
      this.dimensionSystem.switch();
    }

    if (this.riverLayer) {
      this.riverLayer.setVisible(!this.dimensionSystem.isSpirit);
    }

    // Inicializar o checkpoint do jogador
    this.lastSafePosition = new Phaser.Math.Vector2(this.player.x, this.player.y);

    // Objetivo da fase: 2 Orbes, 0 Kills
    this.phaseObjective = new PhaseObjective(this, 2, 0);

    // Parse Object Layer
    const objectLayer = map.getObjectLayer('Objects');

    // Portal
    let portalX = 300, portalY = 300;
    if (objectLayer) {
      const portalObj = objectLayer.objects.find(o => o.name === 'Portal');
      if (portalObj) {
        portalX = portalObj.x ?? portalX;
        portalY = portalObj.y ?? portalY;
      }
    }

    this.anims.create({
      key: 'portal_idle_3',
      frames: this.anims.generateFrameNumbers('purple_portal', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: -1
    });
    this.add.sprite(portalX, portalY, 'purple_portal').setDepth(2).play('portal_idle_3');

    const returnPortal = this.add.zone(portalX, portalY, 64, 64);
    this.physics.add.existing(returnPortal, true);
    this.physics.add.overlap(this.player, returnPortal, () => {
      if (this.phaseObjective.canComplete()) {
        this.scene.start('Phase4Scene');
      } else {
        this.cameras.main.shake(100, 0.01);
      }
    });

    // Orbes
    this.orbs = this.physics.add.staticGroup();
    let orb1X = 200, orb1Y = 200;
    let orb2X = 400, orb2Y = 200;
    if (objectLayer) {
      const o1 = objectLayer.objects.find(o => o.name === 'Orb 1');
      if (o1) { orb1X = o1.x ?? orb1X; orb1Y = o1.y ?? orb1Y; }
      const o2 = objectLayer.objects.find(o => o.name === 'Orb 2');
      if (o2) { orb2X = o2.x ?? orb2X; orb2Y = o2.y ?? orb2Y; }
    }
    
    this.orbs.add(new Orb(this, orb1X, orb1Y));
    this.orbs.add(new Orb(this, orb2X, orb2Y));

    this.physics.add.overlap(this.player, this.orbs, (_p, o) => {
      if (this.phaseObjective.currentKills >= this.phaseObjective.requiredKills) {
        (o as Orb).collect();
        this.events.emit(GameEvents.ORB_COLLECTED, { current: this.phaseObjective.currentOrbs + 1, required: this.phaseObjective.requiredOrbs });
        
        if (this.phaseObjective.currentOrbs >= this.phaseObjective.requiredOrbs) {
          this.showNarrativeDialogue("Estou me lembrando... Eu vim aqui por escolha. Mas por quê");
        }
      } else {
        this.cameras.main.shake(100, 0.01);
      }
    });

    // Entidade (estática e pulsante, apenas no mundo espiritual)
    let entityX = 500, entityY = 500;
    if (objectLayer) {
      const entObj = objectLayer.objects.find(o => o.name === 'Entity');
      if (entObj) {
        entityX = entObj.x ?? entityX;
        entityY = entObj.y ?? entityY;
      }
    }
    const entity = this.add.sprite(entityX, entityY, 'entity_idle', 0)
      .setDepth(5)
      .setTint(0x88aaff)
      .setVisible(this.dimensionSystem.isSpirit);

    this.tweens.add({
      targets: entity,
      alpha: { from: 0.4, to: 1 },
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Atualiza visibilidade da entidade conforme dimensão e colisão do rio
    const updateDimensionState = () => {
      entity.setVisible(this.dimensionSystem.isSpirit);
      if (this.riverLayer) {
        const isSpirit = this.dimensionSystem.isSpirit;
        this.riverLayer.setCollisionByProperty({ collides: true }, !isSpirit);
        this.riverLayer.setVisible(!isSpirit);
      }
    };
    
    this.events.on('dimensionChanged', updateDimensionState);

    this.events.once('shutdown', () => {
      this.healthUI.destroy();
      this.phaseObjective.destroy();
      this.events.off('dimensionChanged', updateDimensionState);
    });
  }

  protected onUpdate(time: number, delta: number): void {
    if (!this.player || !this.player.active) return;
    
    const px = this.player.x;
    const py = this.player.y + 16; // Pés do personagem

    const tile1 = this.camada1.getTileAtWorldXY(px, py);
    const tile2 = this.camada2.getTileAtWorldXY(px, py);
    const tile3 = this.camada3 ? this.camada3.getTileAtWorldXY(px, py) : null;
    const tileRiver = this.riverLayer ? this.riverLayer.getTileAtWorldXY(px, py) : null;

    const isDeadly = tile1?.properties?.deadly || 
                     tile2?.properties?.deadly || 
                     tile3?.properties?.deadly ||
                     tileRiver?.properties?.deadly;

    if (!this.dimensionSystem.isSpirit) {
      if (isDeadly) {
        this.player.setPosition(this.lastSafePosition.x, this.lastSafePosition.y);
        (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        this.cameras.main.shake(100, 0.02);
      } else {
        this.lastSafePosition.set(this.player.x, this.player.y);
      }
    }
  }
}
