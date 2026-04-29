import Phaser from "phaser";
import { STARTER_MAP } from "../maps/StarterMap";
import { WsManager } from "../WsManager";
import { registerAnimations, animKey } from "../SpriteLoader";
import { inventoryStore } from "../../lib/inventoryStore";
import { chatStore } from "../../lib/chatStore";
import type { Database } from "../../lib/database.types";
import type { PlayerState, ServerMessage } from "@browser-mmo/shared";

type Character = Database["public"]["Tables"]["characters"]["Row"];

const TILE_SIZE = 16;
const PLAYER_SPEED = 96; // px/sec — one tile takes ~167ms

type RemotePlayer = {
  sprite: Phaser.GameObjects.Sprite;
  nameLabel: Phaser.GameObjects.Text;
  pixelX: number;
  pixelY: number;
  targetX: number;
  targetY: number;
};

export class GameScene extends Phaser.Scene {
  // Local player
  private player!: Phaser.GameObjects.Sprite;
  private nameLabel!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private collisionLayer!: boolean[][];
  private playerTileX = 5;
  private playerTileY = 5;
  private moving = false;
  private moveTarget = { x: 0, y: 0 };
  private facingRow = 0; // 0=down 1=left 2=right 3=up
  private seq = 0;

  // Sprite
  private spriteId = "default_player";

  // Multiplayer
  private ws!: WsManager;
  private localCharacterId = "";
  private remotePlayers = new Map<string, RemotePlayer>();

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    const character = this.registry.get("character") as Character | undefined;
    const token = this.registry.get("accessToken") as string | undefined;

    if (character) {
      this.playerTileX = character.x;
      this.playerTileY = character.y;
      this.localCharacterId = character.id;
      this.spriteId = character.sprite_id;
    }

    this.buildMap();
    this.setupPlayer(character?.name ?? "Player");
    registerAnimations(this, this.spriteId);
    this.setupCamera();
    this.setupInput();

    if (token && character) {
      this.ws = new WsManager();
      this.ws.onMessage = (msg) => this.handleServerMessage(msg);
      this.ws.connect(token, character.id);

      // Wire inventory actions through the store so React UI can trigger them
      inventoryStore.sendEquip = (id) => this.ws.send({ type: "equip_item", inventoryItemId: id });
      inventoryStore.sendUnequip = (slot) => this.ws.send({ type: "unequip_item", slot });
      chatStore.sendMessage = (text) => this.ws.send({ type: "chat", message: text });
    }

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.ws?.disconnect();
      inventoryStore.sendEquip = null;
      inventoryStore.sendUnequip = null;
      chatStore.sendMessage = null;
    });
  }

  private buildMap() {
    const map = STARTER_MAP;
    this.collisionLayer = map.collision;

    map.ground.forEach((row, ty) => {
      row.forEach((tileIndex, tx) => {
        this.drawTile(tx, ty, tileIndex);
      });
    });

    map.decoration.forEach((row, ty) => {
      row.forEach((tileIndex, tx) => {
        if (tileIndex >= 0) this.drawTile(tx, ty, tileIndex);
      });
    });
  }

  private drawTile(tx: number, ty: number, tileIndex: number) {
    const cols = 4;
    const srcX = (tileIndex % cols) * TILE_SIZE;
    const srcY = Math.floor(tileIndex / cols) * TILE_SIZE;
    const rt = this.add.renderTexture(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    rt.draw("tileset", -srcX, -srcY);
  }

  private setupPlayer(name: string) {
    const px = this.playerTileX * TILE_SIZE + TILE_SIZE / 2;
    const py = this.playerTileY * TILE_SIZE + TILE_SIZE / 2;
    this.player = this.add.sprite(px, py, this.spriteId);
    this.player.setDepth(10);
    this.moveTarget = { x: px, y: py };

    this.nameLabel = this.add
      .text(px, py - 10, name, {
        fontSize: "5px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(11);
  }

  private setupCamera() {
    const mapWidth = STARTER_MAP.ground[0].length * TILE_SIZE;
    const mapHeight = STARTER_MAP.ground.length * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(3);
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
  }

  // ── Server message handling ───────────────────────────────────────────────

  private handleServerMessage(msg: ServerMessage) {
    switch (msg.type) {
      case "world_state":
        msg.players.forEach((p) => {
          if (p.characterId !== this.localCharacterId) this.upsertRemotePlayer(p);
        });
        break;
      case "player_joined":
        if (msg.player.characterId !== this.localCharacterId) this.upsertRemotePlayer(msg.player);
        break;
      case "player_left":
        this.removeRemotePlayer(msg.playerId);
        break;
      case "player_moved":
        if (msg.player.characterId === this.localCharacterId) {
          // Server correction: snap if we're significantly off
          const serverX = msg.player.x * TILE_SIZE + TILE_SIZE / 2;
          const serverY = msg.player.y * TILE_SIZE + TILE_SIZE / 2;
          const dx = Math.abs(this.player.x - serverX);
          const dy = Math.abs(this.player.y - serverY);
          if (dx > TILE_SIZE || dy > TILE_SIZE) {
            this.player.setPosition(serverX, serverY);
            this.playerTileX = msg.player.x;
            this.playerTileY = msg.player.y;
            this.moveTarget = { x: serverX, y: serverY };
            this.moving = false;
          }
        } else {
          this.upsertRemotePlayer(msg.player);
        }
        break;
      case "inventory_updated":
        inventoryStore.update(msg.inventory, msg.equipment);
        break;
      case "chat":
        chatStore.addMessage({
          fromCharacterId: msg.fromCharacterId,
          fromName: msg.fromName,
          message: msg.message,
        });
        break;
    }
  }

  private upsertRemotePlayer(state: PlayerState) {
    const px = state.x * TILE_SIZE + TILE_SIZE / 2;
    const py = state.y * TILE_SIZE + TILE_SIZE / 2;

    const existing = this.remotePlayers.get(state.characterId);
    if (existing) {
      existing.targetX = px;
      existing.targetY = py;
      return;
    }

    const sprite = this.add.sprite(px, py, "player").setDepth(9).setTint(0xaaddff);
    const label = this.add
      .text(px, py - 10, state.name, {
        fontSize: "5px",
        color: "#aaddff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(11);

    this.remotePlayers.set(state.characterId, {
      sprite,
      nameLabel: label,
      pixelX: px,
      pixelY: py,
      targetX: px,
      targetY: py,
    });
  }

  private removeRemotePlayer(characterId: string) {
    const rp = this.remotePlayers.get(characterId);
    if (!rp) return;
    rp.sprite.destroy();
    rp.nameLabel.destroy();
    this.remotePlayers.delete(characterId);
  }

  // ── Game loop ─────────────────────────────────────────────────────────────

  update(_time: number, delta: number) {
    if (this.moving) {
      this.moveLocalPlayerToTarget(delta);
    } else {
      this.handleInput();
    }
    this.nameLabel.setPosition(this.player.x, this.player.y - 10);
    this.interpolateRemotePlayers(delta);
  }

  private isTyping(): boolean {
    const el = document.activeElement;
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
  }

  private handleInput() {
    if (this.isTyping()) {
      this.playIdleAnim(this.facingRow);
      return;
    }
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    let dx = 0;
    let dy = 0;
    let dirRow = this.facingRow;
    let dirName: "up" | "down" | "left" | "right" | null = null;

    if (up) { dy = -1; dirRow = 3; dirName = "up"; }
    else if (down) { dy = 1; dirRow = 0; dirName = "down"; }
    else if (left) { dx = -1; dirRow = 1; dirName = "left"; }
    else if (right) { dx = 1; dirRow = 2; dirName = "right"; }

    if (dx !== 0 || dy !== 0) {
      const nextX = this.playerTileX + dx;
      const nextY = this.playerTileY + dy;
      this.facingRow = dirRow;

      if (this.canWalk(nextX, nextY)) {
        this.playerTileX = nextX;
        this.playerTileY = nextY;
        this.moveTarget = {
          x: nextX * TILE_SIZE + TILE_SIZE / 2,
          y: nextY * TILE_SIZE + TILE_SIZE / 2,
        };
        this.moving = true;
        this.playWalkAnim(dirRow);

        // Send move to server (client prediction — move is already applied locally)
        this.seq++;
        this.ws?.send({ type: "move", direction: dirName!, seq: this.seq });
      } else {
        this.playIdleAnim(dirRow);
      }
    } else {
      this.playIdleAnim(this.facingRow);
    }
  }

  private moveLocalPlayerToTarget(delta: number) {
    const speed = PLAYER_SPEED * (delta / 1000);
    const dx = this.moveTarget.x - this.player.x;
    const dy = this.moveTarget.y - this.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist <= speed) {
      this.player.setPosition(this.moveTarget.x, this.moveTarget.y);
      this.moving = false;
    } else {
      this.player.x += (dx / dist) * speed;
      this.player.y += (dy / dist) * speed;
    }
  }

  private interpolateRemotePlayers(delta: number) {
    const speed = PLAYER_SPEED * (delta / 1000);
    for (const rp of this.remotePlayers.values()) {
      const dx = rp.targetX - rp.pixelX;
      const dy = rp.targetY - rp.pixelY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0.5) {
        const step = Math.min(dist, speed);
        rp.pixelX += (dx / dist) * step;
        rp.pixelY += (dy / dist) * step;
      } else {
        rp.pixelX = rp.targetX;
        rp.pixelY = rp.targetY;
      }
      rp.sprite.setPosition(rp.pixelX, rp.pixelY);
      rp.nameLabel.setPosition(rp.pixelX, rp.pixelY - 10);
    }
  }

  private canWalk(tx: number, ty: number): boolean {
    const rows = this.collisionLayer.length;
    const cols = this.collisionLayer[0]?.length ?? 0;
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return false;
    return !this.collisionLayer[ty][tx];
  }

  private playWalkAnim(dirRow: number) {
    const names = ["walk_down", "walk_left", "walk_right", "walk_up"];
    this.player.play(animKey(this.spriteId, names[dirRow]), true);
  }

  private playIdleAnim(dirRow: number) {
    const names = ["idle_down", "idle_left", "idle_right", "idle_up"];
    const key = animKey(this.spriteId, names[dirRow]);
    if (this.player.anims.currentAnim?.key !== key) this.player.play(key, true);
  }
}
