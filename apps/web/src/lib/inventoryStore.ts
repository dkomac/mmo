import type { InventoryItem, CharacterEquipment, EquipmentSlot } from "@browser-mmo/shared";

type Listener = () => void;

class InventoryStore {
  inventory: InventoryItem[] = [];
  equipment: CharacterEquipment = {};
  private listeners = new Set<Listener>();

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  update(inventory: InventoryItem[], equipment: CharacterEquipment) {
    this.inventory = inventory;
    this.equipment = equipment;
    this.listeners.forEach((fn) => fn());
  }

  // Wired by GameScene once WsManager is connected
  sendEquip: ((inventoryItemId: string) => void) | null = null;
  sendUnequip: ((slot: EquipmentSlot) => void) | null = null;
}

export const inventoryStore = new InventoryStore();
