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

  constructor() {
    super('Phase2Scene');
  }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('level2', 'assets/tilesets/mapa2.tmj');
    this.load.image('img_chest', 'assets/tilesets/chest.png');
    this.load.spritesheet('rats', 'assets/tilesets/Rats.png', {
      frameWidth: 48,
      frameHeight: 48
    });
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'level2' });

    const tileset       = map.addTilesetImage('tiles', 'img_tiles')!;
    const waterTileset  = map.addTilesetImage('water_animation_demo', 'img_water')!;
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

    const ratPositions = [
      { x: 41 * 32 + 16 - 60, y: 2 * 32 + 16, var: 0 },
      { x: 41 * 32 + 16 + 60, y: 2 * 32 + 16, var: 1 },
      { x: 41 * 32 + 16, y: 2 * 32 + 16 + 60, var: 2 }
    ];

    this.phaseObjective = new PhaseObjective(this, 1, ratPositions.length);

    const returnPortal = this.add.zone(128, 1424, 64, 32);
    this.physics.add.existing(returnPortal, true);
    this.physics.add.overlap(this.player, returnPortal, () => {
      if (this.phaseObjective.canComplete()) {
        this.scene.start('GameScene', { spawnX: 96, spawnY: 64 });
      } else {
        this.cameras.main.shake(100, 0.01);
      }
    });

    // Baú da espada
    let chestX = 5 * 32 + 16;
    let chestY = 40 * 32 + 16;
    if (map.getObjectLayer('Objects')) {
      const chestObj = map.findObject('Objects', obj => obj.name === 'sword_chest');
      if (chestObj) {
        chestX = chestObj.x ?? chestX;
        chestY = chestObj.y ?? chestY;
      }
    }
    const chestZone = this.add.zone(chestX, chestY, 48, 48);
    this.physics.add.existing(chestZone, true);
    
    let chestInteracted = hasFoundSword;
    const interactKey = this.input.keyboard!.addKey('E');

    this.physics.add.overlap(this.player, chestZone, () => {
      if (!chestInteracted && Phaser.Input.Keyboard.JustDown(interactKey)) {
        chestInteracted = true;
        this.registry.set('hasFoundSword', true);
        this.player.setCanAttack(true);
        this.events.emit(GameEvents.SWORD_FOUND);
        this.showNarrativeDialogue("Uma espada mágica... Isso pode me ajudar.");
        chestZone.destroy();
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
    this.rats.getChildren().forEach((rat) => {
      (rat as RatEnemy).update();
    });
  }
}
