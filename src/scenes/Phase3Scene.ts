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
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level3' });

    const imprTileset = map.addTilesetImage('imprtileset', 'img_impr')!;
    
    const todosTilesets = [imprTileset];

    map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0);
    map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0);
    
    if (map.getLayer('Camada de Blocos 3')) {
      map.createLayer('Camada de Blocos 3', todosTilesets, 0, 0);
    }

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

  private showNarrativeDialogue(textMsg: string): void {
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

    const text = this.add.text(centerX, yPos, textMsg, {
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

    this.input.keyboard!.once('keydown-SPACE', () => {
      bg.destroy();
      text.destroy();
      this.isDialogueActive = false;
    });
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
    const returnPortal = this.add.zone(portalX, portalY, 64, 64);
    this.physics.add.existing(returnPortal, true);
    this.physics.add.overlap(this.player, returnPortal, () => {
      if (this.phaseObjective.canComplete()) {
        this.scene.start('Phase4Scene', { spawnX: 96, spawnY: 64 });
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
          this.showNarrativeDialogue("Estou me lembrando... Eu entrei nessa floresta de propósito. Mas por quê");
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

    // Atualiza visibilidade da entidade conforme dimensão
    const updateEntityVisibility = () => {
      entity.setVisible(this.dimensionSystem.isSpirit);
    };
    // The DimensionSystem does not export the specific event key directly beyond what we used in other places. 
    // We can use the EVENTS object or GameEvents depending on refactor state.
    // In DimensionSystem.ts we see it uses `EVENTS.DIMENSION_CHANGED`. Let's just listen to that string.
    this.events.on('dimensionChanged', updateEntityVisibility);

    this.events.once('shutdown', () => {
      this.healthUI.destroy();
      this.phaseObjective.destroy();
      this.events.off('dimensionChanged', updateEntityVisibility);
    });
  }
}
