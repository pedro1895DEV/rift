import Phaser from 'phaser';
import { DimensionSystem } from '../systems/DimensionSystem';
import { GameEvents, HealthChangedPayload } from '../events/GameEvents';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private dimensionSystem: DimensionSystem;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys & {
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
    space: Phaser.Input.Keyboard.Key;
  };
  private speed: number = 200;

  // Sistema de Vida
  private maxHealth: number = 3;
  private currentHealth: number = 3;

  // Combate
  private _attackHitbox!: Phaser.GameObjects.Zone;
  private lastFacing: 'up' | 'down' | 'left' | 'right' = 'down';
  private lastAttackTime: number = 0;
  private attackDelay: number = 500;
  private canAttack: boolean = false;
  private isCurrentlyTinted: boolean = false;
  private isInvulnerable: boolean = false;

  // Sistema de combo de ataque (alternância visual entre attack1 e attack2)
  private comboStep: 1 | 2 = 1;
  private comboWindow: number = 800; // ms máximos entre ataques para manter o combo
  private isAttacking: boolean = false;

  public get attackHitbox(): Phaser.GameObjects.Zone {
    return this._attackHitbox;
  }

  public setCanAttack(value: boolean): void {
    this.canAttack = value;
  }

  public getCanAttack(): boolean {
    return this.canAttack;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, dimensionSystem: DimensionSystem) {
    super(scene, x, y, 'idle_down');
    this.dimensionSystem = dimensionSystem;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configuração da Hitbox física (estimativa inicial para frame 96x80 — pode precisar de ajuste fino visual)
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(24, 32);
    body.setOffset(36, 28);
    body.setCollideWorldBounds(true);

    // Inicialização da Hitbox de Ataque
    this._attackHitbox = scene.add.zone(x, y, 40, 40);
    scene.physics.add.existing(this._attackHitbox);
    (this._attackHitbox.body as Phaser.Physics.Arcade.Body).enable = false;

    // Inicialização do Input
    if (scene.input.keyboard) {
      this.cursors = {
        ...scene.input.keyboard.createCursorKeys(),
        w: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        a: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        s: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        d: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        space: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
      };
    }

    this.createAnimations();
    
    // Emitir estado inicial de vida no próximo frame para garantir que a UI já exista
    scene.time.delayedCall(10, () => this.emitHealth());

    // Otimização de Tint: Ouvir mudança de dimensão em vez de verificar a cada frame
    this.setTint(this.dimensionSystem.isSpirit ? 0x7ec8e3 : 0xffffff);
    this.scene.events.on(GameEvents.DIMENSION_CHANGED, () => {
      if (this.currentHealth > 0 && !this.isCurrentlyTinted) {
        this.setTint(this.dimensionSystem.isSpirit ? 0x7ec8e3 : 0xffffff);
      }
    });

    // Limpar flag de ataque quando qualquer animação de ataque terminar
    this.on('animationcomplete', (anim: Phaser.Animations.Animation) => {
      if (anim.key.startsWith('attack')) {
        this.isAttacking = false;
      }
    });
  }

  private emitHealth(): void {
    const payload: HealthChangedPayload = {
      current: this.currentHealth,
      max: this.maxHealth
    };
    this.scene.events.emit(GameEvents.HEALTH_CHANGED, payload);
  }

  public takeDamage(amount: number): void {
    if (this.currentHealth <= 0) return;
    if (this.isInvulnerable) return;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.emitHealth();

    // Ativar invulnerabilidade
    this.isInvulnerable = true;

    // Feedback visual simples
    this.setTint(0xff0000);
    this.isCurrentlyTinted = true;
    this.scene.time.delayedCall(150, () => {
      this.clearTint();
      this.isCurrentlyTinted = false;
      if (this.currentHealth > 0) {
        this.setTint(this.dimensionSystem.isSpirit ? 0x7ec8e3 : 0xffffff);
      }
    });

    // Efeito de piscagem durante invulnerabilidade
    const blinkTween = this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 100,
      repeat: 7,
      yoyo: true
    });

    // Remover invulnerabilidade após 1500ms
    this.scene.time.delayedCall(1500, () => {
      this.isInvulnerable = false;
      if (blinkTween.isActive()) {
        blinkTween.stop();
      }
      this.setAlpha(1);
    });

    if (this.currentHealth <= 0) {
      this.die();
    }
  }

  private attack(): void {
    // Combo: resetar para attack1 se passou mais que comboWindow desde o último golpe
    if (this.scene.time.now - this.lastAttackTime > this.comboWindow) {
      this.comboStep = 1;
    }

    this.lastAttackTime = this.scene.time.now;

    // Sinalizar que a animação de ataque está em execução
    this.isAttacking = true;

    // Tocar animação do combo correspondente à direção atual
    this.play(`attack${this.comboStep}_${this.lastFacing}`, true);

    // Alternar passo do combo para o próximo ataque
    this.comboStep = this.comboStep === 1 ? 2 : 1;

    let hx = this.x;
    let hy = this.y;
    const offset = 32;

    if (this.lastFacing === 'left') hx -= offset;
    else if (this.lastFacing === 'right') hx += offset;
    else if (this.lastFacing === 'up') hy -= offset;
    else if (this.lastFacing === 'down') hy += offset;

    this._attackHitbox.setPosition(hx, hy);
    const body = this._attackHitbox.body as Phaser.Physics.Arcade.Body;
    body.enable = true;

    // Efeito de ataque (feedback leve do sprite)
    this.scene.tweens.add({
      targets: this,
      x: hx * 0.2 + this.x * 0.8,
      y: hy * 0.2 + this.y * 0.8,
      duration: 50,
      yoyo: true
    });

    // Desabilita a hitbox logo em seguida
    this.scene.time.delayedCall(150, () => {
      body.enable = false;
    });
  }

  private die(): void {
    // Lógica de morte simplificada para esta etapa
    this.setAngle(90);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    (this.body as Phaser.Physics.Arcade.Body).enable = false;
    this.scene.events.emit(GameEvents.PLAYER_DIED);
  }

  private createAnimations(): void {
    const directions = ['down', 'left', 'right', 'up'] as const;
    const animConfigs: { type: string; frameRate: number; repeat: number }[] = [
      { type: 'idle',    frameRate: 8,  repeat: -1 },
      { type: 'run',     frameRate: 12, repeat: -1 },
      { type: 'attack1', frameRate: 16, repeat: 0  },
      { type: 'attack2', frameRate: 16, repeat: 0  },
    ];

    animConfigs.forEach(({ type, frameRate, repeat }) => {
      directions.forEach(dir => {
        const key = `${type}_${dir}`;
        if (!this.scene.anims.exists(key)) {
          this.scene.anims.create({
            key,
            frames: this.scene.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
            frameRate,
            repeat
          });
        }
      });
    });
  }

  update(): void {
    if (this.currentHealth <= 0) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    body.setVelocity(0, 0);

    const up    = this.cursors.up.isDown    || this.cursors.w.isDown;
    const down  = this.cursors.down.isDown  || this.cursors.s.isDown;
    const left  = this.cursors.left.isDown  || this.cursors.a.isDown;
    const right = this.cursors.right.isDown || this.cursors.d.isDown;

    if (left)       { body.setVelocityX(-this.speed); this.lastFacing = 'left'; }
    else if (right) { body.setVelocityX(this.speed);  this.lastFacing = 'right'; }

    if (up)         { body.setVelocityY(-this.speed); this.lastFacing = 'up'; }
    else if (down)  { body.setVelocityY(this.speed);  this.lastFacing = 'down'; }

    // Normaliza velocidade e troca animação — não sobrescreve durante ataque
    if (!this.isAttacking) {
      if (body.velocity.length() > 0) {
        body.velocity.normalize().scale(this.speed);
        this.play(`run_${this.lastFacing}`, true);
      } else {
        this.play(`idle_${this.lastFacing}`, true);
      }
    } else if (body.velocity.length() > 0) {
      // Mesmo atacando, normaliza a velocidade se o jogador estiver se movendo
      body.velocity.normalize().scale(this.speed);
    }

    if (this.canAttack && this.cursors.space.isDown && this.scene.time.now - this.lastAttackTime > this.attackDelay) {
      this.attack();
    }
  }
}