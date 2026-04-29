import Phaser from "phaser";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    // Generate a 16x16 tileset programmatically so the game works without asset files.
    // Replace with a real tileset PNG by loading it here instead.
    const tileSize = 16;
    const cols = 4;
    const rows = 4;
    const canvas = document.createElement("canvas");
    canvas.width = tileSize * cols;
    canvas.height = tileSize * rows;
    const ctx = canvas.getContext("2d")!;

    const colors = [
      "#4a7c59", "#5a8f6a", "#3d6b4a", "#2e5438", // grass variants
      "#8b7355", "#9c8465", "#7a6345", "#6b5535", // dirt/path variants
      "#4a6fa5", "#5a7fb5", "#3a5f95", "#2a4f85", // water variants
      "#1a1a1a", "#2a2a2a", "#0a0a0a", "#3a3a3a", // wall/collision variants
    ];

    colors.forEach((color, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.fillStyle = color;
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      // subtle border
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.strokeRect(col * tileSize + 0.5, row * tileSize + 0.5, tileSize - 1, tileSize - 1);
    });

    this.textures.addCanvas("tileset", canvas);

    // Player sprite: simple colored square with direction indicator
    const playerCanvas = document.createElement("canvas");
    playerCanvas.width = 16 * 4; // 4 frames per row
    playerCanvas.height = 16 * 4; // 4 rows (down, left, right, up)
    const pc = playerCanvas.getContext("2d")!;

    const dirColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"];
    const indicatorOffsets: [number, number][] = [[8, 12], [4, 8], [10, 8], [8, 4]]; // down, left, right, up

    for (let dir = 0; dir < 4; dir++) {
      for (let frame = 0; frame < 4; frame++) {
        const x = frame * 16;
        const y = dir * 16;
        pc.fillStyle = dirColors[dir];
        pc.fillRect(x + 2, y + 2, 12, 12);
        // direction dot
        pc.fillStyle = "#ffffff";
        const [dx, dy] = indicatorOffsets[dir];
        pc.fillRect(x + dx - 2, y + dy - 2, 4, 4);
      }
    }

    this.textures.addCanvas("player", playerCanvas);
  }

  create() {
    this.scene.start("GameScene");
  }
}
