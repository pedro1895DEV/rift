import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { HealthUI } from '../ui/HealthUI';
import { PhaseObjective } from '../systems/PhaseObjective';
import { Entity } from '../entities/Entity';
import { isDamageable } from '../interfaces/IDamageable';

export class Phase4Scene extends BaseScene {
  private healthUI!: HealthUI;
  private phaseObjective!: PhaseObjective;
  private entity!: Entity;
  private portalsSealed: number = 0;

  constructor() {
    super('Phase4Scene');
  }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('level4', 'assets/tilesets/mapa4.tmj');
    
    // Carregar tilesets do Dark Swamp Starter Pack (podem não existir - fallback para assets.png)
    // Se esses arquivos não existem, o Phaser continuará sem erro na criação do mapa
    this.load.image('WaterAnimation', 'assets/tilesets/WaterAnimation.png');
    this.load.image('GroundTileset', 'assets/tilesets/GroundTileset.png');
    this.load.image('AltarSpritesheet', 'assets/tilesets/AltarSpritesheet.png');
    this.load.image('PropsTileset', 'assets/tilesets/PropsTileset.png');
    this.load.image('Altar0', 'assets/tilesets/Altar0.png');
    
    // Tilesets que garantidamente existem
    this.load.image('assets', 'assets/tilesets/assets.png');
    this.load.image('Plants', 'assets/tilesets/Plants.png');
    
    this.load.spritesheet('entity_idle', 'assets/characters/Idle.png', {
      frameWidth: 44,
      frameHeight: 50
    });
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level4' });

    const tilesets: Phaser.Tilemaps.Tileset[] = [];
    
    // Tentar carregar tilesets conforme aparecem no mapa4.tmj
    // Se não existirem, usam fallback para assets.png (padrão)
    map.tilesets.forEach(t => {
      try {
        // Mapear nome Tiled -> nome da textura carregada
        const textureMap: { [key: string]: string } = {
          'WaterAnimation': 'WaterAnimation',
          'GroundTileset': 'GroundTileset',
          'AltarSpritesheet': 'AltarSpritesheet',
          'PropsTileset': 'PropsTileset',
          'Altar0': 'Altar0',
          'assets': 'assets',
          'Plants': 'Plants'
        };
        
        const textureName = textureMap[t.name] || 'assets';
        const tileset = map.addTilesetImage(t.name, textureName);
        if (tileset) {
          tilesets.push(tileset);
        }
      } catch (e) {
        // Tileset não pôde ser carregado - pular
        console.warn(`[Phase4Scene] Tileset '${t.name}' não carregado. Verifique se a imagem existe.`);
      }
    });

    // Criar layers do mapa
    if (map.getLayer('Camada de Blocos 1')) map.createLayer('Camada de Blocos 1', tilesets, 0, 0);
    if (map.getLayer('Camada de Blocos 2')) map.createLayer('Camada de Blocos 2', tilesets, 0, 0);
    if (map.getLayer('Camada de Blocos 3')) map.createLayer('Camada de Blocos 3', tilesets, 0, 0);

    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    const layer1 = map.getLayer('Camada de Blocos 1');
    if (layer1) {
      layer1.tilemapLayer.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, layer1.tilemapLayer);
    }
    const layer2 = map.getLayer('Camada de Blocos 2');
    if (layer2) {
      layer2.tilemapLayer.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, layer2.tilemapLayer);
    }
    const layer3 = map.getLayer('Camada de Blocos 3');
    if (layer3) {
      layer3.tilemapLayer.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, layer3.tilemapLayer);
    }
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    this.healthUI = new HealthUI(this);
    
    // Objetivo da fase: portais. Não precisamos de kills ou orbes padrão
    this.phaseObjective = new PhaseObjective(this, 0, 0);

    const hasFoundSword = this.registry.get('hasFoundSword') || false;
    this.player.setCanAttack(hasFoundSword);

    const objectLayer = map.getObjectLayer('Objects');

    // Spawn Entity
    let entityX = 400, entityY = 300;
    if (objectLayer) {
      const entObj = objectLayer.objects.find(o => o.name === 'Entity');
      if (entObj) {
        entityX = entObj.x ?? entityX;
        entityY = entObj.y ?? entityY;
      }
    }
    this.entity = new Entity(this, entityX, entityY, this.dimensionSystem);
    this.entity.setTarget(this.player);

    // Collisions Player <-> Entity
    this.physics.add.overlap(this.player, this.entity, () => {
      if (this.dimensionSystem.isSpirit && this.entity.isAlive() && this.entity.isActiveEntity) {
        this.player.takeDamage(1);
      }
    });

    this.physics.add.overlap(this.player.attackHitbox, this.entity, () => {
      if (this.dimensionSystem.isSpirit && this.entity.isActiveEntity) {
        this.entity.takeDamage(1);
      }
    });

    // Configurar Portais
    const portalNames = ['Portal 1', 'Portal 2', 'Portal 3'];
    const interactKey = this.input.keyboard!.addKey('E');

    portalNames.forEach((name, index) => {
      let pX = 200 + index * 150, pY = 200;
      if (objectLayer) {
        const pObj = objectLayer.objects.find(o => o.name === name);
        if (pObj) {
          pX = pObj.x ?? pX;
          pY = pObj.y ?? pY;
        }
      }

      const zone = this.add.zone(pX, pY, 64, 64);
      this.physics.add.existing(zone, true);
      
      const marker = this.add.rectangle(pX, pY, 64, 64, 0xff00ff, 0.4).setDepth(2);
      
      let isNear = false;
      let sealed = false;

      this.physics.add.overlap(this.player, zone, () => {
        isNear = true;
      });

      interactKey.on('down', () => {
        if (isNear && !sealed && this.dimensionSystem.isSpirit) {
          sealed = true;
          this.portalsSealed++;
          marker.fillColor = 0x00ff00; // Verde
          
          if (this.portalsSealed === 1) {
            this.showNarrativeDialogue("Primeiro portal selado. A floresta está enfraquecendo.");
          } else if (this.portalsSealed === 2) {
            this.showNarrativeDialogue("Segundo portal. Ela está ficando mais furiosa...");
          } else if (this.portalsSealed === 3) {
            this.showNarrativeDialogue("Último portal. É agora.");
            this.finishPhase();
          }
          zone.destroy();
        }
      });
      
      this.events.on('update', () => {
        isNear = false;
      });
    });

    this.events.once('shutdown', () => {
      this.healthUI.destroy();
      this.phaseObjective.destroy();
    });
  }

  private finishPhase(): void {
    this.entity.setActive(false);
    this.cameras.main.fadeOut(3000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('VictoryScene');
    });
  }

  protected onUpdate(time: number, delta: number): void {
    if (!this.player || !this.player.active) return;
    if (this.entity) this.entity.update();
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
}