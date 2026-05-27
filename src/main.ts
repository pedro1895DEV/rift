import Phaser from 'phaser';
import { IntroScene } from './scenes/IntroScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { Phase2Scene } from './scenes/Phase2Scene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { Phase3Scene } from './scenes/Phase3Scene';

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
  scene: [MenuScene, IntroScene, GameScene, Phase2Scene, CutsceneScene, Phase3Scene],
};

new Phaser.Game(config);

