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
  private channelDuration: number = 1800; // ms para selar (ajustável)
  private interactKey!: Phaser.Input.Keyboard.Key;
  private portalsData: {
    x: number;
    y: number;
    name: string;
    sealed: boolean;
    progress: number;
    sprite: Phaser.GameObjects.Sprite;
    barBg: Phaser.GameObjects.Rectangle;
    barFill: Phaser.GameObjects.Graphics;
  }[] = [];
  private portalsUnlocked: boolean = false;

  constructor() {
    super('Phase4Scene');
  }

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

  protected onPreload(): void {
    this.load.audio('bgm_phase4_prefight', 'assets/sounds/bgm/universfield-horror-background-atmosphere-03-166106-PHASE4-LOOP-PREFIGHT.mp3');
    this.load.audio('bgm_phase4_fight', 'assets/sounds/bgm/alec_koff-epic-fight-487416-PHASE4-LOOP-FIGHT.mp3');
    // this.load.audio('bgm_phase4_fight_alt', 'assets/sounds/bgm/thefealdoproject-music-for-trailers-mysterious-229751-PHASE4-OU-3.mp3');

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
    this.load.spritesheet('green_portal', 'assets/tilesets/Green%20Portal%20Sprite%20Sheet.png', {
      frameWidth: 64,
      frameHeight: 64
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
    this.disableSpiritBgm = true;
    
    this.currentBgm = this.sound.add('bgm_phase4_prefight', { loop: true, volume: 0.5 });
    this.currentBgm.play();

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

    // Sequência de lore ao se aproximar da Árvore Ancestral (disparo único)
    const loreMessages = [
      "A Árvore Ancestral... finalmente a encontrei. Ela pulsa com uma energia corrompida.",
      "Três portais foram abertos aqui, conectando esse lugar ao vazio entre os mundos.",
      "Preciso selar os três para fechar essa brecha — e talvez, finalmente, voltar para casa.",
      "Mas ela não vai deixar por menos. Preciso selar os portais com [E], sempre no plano espiritual."
    ];

    const showLoreSequence = (index: number) => {
      if (index >= loreMessages.length) {
        if (this.currentBgm) this.currentBgm.stop();
        
        this.currentBgm = this.sound.add('bgm_phase4_fight', { loop: true, volume: 0.5 });
        // this.currentBgm = this.sound.add('bgm_phase4_fight_alt', { loop: true, volume: 0.5 });
        
        this.currentBgm.play();
        return;
      }
      this.showNarrativeDialogue(loreMessages[index], () => {
        showLoreSequence(index + 1);
      });
    };

    let treeX = entityX, treeY = entityY; // fallback: mesma posição de Entity se 'Tree' não existir
    if (objectLayer) {
      const treeObj = objectLayer.objects.find(o => o.name === 'Tree');
      if (treeObj) {
        treeX = treeObj.x ?? treeX;
        treeY = treeObj.y ?? treeY;
      }
    }

    const loreZone = this.add.zone(treeX, treeY, 100, 100);
    this.physics.add.existing(loreZone, true);
    let loreShown = false;
    this.physics.add.overlap(this.player, loreZone, () => {
      if (!loreShown) {
        loreShown = true;
        this.entity.activate();
        this.portalsUnlocked = true;
        this.portalsData.forEach(data => {
          data.sprite.setVisible(true);
          data.barBg.setVisible(true);
        });
        showLoreSequence(0);
      }
    });

    // Collisions Player <-> Entity
    this.physics.add.overlap(this.player, this.entity, () => {
      if (this.dimensionSystem.isSpirit || this.entity.hasBecomeAggressive) {
        if (this.entity.isAlive() && this.entity.isActiveEntity) {
          this.player.takeDamage(1);
          this.resetAllChannelProgress();
        }
      } else {
        this.entity.spookAway(this.player.x, this.player.y);
      }
    });

    this.physics.add.overlap(this.player.attackHitbox, this.entity, () => {
      if (this.dimensionSystem.isSpirit && this.entity.isActiveEntity && this.entity.hasBecomeAggressive) {
        this.entity.takeDamage(1);
      }
    });

    // Configurar Portais
    const portalNames = ['Portal1', 'Portal2', 'Portal3'];
    this.interactKey = this.input.keyboard!.addKey('E');

    this.anims.create({
      key: 'portal_idle_4',
      frames: this.anims.generateFrameNumbers('green_portal', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: -1
    });

    portalNames.forEach((name, index) => {
      let pX = 200 + index * 150, pY = 200;
      if (objectLayer) {
        const pObj = objectLayer.objects.find(o => o.name === name);
        if (pObj) {
          pX = pObj.x ?? pX;
          pY = pObj.y ?? pY;
        }
      }

      const portalSprite = this.add.sprite(pX, pY, 'green_portal').setDepth(2).play('portal_idle_4').setVisible(false);
      const barBg = this.add.rectangle(pX, pY - 50, 50, 8, 0x000000, 0.6).setDepth(3).setVisible(false);
      const barFill = this.add.graphics().setDepth(4);

      this.portalsData.push({
        x: pX, y: pY, name,
        sealed: false, progress: 0,
        sprite: portalSprite, barBg, barFill
      });
    });

    this.events.once('shutdown', () => {
      this.healthUI.destroy();
      this.phaseObjective.destroy();
      if (this.currentBgm) this.currentBgm.stop();
    });
  }

  private sealPortal(data: {
    sealed: boolean;
    sprite: Phaser.GameObjects.Sprite;
    barBg: Phaser.GameObjects.Rectangle;
    barFill: Phaser.GameObjects.Graphics;
  }): void {
    data.sealed = true;
    data.sprite.setTint(0x00ff00);
    data.barBg.setVisible(false);
    data.barFill.clear();
    this.portalsSealed++;
    this.entity.onPortalSealed();

    if (this.portalsSealed === 1) {
      this.showNarrativeDialogue("Primeiro portal selado. A floresta está enfraquecendo.");
    } else if (this.portalsSealed === 2) {
      this.showNarrativeDialogue("Segundo portal. Ela está ficando mais furiosa...");
    } else if (this.portalsSealed === 3) {
      this.showNarrativeDialogue("Último portal. É agora.");
      this.finishPhase();
    }
  }

  private resetAllChannelProgress(): void {
    this.portalsData.forEach(data => { data.progress = 0; });
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

    this.portalsData.forEach(data => {
      if (!this.portalsUnlocked || data.sealed) return;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, data.x, data.y);
      const canChannel = dist < 64 && this.dimensionSystem.isSpirit && this.interactKey.isDown;

      if (canChannel) {
        data.progress += delta;
        if (data.progress >= this.channelDuration) {
          this.sealPortal(data);
          return;
        }
      } else {
        data.progress = 0;
      }

      const pct = Phaser.Math.Clamp(data.progress / this.channelDuration, 0, 1);
      data.barFill.clear();
      if (pct > 0) {
        data.barFill.fillStyle(0x00ffaa, 1);
        data.barFill.fillRect(data.x - 24, data.y - 53, 48 * pct, 6);
      }
    });
  }
}