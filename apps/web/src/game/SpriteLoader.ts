import Phaser from "phaser";
import type { SpriteMetadata } from "@browser-mmo/shared";

// Vite discovers all sprite JSONs at build time — no manual registration needed.
// To add a sprite: drop a .json into src/assets/sprites/**/ and a .png into public/assets/sprites/**/
const modules = import.meta.glob<SpriteMetadata>(
  "../assets/sprites/**/*.json",
  { eager: true, import: "default" },
);

export const spriteRegistry = new Map<string, SpriteMetadata>(
  Object.values(modules).map((m) => [m.id, m]),
);

/**
 * Call in Phaser scene preload() to queue real PNG spritesheets.
 * For sprites without a real PNG, call generatePlaceholders() in create() instead.
 */
export function preloadSprites(scene: Phaser.Scene) {
  for (const meta of spriteRegistry.values()) {
    scene.load.spritesheet(meta.id, `/assets/sprites/${meta.image}`, {
      frameWidth: meta.frameWidth,
      frameHeight: meta.frameHeight,
    });
  }
}

/**
 * For sprites whose PNG failed to load (404), generate a colored placeholder canvas.
 * Call after the load completes, passing the set of keys that failed.
 */
export function generatePlaceholders(scene: Phaser.Scene, failedKeys: Set<string>) {
  for (const meta of spriteRegistry.values()) {
    if (!failedKeys.has(meta.id)) continue;

    const cols = 4;
    const rows = 4;
    const canvas = document.createElement("canvas");
    canvas.width = meta.frameWidth * cols;
    canvas.height = meta.frameHeight * rows;
    const ctx = canvas.getContext("2d")!;

    const dirColors = ["#e74c3c", "#3498db", "#2ecc71", "#f39c12"];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = dirColors[row];
        ctx.fillRect(col * meta.frameWidth, row * meta.frameHeight, meta.frameWidth, meta.frameHeight);
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillRect(
          col * meta.frameWidth + meta.frameWidth / 2 - 2,
          row * meta.frameHeight + meta.frameHeight / 2 - 2,
          4, 4,
        );
      }
    }

    // Register as texture with per-frame data
    const tex = scene.textures.addCanvas(meta.id, canvas);
    if (!tex) continue;
    let i = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        tex.add(i++, 0, col * meta.frameWidth, row * meta.frameHeight, meta.frameWidth, meta.frameHeight);
      }
    }
  }
}

/**
 * Register all animations for a given sprite from its metadata.
 * Animation keys are prefixed: `${spriteId}_${animName}` (e.g. "default_player_walk_down")
 */
export function registerAnimations(scene: Phaser.Scene, spriteId: string) {
  const meta = spriteRegistry.get(spriteId);
  if (!meta) return;

  for (const [name, frames] of Object.entries(meta.animations)) {
    const key = animKey(spriteId, name);
    if (!scene.anims.exists(key)) {
      scene.anims.create({
        key,
        frames: frames.map((f) => ({ key: spriteId, frame: f })),
        frameRate: meta.frameRate,
        repeat: name.startsWith("walk") ? -1 : 0,
      });
    }
  }
}

export function animKey(spriteId: string, animName: string): string {
  return `${spriteId}_${animName}`;
}
