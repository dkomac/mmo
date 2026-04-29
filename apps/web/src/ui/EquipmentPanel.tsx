import { useEffect, useState, useSyncExternalStore } from "react";
import type { EquipmentSlot, InventoryItem } from "@browser-mmo/shared";
import type { Database } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { inventoryStore } from "../lib/inventoryStore";

type Character = Database["public"]["Tables"]["characters"]["Row"];

const SLOTS: { slot: EquipmentSlot; label: string }[] = [
  { slot: "head", label: "Head" },
  { slot: "chest", label: "Chest" },
  { slot: "legs", label: "Legs" },
  { slot: "boots", label: "Boots" },
  { slot: "weapon", label: "Weapon" },
  { slot: "shield", label: "Shield" },
  { slot: "ring", label: "Ring" },
  { slot: "amulet", label: "Amulet" },
];

const INVENTORY_COLS = 5;
const INVENTORY_ROWS = 4;

function itemTypeColor(type: string): string {
  if (type === "weapon") return "#8b2020";
  if (type === "armor") return "#1a4a6b";
  if (type === "consumable") return "#1a5c2a";
  return "#3a3a4a";
}

function statSummary(stats: Record<string, number>): string {
  return Object.entries(stats)
    .map(([k, v]) => `+${v} ${k}`)
    .join("  ");
}

function ItemTooltip({ item }: { item: InventoryItem }) {
  return (
    <div style={s.tooltip}>
      <div style={s.tooltipName}>{item.definition.name}</div>
      {item.definition.description && (
        <div style={s.tooltipDesc}>{item.definition.description}</div>
      )}
      {Object.keys(item.definition.stats).length > 0 && (
        <div style={s.tooltipStats}>{statSummary(item.definition.stats)}</div>
      )}
      {item.definition.equipmentSlot && (
        <div style={s.tooltipSlot}>{item.definition.equipmentSlot}</div>
      )}
      {item.quantity > 1 && <div style={s.tooltipQty}>x{item.quantity}</div>}
      {item.definition.equipmentSlot && (
        <div style={s.tooltipHint}>Click to equip</div>
      )}
    </div>
  );
}

export function EquipmentPanel({ character }: { character: Character }) {
  const [loading, setLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<InventoryItem | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<EquipmentSlot | null>(null);

  const inventory = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.inventory,
  );
  const equipment = useSyncExternalStore(
    (cb) => inventoryStore.subscribe(cb),
    () => inventoryStore.equipment,
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [{ data: invRows }, { data: eqRows }, { data: defRows }] = await Promise.all([
        supabase.from("character_inventory").select("id, item_id, quantity, character_id").eq("character_id", character.id),
        supabase.from("character_equipment").select("slot, inventory_item_id").eq("character_id", character.id),
        supabase.from("item_definitions").select("*"),
      ]);

      if (cancelled) return;

      const defMap = new Map((defRows ?? []).map((d) => [d.id, d]));

      const inv: InventoryItem[] = (invRows ?? [])
        .filter((r) => defMap.has(r.item_id))
        .map((r) => {
          const d = defMap.get(r.item_id)!;
          return {
            id: r.id,
            characterId: r.character_id,
            itemId: r.item_id,
            quantity: r.quantity,
            definition: {
              id: d.id,
              name: d.name,
              description: d.description ?? undefined,
              itemType: d.item_type,
              equipmentSlot: (d.equipment_slot ?? undefined) as EquipmentSlot | undefined,
              iconPath: d.icon_path ?? undefined,
              spriteId: d.sprite_id ?? undefined,
              stats: (d.stats as Record<string, number>) ?? {},
              stackable: d.stackable,
              maxStack: d.max_stack,
            },
          };
        });

      const eq: typeof equipment = {};
      for (const row of eqRows ?? []) {
        const invItem = inv.find((i) => i.id === row.inventory_item_id);
        if (invItem) eq[row.slot as EquipmentSlot] = invItem;
      }

      inventoryStore.update(inv, eq);
      setLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [character.id]);

  function handleEquipClick(item: InventoryItem) {
    if (!item.definition.equipmentSlot) return;
    inventoryStore.sendEquip?.(item.id);
  }

  function handleUnequipClick(slot: EquipmentSlot) {
    inventoryStore.sendUnequip?.(slot);
  }

  return (
    <div style={s.panel}>
      {/* Character header */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Character</div>
        <div style={s.charPreview}>
          <div style={s.charIcon}>@</div>
          <div>
            <div style={s.charName}>{character.name}</div>
            <div style={s.charMeta}>Lv {character.level} · {character.sprite_id}</div>
          </div>
        </div>
      </div>

      {/* Equipment slots */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Equipment</div>
        <div style={s.equipGrid}>
          {SLOTS.map(({ slot, label }) => {
            const item = equipment[slot];
            return (
              <div
                key={slot}
                style={{ ...s.equipSlot, ...(item ? s.equipSlotFilled : {}) }}
                onClick={() => item && handleUnequipClick(slot)}
                onMouseEnter={() => item && setHoveredSlot(slot)}
                onMouseLeave={() => setHoveredSlot(null)}
                title={item ? `${item.definition.name} (click to unequip)` : label}
              >
                <div style={s.slotLabel}>{label}</div>
                <div
                  style={{
                    ...s.slotContent,
                    background: item ? itemTypeColor(item.definition.itemType) : "transparent",
                  }}
                >
                  {item ? (
                    <span style={s.slotItemName}>{item.definition.name}</span>
                  ) : (
                    <span style={s.slotEmpty}>—</span>
                  )}
                </div>
                {hoveredSlot === slot && item && (
                  <div style={s.tooltipWrapper}>
                    <ItemTooltip item={item} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventory grid */}
      <div style={s.section}>
        <div style={s.sectionTitle}>
          Inventory {!loading && `(${inventory.length}/${INVENTORY_ROWS * INVENTORY_COLS})`}
        </div>
        {loading ? (
          <div style={s.loadingText}>Loading...</div>
        ) : (
          <div style={s.inventoryGrid}>
            {Array.from({ length: INVENTORY_ROWS * INVENTORY_COLS }).map((_, i) => {
              const item = inventory[i];
              return (
                <div
                  key={i}
                  style={{
                    ...s.inventoryCell,
                    background: item ? itemTypeColor(item.definition.itemType) : "#0f3460",
                    cursor: item ? "pointer" : "default",
                    position: "relative",
                  }}
                  onClick={() => item && handleEquipClick(item)}
                  onMouseEnter={() => item && setHoveredItem(item)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  {item && (
                    <>
                      <div style={s.cellInitial}>
                        {item.definition.name[0].toUpperCase()}
                      </div>
                      {item.quantity > 1 && (
                        <div style={s.cellQty}>{item.quantity}</div>
                      )}
                      {hoveredItem?.id === item.id && (
                        <div style={s.tooltipWrapper}>
                          <ItemTooltip item={item} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  panel: {
    width: 220,
    minWidth: 220,
    height: "100vh",
    background: "#16213e",
    borderLeft: "2px solid #0f3460",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    fontFamily: "'Courier New', monospace",
    color: "#e0e0e0",
  },
  section: {
    padding: "12px 12px 10px",
    borderBottom: "1px solid #0f3460",
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#53d8fb",
    marginBottom: 8,
  },
  charPreview: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  charIcon: {
    width: 36,
    height: 36,
    background: "#0f3460",
    border: "1px solid #53d8fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    color: "#e74c3c",
    flexShrink: 0,
  },
  charName: {
    fontSize: 13,
    fontWeight: "bold",
  },
  charMeta: {
    fontSize: 10,
    color: "#888",
    marginTop: 2,
  },
  equipGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
  },
  equipSlot: {
    background: "#0f3460",
    border: "1px solid #1a4a80",
    padding: "4px 6px",
    cursor: "default",
    position: "relative",
    minHeight: 42,
  },
  equipSlotFilled: {
    border: "1px solid #53d8fb44",
    cursor: "pointer",
  },
  slotLabel: {
    fontSize: 8,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  slotContent: {
    borderRadius: 2,
    padding: "2px 4px",
    minHeight: 18,
    display: "flex",
    alignItems: "center",
  },
  slotItemName: {
    fontSize: 10,
    color: "#e0e0e0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 72,
  },
  slotEmpty: {
    fontSize: 11,
    color: "#333",
  },
  inventoryGrid: {
    display: "grid",
    gridTemplateColumns: `repeat(${INVENTORY_COLS}, 1fr)`,
    gap: 3,
  },
  inventoryCell: {
    aspectRatio: "1",
    border: "1px solid #1a4a80",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  cellInitial: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#e0e0e0cc",
    userSelect: "none",
  },
  cellQty: {
    position: "absolute",
    bottom: 1,
    right: 2,
    fontSize: 8,
    color: "#fff",
    lineHeight: 1,
  },
  loadingText: {
    color: "#555",
    fontSize: 11,
    padding: "8px 0",
  },
  tooltipWrapper: {
    position: "absolute",
    right: "calc(100% + 6px)",
    top: 0,
    zIndex: 100,
    pointerEvents: "none",
  },
  tooltip: {
    background: "#0d1117",
    border: "1px solid #30363d",
    padding: "8px 10px",
    minWidth: 140,
    maxWidth: 200,
    fontFamily: "'Courier New', monospace",
  },
  tooltipName: {
    color: "#e6edf3",
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tooltipDesc: {
    color: "#8b949e",
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  tooltipStats: {
    color: "#3fb950",
    fontSize: 10,
    marginBottom: 3,
  },
  tooltipSlot: {
    color: "#53d8fb",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 3,
  },
  tooltipQty: {
    color: "#8b949e",
    fontSize: 10,
  },
  tooltipHint: {
    color: "#444",
    fontSize: 9,
    marginTop: 4,
    fontStyle: "italic",
  },
};
