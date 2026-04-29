import Phaser from "phaser";
import { preloadSprites, generatePlaceholders } from "../SpriteLoader";

export class PreloadScene extends Phaser.Scene {
  private failedKeys = new Set<string>();

  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    // Attempt to load all registered sprite PNGs from public/assets/sprites/.
    // Any that 404 will be caught and replaced with placeholders in create().
    preloadSprites(this);
    this.load.on("loaderror", (file: Phaser.Loader.File) => {
      this.failedKeys.add(file.key);
    });

    this.generateTileset();
  }

  create() {
    generatePlaceholders(this, this.failedKeys);
    this.scene.start("GameScene");
  }

  private generateTileset() {
    const tileSize = 16;
    const cols = 4;
    const rows = 4;
    const canvas = document.createElement("canvas");
    canvas.width = tileSize * cols;
    canvas.height = tileSize * rows;
    const ctx = canvas.getContext("2d")!;

    // Row 0: grass  Row 1: dirt/path  Row 2: water  Row 3: wall/dark
    const colors = [
      "#4a7c59", "#5a8f6a", "#3d6b4a", "#2e5438",
      "#8b7355", "#9c8465", "#7a6345", "#6b5535",
      "#4a6fa5", "#5a7fb5", "#3a5f95", "#2a4f85",
      "#1a1a1a", "#2a2a2a", "#0a0a0a", "#3a3a3a",
    ];

    colors.forEach((color, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      ctx.fillStyle = color;
      ctx.fillRect(col * tileSize, row * tileSize, tileSize, tileSize);
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.strokeRect(col * tileSize + 0.5, row * tileSize + 0.5, tileSize - 1, tileSize - 1);
    });

    const tex = this.textures.addCanvas("tileset", canvas);
    if (tex) {
      for (let i = 0; i < colors.length; i++) {
        tex.add(i, 0, (i % cols) * tileSize, Math.floor(i / cols) * tileSize, tileSize, tileSize);
      }
    }
  }
}
