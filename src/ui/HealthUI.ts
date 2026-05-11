import Phaser from 'phaser';
import { GameEvents, HealthChangedPayload } from '../events/GameEvents';

export class HealthUI {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const cam = this.scene.cameras.main;
    const zoom = cam.zoom;
    
    // Container para agrupar elementos da UI de vida
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000);
    this.container.setScale(1 / zoom);

    // Texto de vida (Placeholder visual: Corações ou texto)
    this.text = this.scene.add.text(10, 10, 'HP: ---', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ff5555',
      stroke: '#000000',
      strokeThickness: 3
    });

    this.container.add(this.text);

    // Registrar listener
    this.scene.events.on(GameEvents.HEALTH_CHANGED, this.handleHealthChanged, this);
    
    // Posicionamento inicial
    this.updatePosition();
    this.scene.scale.on('resize', this.updatePosition, this);
  }

  private updatePosition(): void {
    const cam = this.scene.cameras.main;
    const zoom = cam.zoom;
    const w = cam.width;
    const h = cam.height;

    // Posiciona no canto superior esquerdo da área visível (com zoom)
    const visibleLeftX = (w / 2) - ((w / 2) / zoom);
    const visibleTopY = (h / 2) - ((h / 2) / zoom);

    this.container.setPosition(visibleLeftX + (10 / zoom), visibleTopY + (30 / zoom));
  }

  private handleHealthChanged(payload: HealthChangedPayload): void {
    const hearts = '❤'.repeat(payload.current) + '🖤'.repeat(payload.max - payload.current);
    this.text.setText(`LIFE: ${hearts}`);
  }

  public destroy(): void {
    this.scene.events.off(GameEvents.HEALTH_CHANGED, this.handleHealthChanged, this);
    this.scene.scale.off('resize', this.updatePosition, this);
    this.container.destroy();
  }
}
