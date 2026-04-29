import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";
import { PreloadScene } from "./scenes/PreloadScene";
import type { Database } from "../lib/database.types";
import type { Session } from "@supabase/supabase-js";

type Character = Database["public"]["Tables"]["characters"]["Row"];

export function createGame(parent: HTMLElement, character: Character, session: Session): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: parent.clientWidth,
    height: parent.clientHeight,
    backgroundColor: "#1a1a2e",
    pixelArt: true,
    scene: [PreloadScene, GameScene],
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  });

  game.registry.set("character", character);
  game.registry.set("accessToken", session.access_token);

  return game;
}
