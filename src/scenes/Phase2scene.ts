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

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    this.healthUI = new HealthUI(this);

    const ratPositions = [
      { x: 41 * 32 + 16 - 60, y: 2 * 32 + 16, var: 0 },
      { x: 41 * 32 + 16 + 60, y: 2 * 32 + 16, var: 1 },
      { x: 41 * 32 + 16, y: 2 * 32 + 16 + 60, var: 2 }
    ];

    this.phaseObjective = new PhaseObjective(this, 1, ratPositions.length); // Validação do total de mortes com o array real

    const returnPortal = this.add.zone(128, 1424, 64, 32);
    this.physics.add.existing(returnPortal, true);
    this.physics.add.overlap(this.player, returnPortal, () => {
      if (this.phaseObjective.canComplete()) {
        this.scene.start('GameScene', { spawnX: 96, spawnY: 64 });
      } else {
        // Feedback visual de bloqueio
        this.cameras.main.shake(100, 0.01);
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
      (o as Orb).collect();
      this.events.emit(GameEvents.ORB_COLLECTED, { current: 1, required: 1 });
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
