import Phaser from 'phaser';
import { DimensionSystem } from './DimensionSystem';
import { Dimension, EVENTS } from '../types';

export class DimensionUI {
  private scene: Phaser.Scene;
  private dimensionSystem: DimensionSystem;
  
  private container: Phaser.GameObjects.Container;
  private bgBar: Phaser.GameObjects.Graphics;
  private fillBar: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;

  private barWidth = 150;
  private barHeight = 15;

  constructor(scene: Phaser.Scene, dimensionSystem: DimensionSystem) {
    this.scene = scene;
    this.dimensionSystem = dimensionSystem;

    // Criar o container
    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(1000); 

    this.bgBar = this.scene.add.graphics();
    this.bgBar.fillStyle(0x000000, 0.8);
    this.bgBar.fillRect(0, 0, this.barWidth, this.barHeight);
    this.bgBar.lineStyle(2, 0xffffff, 1);
    this.bgBar.strokeRect(0, 0, this.barWidth, this.barHeight);

    this.fillBar = this.scene.add.graphics();
    
    this.text = this.scene.add.text(this.barWidth / 2, this.barHeight / 2, 'ESPÍRITO', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // O displayList ser null aqui para bgBar e fillBar é o comportamento normal
    // do Phaser 3 quando adicionamos objetos a um Container. O Container passa a
    // ser o responsável por renderizá-los.
    this.container.add([this.bgBar, this.fillBar, this.text]);

    this.container.setVisible(this.dimensionSystem.isSpirit);

    // Posicionar a barra com a matemática correta para o zoom 4x
    this.updatePosition();

    // Ouvir eventos
    this.scene.events.on(EVENTS.DIMENSION_CHANGED, this.handleDimensionChange, this);
    this.scene.events.on(EVENTS.ENERGY_CHANGED, this.handleEnergyChange, this);
    this.scene.scale.on('resize', this.updatePosition, this);
    
    this.updateBar(this.dimensionSystem.energy);
  }

  private updatePosition(): void {
    const cam = this.scene.cameras.main;
    const zoom = cam.zoom;
    
    // Matemática exata do Phaser 3 para posicionar objetos com setScrollFactor(0) 
    // em câmeras com zoom. O centro da câmera funciona como um pivô de escala.
    const w = cam.width;
    const h = cam.height;
    
    // Calcula as bordas visíveis no sistema de coordenadas sem zoom
    const visibleRightX = (w / 2) + ((w / 2) / zoom);
    const visibleTopY = (h / 2) - ((h / 2) / zoom);
    
    const padding = 10 / zoom;
    const scaledWidth = this.barWidth / zoom;
    
    // Compensa o tamanho visual (senão a barra ficaria 4x maior)
    this.container.setScale(1 / zoom);
    
    // Posiciona exatamente no canto superior direito da área visível
    this.container.setPosition(visibleRightX - scaledWidth - padding, visibleTopY + padding);
  }

  private handleDimensionChange(dimension: Dimension): void {
    this.container.setVisible(dimension === Dimension.SPIRIT);
  }

  private handleEnergyChange(energy: number): void {
    this.updateBar(energy);
  }

  private updateBar(energy: number): void {
    const percentage = energy / DimensionSystem.MAX_ENERGY;
    const fillWidth = (this.barWidth - 4) * percentage;

    this.fillBar.clear();
    
    let color = 0x7ec8e3;
    if (percentage < 0.3) {
      color = 0xff0000;
    } else if (percentage < 0.6) {
      color = 0xffff00;
    }

    this.fillBar.fillStyle(color, 1);
    this.fillBar.fillRect(2, 2, fillWidth, this.barHeight - 4);
  }

  public destroy(): void {
    this.scene.events.off(EVENTS.DIMENSION_CHANGED, this.handleDimensionChange, this);
    this.scene.events.off(EVENTS.ENERGY_CHANGED, this.handleEnergyChange, this);
    this.scene.scale.off('resize', this.updatePosition, this);
    this.container.destroy();
  }
}
