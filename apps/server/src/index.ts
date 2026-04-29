import { WebSocketServer, WebSocket } from "ws";
import { createClient } from "@supabase/supabase-js";
import type { IncomingMessage } from "http";
import { MAP_COLLISIONS } from "@browser-mmo/shared";
import type {
  PlayerState,
  ServerMessage,
  ClientMessage,
  Direction,
  InventoryItem,
  CharacterEquipment,
  EquipmentSlot,
  ItemDefinition,
} from "@browser-mmo/shared";

const PORT = parseInt(process.env.PORT ?? "3001", 10);
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const MOVE_COOLDOWN_MS = 120;
const PERSIST_INTERVAL_MS = 30_000;

type PlayerSession = {
  ws: WebSocket;
  state: PlayerState;
  lastMoveMs: number;
};

const players = new Map<string, PlayerSession>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function send(ws: WebSocket, msg: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg: ServerMessage, exceptId?: string) {
  for (const [id, session] of players) {
    if (id !== exceptId) send(session.ws, msg);
  }
}

function canWalk(mapId: string, x: number, y: number): boolean {
  const collision = MAP_COLLISIONS[mapId];
  if (!collision) return false;
  if (y < 0 || y >= collision.length) return false;
  if (x < 0 || x >= (collision[0]?.length ?? 0)) return false;
  return !collision[y][x];
}

async function savePosition(state: PlayerState) {
  if (!supabaseAdmin) return;
  await supabaseAdmin
    .from("characters")
    .update({ x: state.x, y: state.y, map_id: state.mapId })
    .eq("id", state.characterId);
}

// ── Inventory ─────────────────────────────────────────────────────────────────

async function getInventoryState(
  characterId: string,
): Promise<{ inventory: InventoryItem[]; equipment: CharacterEquipment }> {
  if (!supabaseAdmin) return { inventory: [], equipment: {} };

  const [{ data: invRows }, { data: eqRows }] = await Promise.all([
    supabaseAdmin.from("character_inventory").select("*").eq("character_id", characterId),
    supabaseAdmin.from("character_equipment").select("*").eq("character_id", characterId),
  ]);

  if (!invRows?.length) return { inventory: [], equipment: {} };

  const itemIds = [...new Set(invRows.map((r) => r.item_id as string))];
  const { data: defRows } = await supabaseAdmin
    .from("item_definitions")
    .select("*")
    .in("id", itemIds);

  const defMap = new Map((defRows ?? []).map((d) => [d.id as string, d]));

  const inventory: InventoryItem[] = invRows
    .filter((row) => defMap.has(row.item_id as string))
    .map((row) => {
      const d = defMap.get(row.item_id as string)!;
      const def: ItemDefinition = {
        id: d.id as string,
        name: d.name as string,
        description: (d.description as string) ?? undefined,
        itemType: d.item_type as string,
        equipmentSlot: (d.equipment_slot as EquipmentSlot) ?? undefined,
        iconPath: (d.icon_path as string) ?? undefined,
        spriteId: (d.sprite_id as string) ?? undefined,
        stats: (d.stats as Record<string, number>) ?? {},
        stackable: d.stackable as boolean,
        maxStack: d.max_stack as number,
      };
      return {
        id: row.id as string,
        characterId: row.character_id as string,
        itemId: row.item_id as string,
        quantity: row.quantity as number,
        definition: def,
      };
    });

  const equipment: CharacterEquipment = {};
  for (const eq of eqRows ?? []) {
    const invItem = inventory.find((i) => i.id === (eq.inventory_item_id as string));
    if (invItem) equipment[eq.slot as EquipmentSlot] = invItem;
  }

  return { inventory, equipment };
}

async function handleEquipItem(session: PlayerSession, inventoryItemId: string) {
  if (!supabaseAdmin) {
    send(session.ws, { type: "error", message: "Server not configured for inventory operations" });
    return;
  }

  // Verify the item belongs to this character
  const { data: invItem } = await supabaseAdmin
    .from("character_inventory")
    .select("id, item_id, character_id")
    .eq("id", inventoryItemId)
    .eq("character_id", session.state.characterId)
    .single();

  if (!invItem) {
    send(session.ws, { type: "error", message: "Item not found in inventory" });
    return;
  }

  // Get the item definition to find the equipment slot
  const { data: def } = await supabaseAdmin
    .from("item_definitions")
    .select("equipment_slot")
    .eq("id", invItem.item_id as string)
    .single();

  const slot = def?.equipment_slot as string | null;
  if (!slot) {
    send(session.ws, { type: "error", message: "Item is not equippable" });
    return;
  }

  await supabaseAdmin.from("character_equipment").upsert(
    {
      character_id: session.state.characterId,
      slot,
      inventory_item_id: inventoryItemId,
    },
    { onConflict: "character_id,slot" },
  );

  const state = await getInventoryState(session.state.characterId);
  send(session.ws, { type: "inventory_updated", ...state });
}

async function handleUnequipItem(session: PlayerSession, slot: EquipmentSlot) {
  if (!supabaseAdmin) {
    send(session.ws, { type: "error", message: "Server not configured for inventory operations" });
    return;
  }

  await supabaseAdmin
    .from("character_equipment")
    .delete()
    .eq("character_id", session.state.characterId)
    .eq("slot", slot);

  const state = await getInventoryState(session.state.characterId);
  send(session.ws, { type: "inventory_updated", ...state });
}

// ── Movement ──────────────────────────────────────────────────────────────────

function handleMove(session: PlayerSession, direction: Direction, seq: number) {
  const now = Date.now();
  if (now - session.lastMoveMs < MOVE_COOLDOWN_MS) return;

  const { x, y, mapId } = session.state;
  const dx = direction === "right" ? 1 : direction === "left" ? -1 : 0;
  const dy = direction === "down" ? 1 : direction === "up" ? -1 : 0;
  const nx = x + dx;
  const ny = y + dy;

  if (!canWalk(mapId, nx, ny)) {
    send(session.ws, { type: "player_moved", player: { ...session.state } });
    return;
  }

  session.state.x = nx;
  session.state.y = ny;
  session.state.direction = direction;
  session.state.moving = true;
  session.lastMoveMs = now;

  broadcast({ type: "player_moved", player: { ...session.state } });
  void seq;
}

// ── Connection ────────────────────────────────────────────────────────────────

const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
  if (!supabaseAdmin) console.warn("No SUPABASE_SERVICE_ROLE_KEY — inventory and persistence disabled");
});

wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const token = url.searchParams.get("token");
  const characterId = url.searchParams.get("characterId");

  if (!token || !characterId) {
    send(ws, { type: "error", message: "Missing token or characterId" });
    ws.close(4001, "Unauthorized");
    return;
  }

  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
  if (authError || !user) {
    send(ws, { type: "error", message: "Invalid token" });
    ws.close(4001, "Unauthorized");
    return;
  }

  let playerState: PlayerState;

  if (supabaseAdmin) {
    const { data: char, error: charError } = await supabaseAdmin
      .from("characters")
      .select("id, user_id, name, sprite_id, map_id, x, y")
      .eq("id", characterId)
      .eq("user_id", user.id)
      .single();

    if (charError || !char) {
      send(ws, { type: "error", message: "Character not found" });
      ws.close(4003, "Forbidden");
      return;
    }

    playerState = {
      characterId: char.id as string,
      userId: char.user_id as string,
      name: char.name as string,
      spriteId: char.sprite_id as string,
      mapId: char.map_id as string,
      x: char.x as number,
      y: char.y as number,
      direction: "down",
      moving: false,
    };
  } else {
    playerState = {
      characterId,
      userId: user.id,
      name: "Player",
      spriteId: "default_player",
      mapId: "starter_map",
      x: 5,
      y: 5,
      direction: "down",
      moving: false,
    };
  }

  if (players.has(characterId)) {
    send(ws, { type: "error", message: "Character already connected" });
    ws.close(4002, "Already connected");
    return;
  }

  const session: PlayerSession = { ws, state: playerState, lastMoveMs: 0 };
  players.set(characterId, session);
  console.log(`[+] ${playerState.name} (${characterId})`);

  send(ws, {
    type: "world_state",
    players: [...players.values()].filter((s) => s !== session).map((s) => s.state),
  });
  broadcast({ type: "player_joined", player: playerState }, characterId);

  // Send initial inventory state
  if (supabaseAdmin) {
    const invState = await getInventoryState(characterId);
    if (invState.inventory.length > 0 || Object.keys(invState.equipment).length > 0) {
      send(ws, { type: "inventory_updated", ...invState });
    }
  }

  ws.on("message", (data) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data.toString()) as ClientMessage;
    } catch {
      send(ws, { type: "error", message: "Invalid message" });
      return;
    }

    switch (msg.type) {
      case "move":
        handleMove(session, msg.direction, msg.seq);
        break;
      case "stop":
        session.state.moving = false;
        broadcast({ type: "player_moved", player: { ...session.state } });
        break;
      case "equip_item":
        void handleEquipItem(session, msg.inventoryItemId);
        break;
      case "unequip_item":
        void handleUnequipItem(session, msg.slot);
        break;
      case "chat": {
        const text = msg.message.trim();
        if (text.length > 0 && text.length <= 200) {
          broadcast({ type: "chat", fromCharacterId: characterId, fromName: playerState.name, message: text });
          if (supabaseAdmin) {
            void supabaseAdmin.from("chat_messages").insert({
              character_id: characterId,
              character_name: playerState.name,
              message: text,
            });
          }
        }
        break;
      }
      default:
        break;
    }
  });

  ws.on("close", () => {
    players.delete(characterId);
    broadcast({ type: "player_left", playerId: characterId });
    console.log(`[-] ${playerState.name} (${characterId})`);
    void savePosition(playerState);
  });
});

setInterval(() => {
  for (const session of players.values()) {
    void savePosition(session.state);
  }
}, PERSIST_INTERVAL_MS);
