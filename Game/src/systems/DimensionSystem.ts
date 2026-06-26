import Phaser from 'phaser';
import { Dimension, EVENTS } from '../types';

export class DimensionSystem {
  private scene: Phaser.Scene;
  private current: Dimension = Dimension.REAL;

  // tiles/objetos colidíveis aqui 
  readonly realGroup:   Phaser.Physics.Arcade.StaticGroup;
  readonly spiritGroup: Phaser.Physics.Arcade.StaticGroup;

  // Energia máxima antes de ser forçado de volta ao mundo real 
  static readonly MAX_ENERGY = 100;
  private _energy = DimensionSystem.MAX_ENERGY;

  // Taxa de drenagem e recarga: pontos por segundo no mundo espiritual
  private drainRate = 12;
  private rechargeRate = 5;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.realGroup   = scene.physics.add.staticGroup();
    this.spiritGroup = scene.physics.add.staticGroup();
  }

  get active():   Dimension { return this.current; }
  get isReal():   boolean   { return this.current === Dimension.REAL; }
  get isSpirit(): boolean   { return this.current === Dimension.SPIRIT; }
  get energy():   number    { return this._energy; }

  addToReal(obj: Phaser.GameObjects.GameObject): void {
    this.realGroup.add(obj, true);
  }

  addToSpirit(obj: Phaser.GameObjects.GameObject): void {
    this.spiritGroup.add(obj, true);
  }

  // Alternador de dimensões
  switch(): void {
    if (this.isReal && this._energy <= 0) return; // não pode entrar com 0 energia

    this.current = this.isReal ? Dimension.SPIRIT : Dimension.REAL;

    this._updateVisibility();
    this._playTransitionFX();

    this.scene.events.emit(EVENTS.DIMENSION_CHANGED, this.current);
  }

  // Atualiza a energia com base no tempo
  update(delta: number): void {
    if (this.isSpirit) {
      // Drenando energia no mundo espiritual
      this._energy = Math.max(0, this._energy - this.drainRate * (delta / 1000));
      this.scene.events.emit(EVENTS.ENERGY_CHANGED, this._energy);

      if (this._energy <= 0) {
        this.switch(); // volta forçado ao mundo real
      }
    } else {
      // Recarregando energia no mundo real
      if (this._energy < DimensionSystem.MAX_ENERGY) {
        this._energy = Math.min(DimensionSystem.MAX_ENERGY, this._energy + this.rechargeRate * (delta / 1000));
        this.scene.events.emit(EVENTS.ENERGY_CHANGED, this._energy);
      }
    }
  }

  restoreEnergy(amount: number): void {
    this._energy = Math.min(DimensionSystem.MAX_ENERGY, this._energy + amount);
    this.scene.events.emit(EVENTS.ENERGY_CHANGED, this._energy);
  }

  // Reset total (início de fase / respawn) 
  resetEnergy(): void {
    this._energy = DimensionSystem.MAX_ENERGY;
    this.scene.events.emit(EVENTS.ENERGY_CHANGED, this._energy);
  }

  // Ap
  applyEnergyPenalty(amount: number): void {
    this._energy = Math.max(0, this._energy - amount);
    this.scene.events.emit(EVENTS.ENERGY_CHANGED, this._energy);
    if (this._energy <= 0 && this.isSpirit) {
      this.switch(); // volta forçado ao mundo real
    }
  }

  private _updateVisibility(): void {
    // Alterna visibilidade de grupos específicos
    this.realGroup.setVisible(this.isReal);
    this.spiritGroup.setVisible(this.isSpirit);

    // Alterna corpos físicos
    this.realGroup.getChildren().forEach(child => {
      const body = (child as any).body as Phaser.Physics.Arcade.StaticBody | null;
      if (body) body.enable = this.isReal;
    });

    this.spiritGroup.getChildren().forEach(child => {
      const body = (child as any).body as Phaser.Physics.Arcade.StaticBody | null;
      if (body) body.enable = this.isSpirit;
    });

    // APLICAR FILTRO GLOBAL NO MAPA E OBJETOS
    const tintColor = this.isSpirit ? 0x7ec8e3 : 0xffffff;

    this.scene.children.list.forEach(child => {
      // Aplica o tom em Sprites, Imagens e Camadas de Tiles que não sejam UI (depth < 100)
      if ((child as any).setTint && (child as any).depth < 100) {
        (child as any).setTint(tintColor);
      }
    });
  }

  private _playTransitionFX(): void {
    const cam = this.scene.cameras.main;

    // Flash breve: quente (real) ou frio (espírito)
    const color = this.isSpirit
      ? 0x7ec8e3  // ciano para espírito
      : 0xf4a261; // âmbar para real

    cam.flash(200, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, false);
    
    // Pequeno tremor na troca
    cam.shake(150, 0.002);
  }
}