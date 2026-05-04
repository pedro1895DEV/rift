import Phaser from 'phaser';

export class Rat extends Phaser.Physics.Arcade.Sprite {
  private spawnPoint: Phaser.Math.Vector2;
  private detectionRange: number = 150;
  private leashRange: number = 250;
  private speed: number = 100;
  private targetPlayer: Phaser.Physics.Arcade.Sprite | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'rat');
    
    this.spawnPoint = new Phaser.Math.Vector2(x, y);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Placeholder visual para o rato
    if (!scene.textures.exists('rat')) {
      const graphics = scene.make.graphics({ x: 0, y: 0 });
      graphics.fillStyle(0x808080, 1);
      graphics.fillRect(0, 0, 20, 10);
      graphics.generateTexture('rat', 20, 10);
      this.setTexture('rat');
    }

    (this.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);
  }

  setTarget(player: Phaser.Physics.Arcade.Sprite): void {
    this.targetPlayer = player;
  }

  update(): void {
    if (!this.targetPlayer) return;

    const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, this.targetPlayer.x, this.targetPlayer.y);
    const distanceToSpawn = Phaser.Math.Distance.Between(this.x, this.y, this.spawnPoint.x, this.spawnPoint.y);
    const body = this.body as Phaser.Physics.Arcade.Body;

    // IA: Ataque, Perseguição e Leash
    if (distanceToPlayer < this.detectionRange && distanceToSpawn < this.leashRange) {
      // Persegue o jogador
      this.scene.physics.moveToObject(this, this.targetPlayer, this.speed);
      
      // Flip visual baseado na direção
      this.setFlipX(body.velocity.x > 0);
    } 
    else if (distanceToSpawn > 5) {
      // Volta para o ponto inicial se o jogador fugir ou se o rato se afastar demais
      this.scene.physics.moveTo(this, this.spawnPoint.x, this.spawnPoint.y, this.speed * 0.7);
      
      if (distanceToSpawn < 10) {
        body.setVelocity(0, 0);
      }
      this.setFlipX(body.velocity.x > 0);
    } else {
      body.setVelocity(0, 0);
    }
  }
}
