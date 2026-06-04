// import Phaser from 'phaser';

// /**
//  * BootScene
//  * ─────────
//  * Gera texturas top-down com Graphics — nenhum arquivo externo necessário.
//  * Quando os seus assets de pixel art ficarem prontos, substitua cada bloco
//  * por this.load.spritesheet() / this.load.image() aqui.
//  *
//  * Paleta:
//  *   Mundo Real   → tons quentes (terra, ocre, ferrugem)
//  *   Mundo Spirit → tons frios (azul-noite, ciano, roxo)
//  */
// export class BootScene extends Phaser.Scene {
//   constructor() { super({ key: 'BootScene' }); }

//   preload(): void {
//     this.load.image('tile_ground', 'assets/tilesets/tiles.png');
//   }

//   create(): void {
//     const g = this.add.graphics();
//     const T = 16; // tamanho base do tile

//     // ── TILES DE CHÃO ────────────────────────────────────────────────────

//     // Grama — Mundo Real
//     this._tile(g, 'ground_real', T, () => {
//       g.fillStyle(0x4a7c3f); g.fillRect(0, 0, T, T);
//       g.fillStyle(0x5a9048); g.fillRect(2, 2, 4, 4);
//       g.fillStyle(0x3d6634); g.fillRect(9, 8, 3, 3);
//       g.fillStyle(0x62a050); g.fillRect(6, 11, 2, 2);
//     });

//     // Terra com grama (borda) — Mundo Real
//     this._tile(g, 'ground_dirt', T, () => {
//       g.fillStyle(0x6b4c2a); g.fillRect(0, 0, T, T);
//       g.fillStyle(0x7a5a35); g.fillRect(1, 1, T - 2, 4);
//       g.fillStyle(0x4a7c3f); g.fillRect(0, 0, T, 3);
//     });

//     // Água — Mundo Real (lago/rio)
//     this._tile(g, 'water_real', T, () => {
//       g.fillStyle(0x2255aa); g.fillRect(0, 0, T, T);
//       g.fillStyle(0x2a66cc); g.fillRect(0, 4, T, 3);
//       g.fillStyle(0x1a4488); g.fillRect(0, 10, T, 3);
//       g.fillStyle(0x3388ff, 0.4); g.fillRect(3, 6, 6, 1);
//     });

//     // Pedra — Mundo Real (obstáculo)
//     this._tile(g, 'wall_real', T, () => {
//       g.fillStyle(0x7a7060); g.fillRect(0, 0, T, T);
//       g.fillStyle(0x8a8070); g.fillRect(1, 1, 6, 6);
//       g.fillStyle(0x8a8070); g.fillRect(9, 9, 5, 5);
//       g.fillStyle(0x5a5050); g.fillRect(0, T - 3, T, 3);
//     });

//     // Chão espiritual
//     this._tile(g, 'ground_spirit', T, () => {
//       g.fillStyle(0x0d1a3a); g.fillRect(0, 0, T, T);
//       g.fillStyle(0x142244); g.fillRect(2, 2, 4, 4);
//       g.fillStyle(0x1a2e55); g.fillRect(9, 8, 3, 3);
//       g.fillStyle(0x0a1428, 0.8); g.fillRect(6, 11, 2, 2);
//     });

//     // Água espiritual (brilhante)
//     this._tile(g, 'water_spirit', T, () => {
//       g.fillStyle(0x0a2244); g.fillRect(0, 0, T, T);
//       g.fillStyle(0x1155aa, 0.7); g.fillRect(0, 4, T, 3);
//       g.fillStyle(0x3388cc, 0.5); g.fillRect(3, 6, 6, 1);
//       g.fillStyle(0x88ccff, 0.3); g.fillRect(1, 12, 8, 1);
//     });

//     // Parede espiritual (cristal)
//     this._tile(g, 'wall_spirit', T, () => {
//       g.fillStyle(0x1a2a5a); g.fillRect(0, 0, T, T);
//       g.fillStyle(0x2a4a8a); g.fillRect(1, 1, 6, 6);
//       g.fillStyle(0x3366aa); g.fillRect(9, 9, 5, 5);
//       g.fillStyle(0x88aaff, 0.3); g.fillRect(3, 3, 2, 2);
//     });

//     // ── PERSONAGEM ELIAS (top-down, 4 direções) ──────────────────────────
//     // Cada frame: 16×16, vista de cima
//     // Spritesheet: 4 frames por direção (down, up, left, right)
//     // Layout: linha 0 = down, linha 1 = up, linha 2 = left, linha 3 = right

//     const playerFrames = 16; // largura de cada frame
//     const totalFrames  = 16; // 4 dirs × 4 frames
//     const sheetW = playerFrames * 4;
//     const sheetH = playerFrames * 4;

//     // Real
//     this._playerSheet(g, 'player_real', sheetW, sheetH, playerFrames,
//       0x7ec8e3, 0xf4d4a0, 0x4a90b8);
//     // Spirit (azul frio)
//     this._playerSheet(g, 'player_spirit', sheetW, sheetH, playerFrames,
//       0x88ddff, 0xcceeff, 0x4488bb);

//     // ── ELEMENTOS DE CENÁRIO ─────────────────────────────────────────────

//     // Árvore — Real (copa vista de cima)
//     this._tile(g, 'tree_real', T * 2, () => {
//       g.fillStyle(0x2d5a1e); g.fillCircle(T, T, T - 2);
//       g.fillStyle(0x3a7228); g.fillCircle(T - 3, T - 3, 5);
//       g.fillStyle(0x255018); g.fillCircle(T + 3, T + 2, 4);
//       g.fillStyle(0x4a8a35); g.fillCircle(T, T - 4, 4);
//     });

//     // Árvore — Spirit
//     this._tile(g, 'tree_spirit', T * 2, () => {
//       g.fillStyle(0x0d2244); g.fillCircle(T, T, T - 2);
//       g.fillStyle(0x1a3366); g.fillCircle(T - 3, T - 3, 5);
//       g.fillStyle(0x2255aa, 0.6); g.fillCircle(T + 3, T + 2, 4);
//       g.fillStyle(0x88aaff, 0.2); g.fillCircle(T, T - 4, 4);
//     });

//     // Orbe de memória (coletável)
//     this._tile(g, 'orb', 12, () => {
//       g.fillStyle(0xffdd55); g.fillCircle(6, 6, 5);
//       g.fillStyle(0xffffff, 0.7); g.fillCircle(4, 4, 2);
//       g.fillStyle(0xff9900, 0.5); g.fillCircle(6, 6, 2);
//     });

//     // Portal de transição
//     this._tile(g, 'portal', T, () => {
//       g.fillStyle(0xaa66ff, 0.4); g.fillCircle(T / 2, T / 2, 7);
//       g.lineStyle(1, 0xcc88ff); g.strokeCircle(T / 2, T / 2, 7);
//       g.fillStyle(0xffffff, 0.6); g.fillCircle(T / 2, T / 2, 2);
//     });

//     // NPC / sombra de memória (figura desfocada)
//     this._tile(g, 'shadow_npc', T, () => {
//       g.fillStyle(0x334466, 0.5); g.fillEllipse(T / 2, T / 2, 10, 10);
//       g.fillStyle(0x88aacc, 0.4); g.fillEllipse(T / 2, T / 2 - 3, 6, 6);
//     });

//     // Ruína / elemento decorativo Real
//     this._tile(g, 'ruin', T, () => {
//       g.fillStyle(0x8a7a60); g.fillRect(2, 2, T - 4, T - 4);
//       g.fillStyle(0x6a5a40); g.fillRect(0, 0, 4, 4);
//       g.fillStyle(0x6a5a40); g.fillRect(T - 4, 0, 4, 4);
//       g.fillStyle(0xaa9970, 0.5); g.fillRect(4, 4, T - 8, T - 8);
//     });

//     // Cristal espiritual
//     this._tile(g, 'crystal', T, () => {
//       g.fillStyle(0x3366cc, 0.8);
//       g.fillTriangle(T / 2, 1, T - 2, T - 2, 2, T - 2);
//       g.fillStyle(0x88aaff, 0.6);
//       g.fillTriangle(T / 2, 4, T - 5, T - 4, 5, T - 4);
//     });

//     g.destroy();
//     this.scene.start('MenuScene');
//   }

//   // ── Helpers ────────────────────────────────────────────────────────────

//   private _tile(g: Phaser.GameObjects.Graphics, key: string, size: number, draw: () => void): void {
//     g.clear();
//     draw();
//     g.generateTexture(key, size, size);
//   }

//   private _playerSheet(
//     g: Phaser.GameObjects.Graphics,
//     key: string,
//     sheetW: number,
//     sheetH: number,
//     fSize: number,
//     bodyColor: number,
//     headColor: number,
//     shadowColor: number
//   ): void {
//     // Gera um spritesheet 64×64 com 4 linhas (direções) × 4 frames (walk)
//     // Direções: 0=down, 1=up, 2=left, 3=right
//     const canvas = this.textures.createCanvas(key, sheetW, sheetH)!;
//     const ctx    = canvas.getSourceImage() as HTMLCanvasElement;
//     const c      = ctx.getContext('2d')!;

//     const dirs = ['down', 'up', 'left', 'right'];
//     const bc = this._toRgb(bodyColor);
//     const hc = this._toRgb(headColor);
//     const sc = this._toRgb(shadowColor);

//     dirs.forEach((dir, row) => {
//       for (let frame = 0; frame < 4; frame++) {
//         const ox = frame * fSize;
//         const oy = row   * fSize;
//         const bob = (frame === 1 || frame === 3) ? 1 : 0;

//         // Sombra
//         c.fillStyle = `rgba(${sc},0.3)`;
//         c.beginPath();
//         c.ellipse(ox + 8, oy + 13, 4, 2, 0, 0, Math.PI * 2);
//         c.fill();

//         // Corpo
//         c.fillStyle = `rgb(${bc})`;
//         c.fillRect(ox + 5, oy + 6 + bob, 6, 6);

//         // Cabeça
//         c.fillStyle = `rgb(${hc})`;
//         c.fillRect(ox + 5, oy + 1 + bob, 6, 6);

//         // Olhos (indicam direção)
//         c.fillStyle = '#333';
//         if (dir === 'down') {
//           c.fillRect(ox + 6, oy + 3 + bob, 1, 1);
//           c.fillRect(ox + 9, oy + 3 + bob, 1, 1);
//         } else if (dir === 'up') {
//           // sem olhos (costas)
//         } else if (dir === 'left') {
//           c.fillRect(ox + 6, oy + 3 + bob, 1, 1);
//         } else {
//           c.fillRect(ox + 9, oy + 3 + bob, 1, 1);
//         }

//         // Pernas (animação de caminhada)
//         c.fillStyle = `rgb(${sc})`;
//         if (frame === 0 || frame === 2) {
//           c.fillRect(ox + 5, oy + 12, 2, 3);
//           c.fillRect(ox + 9, oy + 12, 2, 3);
//         } else {
//           c.fillRect(ox + 5, oy + 12, 2, 2);
//           c.fillRect(ox + 9, oy + 13, 2, 2);
//         }
//       }
//     });

//     canvas.refresh();
//   }

//   private _toRgb(hex: number): string {
//     return `${(hex >> 16) & 0xff},${(hex >> 8) & 0xff},${hex & 0xff}`;
//   }
// }