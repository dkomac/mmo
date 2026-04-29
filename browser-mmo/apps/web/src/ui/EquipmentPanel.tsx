import type { EquipmentSlot } from "@browser-mmo/shared";

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

const INVENTORY_ROWS = 4;
const INVENTORY_COLS = 5;

export function EquipmentPanel() {
  return (
    <div style={styles.panel}>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Character</div>
        <div style={styles.charPreview}>
          <div style={styles.charIcon}>@</div>
          <div style={styles.charName}>Player</div>
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Equipment</div>
        <div style={styles.equipGrid}>
          {SLOTS.map(({ slot, label }) => (
            <div key={slot} style={styles.equipSlot} title={label}>
              <div style={styles.slotLabel}>{label}</div>
              <div style={styles.slotEmpty}>—</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Inventory</div>
        <div style={styles.inventoryGrid}>
          {Array.from({ length: INVENTORY_ROWS * INVENTORY_COLS }).map((_, i) => (
            <div key={i} style={styles.inventoryCell} />
          ))}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 220,
    minWidth: 220,
    height: "100vh",
    background: "#16213e",
    borderLeft: "2px solid #0f3460",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    overflowY: "auto",
    fontFamily: "'Courier New', monospace",
    color: "#e0e0e0",
  },
  section: {
    padding: "12px 12px 8px",
    borderBottom: "1px solid #0f3460",
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#53d8fb",
    marginBottom: 8,
  },
  charPreview: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
  },
  charIcon: {
    width: 40,
    height: 40,
    background: "#0f3460",
    border: "1px solid #53d8fb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#e74c3c",
  },
  charName: {
    fontSize: 13,
    fontWeight: "bold",
  },
  equipGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
  },
  equipSlot: {
    background: "#0f3460",
    border: "1px solid #1a4a80",
    padding: "5px 6px",
    cursor: "pointer",
    transition: "border-color 0.1s",
  },
  slotLabel: {
    fontSize: 9,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  slotEmpty: {
    fontSize: 12,
    color: "#444",
    minHeight: 18,
  },
  inventoryGrid: {
    display: "grid",
    gridTemplateColumns: `repeat(${INVENTORY_COLS}, 1fr)`,
    gap: 3,
  },
  inventoryCell: {
    width: "100%",
    aspectRatio: "1",
    background: "#0f3460",
    border: "1px solid #1a4a80",
    cursor: "pointer",
  },
};
