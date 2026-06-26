# RIFT — Contexto do Projeto para IA

## O que é o RIFT

Jogo 2D top-down desenvolvido com **Phaser 3 + TypeScript + Vite**.
O protagonista é **Rodrigo Bjordans**, que acorda sem memória em uma floresta
e descobre que pode alternar entre dois planos dimensionais pressionando SHIFT:
- **Mundo Real** — tons quentes, familiar
- **Mundo Espiritual** — tons frios/azulados, perigoso

O objetivo é coletar orbes de memória, derrotar criaturas e selar três portais
corrompidos na Árvore Ancestral para voltar para casa.

---

## Etapas Avaliativas da Disciplina

### EA1 — Entregue ✅
- Roteiro e Narrativa do jogo
- Definição de personagens, imagens e sprites
- Storyboards (mínimo 8 — entregues 12)
- Implementação de cenário com personagens, transição entre fases (mínimo 2), movimento do personagem sem colisões

### EA2 — Entregue ✅
- Implementação de 1 fase completa com colisões e processamento
- Mínimo 2 objetos OO integrados ao jogo
- Entregues: `Player`, `RatEnemy`, `Orb`, `Entity` — todos OO com IDamageable

### EA3 — Em desenvolvimento 🚧
- Implementação completa de todas as fases (mínimo 2) — ✅ 4 fases implementadas
- Integração com Backend (API REST + Agente de IA via N8N) — 🚧 a fazer
- Vídeo no YouTube (5–10 min) apresentando o jogo — 🚧 a fazer
- Entrega: link GitHub + StackBlitz + YouTube em arquivo único

---

## Stack técnica

| Item | Detalhe |
|---|---|
| Framework | Phaser 3.80+ |
| Linguagem | TypeScript 5+ |
| Bundler | Vite |
| Physics | Arcade (sem Matter.js) |
| Mapas | Tiled Map Editor → exportado como `.tmj` |
| Tile size | 32×32 px |
| Zoom | `this.cameras.main.setZoom(4)` |
| Escala | `Phaser.Scale.RESIZE` |

---

## Arquitetura do Projeto

```
game/                          ← frontend (Phaser 3 + TypeScript)
├── index.html
├── package.json
├── tsconfig.json
├── GEMINI.md
├── public/assets/
│   ├── tilesets/              ← mapas .tmj e PNGs dos tilesets
│   └── characters/            ← spritesheets dos personagens
└── src/
    ├── main.ts                ← config Phaser + lista de cenas
    ├── vite-env.d.ts
    ├── entities/
    │   ├── Player.ts          ← jogador OO (movimento, vida, combate, canAttack)
    │   ├── RatEnemy.ts        ← inimigo OO com IDamageable + leash IA
    │   └── Entity.ts          ← boss final OO com IDamageable + perseguição
    ├── events/
    │   └── GameEvents.ts      ← enum de eventos tipados
    ├── interfaces/
    │   └── IDamageable.ts     ← interface + type guard isDamageable()
    ├── objects/
    │   └── Orb.ts             ← coletável com fallback visual
    ├── scenes/
    │   ├── BaseScene.ts       ← orquestração comum
    │   ├── MenuScene.ts       ← tela de título
    │   ├── IntroScene.ts      ← cutscene de abertura
    │   ├── CutsceneScene.ts   ← cutscene de transição
    │   ├── GameScene.ts       ← Fase 1: A Floresta Esquecida
    │   ├── Phase2Scene.ts     ← Fase 2: Profundezas da Floresta
    │   ├── Phase3Scene.ts     ← Fase 3: O Rio dos Espíritos
    │   ├── Phase4Scene.ts     ← Fase 4: A Árvore Ancestral (boss)
    │   └── VictoryScene.ts    ← tela de vitória
    ├── systems/
    │   ├── DimensionSystem.ts
    │   ├── DimensionUI.ts
    │   └── PhaseObjective.ts
    └── ui/
        └── HealthUI.ts

server/                        ← backend (Node.js + Express + SQLite) — A CRIAR
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── database.ts
    └── routes/
        └── scores.ts
```

---

## Estado atual do jogo

### Fases implementadas

| Cena | Fase | Status | O que tem |
|---|---|---|---|
| `GameScene` | Fase 1 — A Floresta Esquecida | ✅ Completa | Movimento, SHIFT, sombra da entidade, portal |
| `Phase2Scene` | Fase 2 — Profundezas da Floresta | ✅ Completa | Espada no baú, ratos, orbe amarela, diálogos |
| `Phase3Scene` | Fase 3 — O Rio dos Espíritos | ✅ Completa | Puzzle dimensional, rio deadly, checkpoints, 2 orbes |
| `Phase4Scene` | Fase 4 — A Árvore Ancestral | ✅ Completa | 3 portais, Entity boss, diálogos, VictoryScene |
| `VictoryScene` | Fim | ✅ Completa | Sequência narrativa + ENTER para menu |

### Sistemas implementados

- **DimensionSystem** — troca via SHIFT, drain de energia, tint global, flash/shake
- **PhaseObjective** — controla quando o portal abre (requiredOrbs, requiredKills)
- **HealthUI** — barra de HP desacoplada via EventBus
- **DimensionUI** — barra de energia espiritual
- **Player.canAttack** — ataque bloqueado até encontrar a espada
- **Checkpoints** — Phase3Scene salva lastSafePosition
- **Colisão dinâmica do rio** — riverLayer desativa colisão no espiritual

### O que ainda falta (EA3)

- Backend `server/` — Node.js + Express + SQLite
- Integração N8N + IA — agente que gera comentário personalizado na VictoryScene
- LeaderboardScene — exibe top 10 scores via GET /scores
- Vídeo YouTube — gravação com OBS Studio (5–10 min)
- Polimento: sons, animações, intro, bugs visuais

---

## Narrativa resumida

| Fase | O que acontece |
|---|---|
| Fase 1 | Bjordans acorda sem memória, descobre o SHIFT, vê a sombra da entidade |
| Fase 2 | Encontra espada, derrota ratos, coleta orbe amarela, lembra o nome |
| Fase 3 | Atravessa o rio alternando dimensões, coleta 2 orbes |
| Fase 4 | Sela 3 portais no espiritual enquanto foge da Entidade, volta para casa |

---

## Personagens

| Personagem | Arquivo | Status |
|---|---|---|
| Rodrigo Bjordans | `Player.ts` | ✅ Implementado |
| Ratos | `RatEnemy.ts` | ✅ Implementados |
| A Entidade | `Entity.ts` | ✅ Implementada |

---

## Convenções do projeto

- Classes em **PascalCase**, métodos em **camelCase**
- Interfaces com prefixo `I`: `IDamageable`
- Assets em `public/assets/` — caminhos sem `../../`
- UI atualizada via **EventBus** — nunca diretamente das entidades
- `BaseScene` orquestra — entidades encapsulam seus próprios comportamentos
- Sem `any`, sem Matter.js, sem hardcode de posição

---

## Padrão de nova cena (referência)

```typescript
export class MinhaFase extends BaseScene {
  constructor() { super('MinhaFase'); }

  protected onPreload(): void {
    this.load.tilemapTiledJSON('levelX', 'assets/tilesets/mapaX.tmj');
  }

  protected createMap(): Phaser.Tilemaps.Tilemap {
    const map = this.make.tilemap({ key: 'levelX' });
    const tileset = map.addTilesetImage('tiles', 'img_tiles')!;
    map.createLayer('Camada de Blocos 1', [tileset], 0, 0);
    map.createLayer('Camada de Blocos 2', [tileset], 0, 0);
    return map;
  }

  protected setupCollisions(map: Phaser.Tilemaps.Tilemap): void {
    const layer = map.getLayer('Camada de Blocos 2')!.tilemapLayer;
    layer.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.player, layer);
  }

  protected onCreate(map: Phaser.Tilemaps.Tilemap): void {
    // lógica específica da fase
  }

  protected onUpdate(time: number, delta: number): void {
    // update específico da fase
  }
}
```

---

## Backend — EA3 (a implementar)

**Objetivo:** salvar scores + agente de IA via N8N que gera comentário personalizado na VictoryScene

```
VictoryScene
    ↓
POST /scores → Express → SQLite (salva score)
    ↓
POST /ai-comment → N8N → IA → texto personalizado
    ↓
Exibe: score salvo + comentário da IA + LeaderboardScene
```

**Rotas planejadas:**
- `POST /scores` — salva `{ playerName, score, completedAt }`
- `GET /scores` — retorna top 10 ordenado por score desc
- `POST /ai-comment` — envia dados ao N8N, recebe texto gerado por IA

**Stack do server:**
- Node.js + Express + TypeScript
- SQLite via `better-sqlite3`
- CORS habilitado para `localhost:5173`
- Porta: `3000`

---

## O que NÃO fazer

- Não usar Matter.js — apenas Arcade physics
- Não usar `any`
- Não acoplar UI na lógica de entidades
- Não duplicar código de cena — use e expanda a `BaseScene`
- Não modificar `main.ts` para lógica de cena
- Não executar comandos de terminal sem solicitação explícita