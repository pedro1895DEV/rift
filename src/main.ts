import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { Phase2Scene } from './scenes/Phase2scene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,


pixelArt: true, 
  
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: true },
  },
  scene: [GameScene, Phase2Scene],
};

new Phaser.Game(config);