import Phaser from "phaser";
import { STARTER_MAP } from "../maps/StarterMap";

const TILE_SIZE = 16;
const PLAYER_SPEED = 96;

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private collisionLayer!: boolean[][];
  private playerTileX = 5;
  private playerTileY = 5;
  private moving = false;
  private moveTarget = { x: 0, y: 0 };
  private facingRow = 0; // 0=down,1=left,2=right,3=up

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.buildMap();
    this.setupPlayer();
    this.setupCamera();
    this.setupInput();
    this.setupAnimations();
  }

  private buildMap() {
    const map = STARTER_MAP;
    this.collisionLayer = map.collision;

    // Ground layer
    map.ground.forEach((row, ty) => {
      row.forEach((tileIndex, tx) => {
        this.drawTile(tx, ty, tileIndex);
      });
    });

    // Decoration layer (drawn on top of ground)
    map.decoration.forEach((row, ty) => {
      row.forEach((tileIndex, tx) => {
        if (tileIndex >= 0) this.drawTile(tx, ty, tileIndex);
      });
    });
  }

  private drawTile(tx: number, ty: number, tileIndex: number) {
    const tilesetCols = 4;
    const srcX = (tileIndex % tilesetCols) * TILE_SIZE;
    const srcY = Math.floor(tileIndex / tilesetCols) * TILE_SIZE;

    const rt = this.add.renderTexture(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    rt.draw("tileset", -srcX, -srcY);
  }

  private setupPlayer() {
    const px = this.playerTileX * TILE_SIZE + TILE_SIZE / 2;
    const py = this.playerTileY * TILE_SIZE + TILE_SIZE / 2;
    this.player = this.add.sprite(px, py, "player");
    this.player.setDepth(10);
    this.moveTarget = { x: px, y: py };
  }

  private setupAnimations() {
    const frameRate = 8;
    const dirs = [
      { key: "walk_down", row: 0 },
      { key: "walk_left", row: 1 },
      { key: "walk_right", row: 2 },
      { key: "walk_up", row: 3 },
    ];
    dirs.forEach(({ key, row }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: [0, 1, 2, 3].map((f) => ({ key: "player", frame: row * 4 + f })),
          frameRate,
          repeat: -1,
        });
      }
    });

    const idles = [
      { key: "idle_down", row: 0, frame: 0 },
      { key: "idle_left", row: 1, frame: 4 },
      { key: "idle_right", row: 2, frame: 8 },
      { key: "idle_up", row: 3, frame: 12 },
    ];
    idles.forEach(({ key, frame }) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: [{ key: "player", frame }],
          frameRate: 1,
          repeat: 0,
        });
      }
    });
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

  update(_time: number, delta: number) {
    if (this.moving) {
      this.movePlayerTowardsTarget(delta);
      return;
    }
    this.handleInput();
  }

  private handleInput() {
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;
    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;

    let dx = 0;
    let dy = 0;
    let dirRow = this.facingRow;

    if (up) { dy = -1; dirRow = 3; }
    else if (down) { dy = 1; dirRow = 0; }
    else if (left) { dx = -1; dirRow = 1; }
    else if (right) { dx = 1; dirRow = 2; }

    if (dx !== 0 || dy !== 0) {
      const nextTileX = this.playerTileX + dx;
      const nextTileY = this.playerTileY + dy;
      this.facingRow = dirRow;

      if (this.canWalk(nextTileX, nextTileY)) {
        this.playerTileX = nextTileX;
        this.playerTileY = nextTileY;
        this.moveTarget = {
          x: nextTileX * TILE_SIZE + TILE_SIZE / 2,
          y: nextTileY * TILE_SIZE + TILE_SIZE / 2,
        };
        this.moving = true;
        this.playWalkAnim(dirRow);
      } else {
        this.playIdleAnim(dirRow);
      }
    } else {
      this.playIdleAnim(this.facingRow);
    }
  }

  private movePlayerTowardsTarget(delta: number) {
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

  private canWalk(tx: number, ty: number): boolean {
    const rows = this.collisionLayer.length;
    const cols = this.collisionLayer[0]?.length ?? 0;
    if (tx < 0 || ty < 0 || tx >= cols || ty >= rows) return false;
    return !this.collisionLayer[ty][tx];
  }

  private playWalkAnim(dirRow: number) {
    const keys = ["walk_down", "walk_left", "walk_right", "walk_up"];
    this.player.play(keys[dirRow], true);
  }

  private playIdleAnim(dirRow: number) {
    const keys = ["idle_down", "idle_left", "idle_right", "idle_up"];
    const current = this.player.anims.currentAnim?.key;
    if (current !== keys[dirRow]) this.player.play(keys[dirRow], true);
  }
}
