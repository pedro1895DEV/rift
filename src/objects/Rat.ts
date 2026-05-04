import Phaser from 'phaser';

export class Rat extends Phaser.Physics.Arcade.Sprite {
  private spawnPoint: Phaser.Math.Vector2;
  private detectionRange: number = 150;
  private leashRange: number = 250;
  private speed: number = 100;
  private targetPlayer: Phaser.Physics.Arcade.Sprite | null = null;
  private variant: number;

  constructor(scene: Phaser.Scene, x: number, y: number, variant: number = 0) {
    super(scene, x, y, 'rats');
    this.variant = variant;
    this.spawnPoint = new Phaser.Math.Vector2(x, y);
    
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.createAnimations();
    
    // Configura o corpo físico para o tamanho do rato lateral
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setSize(28, 24); // Um pouco menor que 32x32 para evitar colisões "fantasmas" nas bordas
    body.setOffset(10, 20);

    // Inicia com a animação de caminhada
    this.play(`rat_${this.variant}_walk`);
    this.stop();
  }

  private createAnimations(): void {
    const v = this.variant;

    if (!this.scene.anims.exists(`rat_${v}_walk`)) {
      this.scene.anims.create({
        key: `rat_${v}_walk`,
        frames: this.scene.anims.generateFrameNumbers('rats', {
          start: 12 + v * 3,  // cada variante ocupa 3 frames
          end: 14 + v * 3
        }),
        frameRate: 10,
        repeat: -1
      });
    }
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
      this.scene.physics.moveToObject(this, this.targetPlayer, this.speed);
    } 
    else if (distanceToSpawn > 10) {
      this.scene.physics.moveTo(this, this.spawnPoint.x, this.spawnPoint.y, this.speed * 0.7);
    } else {
      body.setVelocity(0, 0);
    }

    this.updateAnimation();
  }

  private updateAnimation(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (body.velocity.length() > 0) {
      this.play(`rat_${this.variant}_walk`, true);
      // Linha 1 da spritesheet olha para ESQUERDA por padrão
      // então flipX=false = esquerda, flipX=true = direita
      if (body.velocity.x > 0) this.setFlipX(true);
      else if (body.velocity.x < 0) this.setFlipX(false);
    } else {
      this.stop();
      this.setFrame(12 + this.variant * 3);
    }
  }
}
