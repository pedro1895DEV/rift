import Phaser from 'phaser';
import { BaseScene } from './BaseScene';
import { Orb } from '../objects/Orb';
import { RatEnemy } from '../entities/RatEnemy';
import { HealthUI } from '../ui/HealthUI';
import { PhaseObjective } from '../systems/PhaseObjective';
import { GameEvents } from '../events/GameEvents';
import { isDamageable } from '../interfaces/IDamageable';

export class Phase2Scene extends BaseScene {
  private orbs!: Phaser.Physics.Arcade.StaticGroup;
  private rats!: Phaser.Physics.Arcade.Group;
  private healthUI!: HealthUI;
  private phaseObjective!: PhaseObjective;
  private isNearChest: boolean = false;
  private chestZoneRef!: Phaser.GameObjects.Zone;
  private chestInteracted: boolean = false;
  private interactHint!: Phaser.GameObjects.Text;

  constructor() {
    super('Phase2Scene');
  }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('level2', 'assets/tilesets/mapa2.tmj');

    // Carregar todas as imagens de tileset usadas no mapa2.tmj
    this.load.image('img_tiles', 'assets/tilesets/tiles.png');
    this.load.image('img_water', 'assets/tilesets/water_animation_demo.png');
    this.load.image('img_assets', 'assets/tilesets/assets.png');
    this.load.image('img_grass', 'assets/tilesets/TX Tileset Grass.png');
    this.load.image('img_props', 'assets/tilesets/TX Props.png');
    this.load.image('img_plant_shadow', 'assets/tilesets/TX Plant with Shadow.png');
    this.load.image('img_props_shadow', 'assets/tilesets/TX Props with Shadow.png');
    this.load.image('img_wall', 'assets/tilesets/TX Tileset Wall.png');
    this.load.image('img_plant', 'assets/tilesets/TX Plant.png');

    // Imagens dedicadas para uso como tileset no mapa
    this.load.image('img_chest_tileset', 'assets/tilesets/chest.png');
    this.load.image('img_rats_tileset', 'assets/tilesets/Rats.png');

    this.load.spritesheet('rats', 'assets/tilesets/Rats.png', {
      frameWidth: 48,
      frameHeight: 48
    });

    this.load.spritesheet('purple_portal', 'assets/tilesets/Purple%20Portal%20Sprite%20Sheet.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level2' });

    const tileset       = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset  = map.addTilesetImage('water_animation_demo', 'img_water')!;
    const assetsTileset = map.addTilesetImage('assets', 'img_assets')!;
    const grassTileset  = map.addTilesetImage('TX Tileset Grass', 'img_grass')!;
    const propsTileset  = map.addTilesetImage('TX Props', 'img_props')!;
    const plantShadowTileset = map.addTilesetImage('TX Plant with Shadow', 'img_plant_shadow')!;
    const propsShadowTileset = map.addTilesetImage('TX Props with Shadow', 'img_props_shadow')!;
    const wallTileset   = map.addTilesetImage('TX Tileset Wall', 'img_wall')!;
    const plantTileset  = map.addTilesetImage('TX Plant', 'img_plant')!;
    const chestTileset  = map.addTilesetImage('Chest_spritesheet', 'img_chest_tileset')!;
    const ratsTileset   = map.addTilesetImage('Rats', 'img_rats_tileset')!;

    const todosTilesets = [tileset, waterTileset, assetsTileset, grassTileset, propsTileset, plantShadowTileset, propsShadowTileset, wallTileset, plantTileset, chestTileset, ratsTileset];
map.createLayer('Camada de Blocos 1', todosTilesets, 0, 0); // mais atrás no Tiled
map.createLayer('Camada de Blocos 4', todosTilesets, 0, 0);
map.createLayer('Camada de Blocos 2', todosTilesets, 0, 0);
map.createLayer('Camada de Blocos 3', todosTilesets, 0, 0); // mais na frente no Tiled
    // map.createObjectLayer('Objects', todosTilesets, 0, 0);

    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    const camada1 = map.getLayer('Camada de Blocos 1')?.tilemapLayer;
    const camada2 = map.getLayer('Camada de Blocos 2')?.tilemapLayer;
    const camada3 = map.getLayer('Camada de Blocos 3')?.tilemapLayer;
    const camada4 = map.getLayer('Camada de Blocos 4')?.tilemapLayer;

    if (camada1) {
      camada1.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, camada1);
    }
    if (camada2) {
      camada2.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, camada2);
    }
    if (camada3) {
      camada3.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, camada3);
    }
    if (camada4) {
      camada4.setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.player, camada4);
    }
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    this.healthUI = new HealthUI(this);

    // Estado inicial do ataque
    const hasFoundSword = this.registry.get('hasFoundSword') || false;
    this.player.setCanAttack(hasFoundSword);

    const ratPositions = [
      { x: 41 * 32 + 16 - 60, y: 2 * 32 + 16, var: 0 },
      { x: 41 * 32 + 16 + 60, y: 2 * 32 + 16, var: 1 },
      { x: 41 * 32 + 16, y: 2 * 32 + 16 + 60, var: 2 }
    ];

    this.phaseObjective = new PhaseObjective(this, 1, ratPositions.length);

    const objectLayer = map.getObjectLayer('Objects');

    let transitioning = false;
    let portalX = 1328; // Fallback perto da orbe (41 * 32 + 16)
    let portalY = 144;
    
    if (objectLayer) {
      const exitObj = objectLayer.objects.find(o => o.name === 'phase2_exit');
      if (exitObj) {
        portalX = exitObj.x ?? portalX;
        portalY = exitObj.y ?? portalY;
      }
    }

    this.anims.create({
      key: 'portal_idle',
      frames: this.anims.generateFrameNumbers('purple_portal', { start: 0, end: 7 }),
      frameRate: 15,
      repeat: -1
    });
    this.add.sprite(portalX, portalY, 'purple_portal').setDepth(2).play('portal_idle');

    const returnPortal = this.add.zone(portalX, portalY, 64, 32);
    this.physics.add.existing(returnPortal, true);
    this.physics.add.overlap(this.player, returnPortal, () => {
      if (transitioning) return;
      if (this.phaseObjective.canComplete()) {
        transitioning = true;
        this.scene.start('Phase3Scene', { spawnX: 96, spawnY: 64 });
      } else {
        this.cameras.main.shake(100, 0.01);
      }
    });

    // Baú da espada
    let chestX = 5 * 32 + 16;
    let chestY = 40 * 32 + 16;
    
    if (objectLayer) {
      const chestObj = objectLayer.objects.find(o => o.name === 'sword_chest');
      if (chestObj) {
        chestX = chestObj.x ?? chestX;
        chestY = chestObj.y ?? chestY;
      } else {
        // console.warn('Aviso: Objeto "sword_chest" não encontrado na layer "Objects". Usando fallback.');
      }
    } else {
      // console.warn('Aviso: Layer "Objects" não encontrada no mapa. Usando fallback.');
    }

    // Objetos inseridos como tile no Tiled geralmente têm a âncora (origin) em bottom-left (0, 1).
    const chestZone = this.add.zone(chestX, chestY, 64, 64).setOrigin(0.5, 0.5);
    this.physics.add.existing(chestZone, true);
    this.chestZoneRef = chestZone;

    this.chestInteracted = hasFoundSword;

    this.interactHint = this.add.text(chestX, chestY - 40, 'Pressione a tecla [E]', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(6).setVisible(false);

    const interactKey = this.input.keyboard!.addKey('E');

    interactKey.on('down', () => {
      if (this.isNearChest && !this.chestInteracted) {
        this.chestInteracted = true;
        this.interactHint.setVisible(false);
        this.registry.set('hasFoundSword', true);
        this.player.setCanAttack(true);
        this.events.emit(GameEvents.SWORD_FOUND);
        this.showNarrativeDialogue("Uma espada mágica... Isso pode me ajudar.\nUse ESPAÇO para atacar os inimigos.");
      }
    });

    // Grupos de Objetos
    this.orbs = this.physics.add.staticGroup();
    this.rats = this.physics.add.group();

    const orbX = 41 * 32 + 16;
    const orbY = 2 * 32 + 16;
    const orb = new Orb(this, orbX, orbY);
    this.orbs.add(orb);

    ratPositions.forEach(pos => {
      const rat = new RatEnemy(this, pos.x, pos.y, pos.var);
      rat.setTarget(this.player);
      this.rats.add(rat);
    });

    this.physics.add.overlap(this.player, this.orbs, (_p, o) => {
      if (this.phaseObjective.currentKills >= this.phaseObjective.requiredKills) {
        (o as Orb).collect();
        this.events.emit(GameEvents.ORB_COLLECTED, { current: 1, required: 1 });
        this.showNarrativeDialogue("Rodrigo Bjordans... Esse é meu nome. Sou um manipulador de medicamentos. Mas por que estou aqui");
      } else {
        this.cameras.main.shake(100, 0.01);
      }
    });

    const camada1 = map.getLayer('Camada de Blocos 1')!.tilemapLayer;
    const camada2 = map.getLayer('Camada de Blocos 2')!.tilemapLayer;
    
    this.physics.add.collider(this.rats, camada1);
    this.physics.add.collider(this.rats, camada2);
    
    // Dano do inimigo no player
    this.physics.add.overlap(this.player, this.rats, (_p, enemy) => {
      if (isDamageable(enemy) && enemy.isAlive()) {
        this.player.takeDamage(1);
      }
    });

    // Dano do player no inimigo
    this.physics.add.overlap(this.player.attackHitbox, this.rats, (_hitbox, enemy) => {
      if (isDamageable(enemy) && enemy.isAlive()) {
        enemy.takeDamage(1);
      }
    });

    this.events.once('shutdown', () => {
      this.healthUI.destroy();
      this.phaseObjective.destroy();
    });
  }

  protected onUpdate(): void {
    this.isNearChest = this.chestZoneRef && this.chestZoneRef.active ? this.physics.overlap(this.player, this.chestZoneRef) : false;
    this.interactHint.setVisible(this.isNearChest && !this.chestInteracted);
    this.rats.getChildren().forEach((rat) => {
      (rat as RatEnemy).update();
    });
  }
}
