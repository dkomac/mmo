export type Direction = "up" | "down" | "left" | "right";

export type EquipmentSlot =
  | "head"
  | "chest"
  | "legs"
  | "boots"
  | "weapon"
  | "shield"
  | "ring"
  | "amulet";

export type PlayerState = {
  characterId: string;
  userId: string;
  name: string;
  spriteId: string;
  mapId: string;
  x: number;
  y: number;
  direction: Direction;
  moving: boolean;
};

export type ItemDefinition = {
  id: string;
  name: string;
  description?: string;
  itemType: string;
  equipmentSlot?: EquipmentSlot;
  iconPath?: string;
  spriteId?: string;
  stats: Record<string, number>;
  stackable: boolean;
  maxStack: number;
};

export type InventoryItem = {
  id: string;
  characterId: string;
  itemId: string;
  quantity: number;
  definition: ItemDefinition;
};

export type CharacterEquipment = Partial<Record<EquipmentSlot, InventoryItem>>;

export type ClientMessage =
  | { type: "move"; direction: Direction; seq: number }
  | { type: "stop"; seq: number }
  | { type: "chat"; message: string }
  | { type: "equip_item"; inventoryItemId: string }
  | { type: "unequip_item"; slot: EquipmentSlot };

export type ServerMessage =
  | { type: "world_state"; players: PlayerState[] }
  | { type: "player_joined"; player: PlayerState }
  | { type: "player_left"; playerId: string }
  | { type: "player_moved"; player: PlayerState }
  | { type: "chat"; fromCharacterId: string; fromName: string; message: string }
  | { type: "inventory_updated"; inventory: InventoryItem[]; equipment: CharacterEquipment }
  | { type: "error"; message: string };

export type SpriteMetadata = {
  id: string;
  image: string;
  frameWidth: number;
  frameHeight: number;
  frameRate: number;
  animations: Record<string, number[]>;
};

// prettier-ignore
export const STARTER_MAP_COLLISION: boolean[][] = [
  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,true, true, true, true, true, true, true,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,true,false,false,false,false,false,true,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,true,false,false,false,false,false,true,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,true, true, true,false,true, true, true,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,true, true, true, true,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,true, true, true, true,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,true, true, true, true,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,true, true, true, true,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
  [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true],
  [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true],
];

export const MAP_COLLISIONS: Record<string, boolean[][]> = {
  starter_map: STARTER_MAP_COLLISION,
};
