# Adding Content

## Adding a New Sprite

A sprite requires two files: a PNG spritesheet and a JSON metadata file.

### 1. Prepare the spritesheet

Arrange frames in a grid (rows = directions, columns = animation frames):

```
Row 0: face-down  frames (idle, walk 1-3)
Row 1: face-left  frames
Row 2: face-right frames
Row 3: face-up    frames
```

All frames must be the same size (e.g. 16×16 or 32×32 pixels).

### 2. Drop the PNG into `public/assets/sprites/`

```
apps/web/public/assets/sprites/
  players/knight.png     ← player sprites
  npcs/merchant.png      ← NPC sprites
  items/fire_sword.png   ← item world sprites (not icons)
```

### 3. Create the metadata JSON in `src/assets/sprites/`

```
apps/web/src/assets/sprites/players/knight.json
```

```json
{
  "id": "knight",
  "image": "players/knight.png",
  "frameWidth": 16,
  "frameHeight": 16,
  "frameRate": 8,
  "animations": {
    "idle_down":  [0],
    "idle_left":  [4],
    "idle_right": [8],
    "idle_up":    [12],
    "walk_down":  [0, 1, 2, 3],
    "walk_left":  [4, 5, 6, 7],
    "walk_right": [8, 9, 10, 11],
    "walk_up":    [12, 13, 14, 15]
  }
}
```

**That's it.** Vite picks up the JSON automatically at build time. `SpriteLoader.ts` registers all animations as `knight_walk_down`, `knight_idle_up`, etc.

### 4. Assign to a character

Set `sprite_id = 'knight'` in the `characters` table. The game scene reads `character.sprite_id` and loads the matching spritesheet.

---

## Adding a New Item

Items are data-only — no code changes needed.

### 1. Add an icon (optional)

Drop a PNG icon into `public/assets/sprites/items/`:

```
public/assets/sprites/items/fire_staff.png
```

### 2. Insert a row into `item_definitions`

Via Supabase Studio, SQL, or `supabase/seed.sql`:

```sql
insert into public.item_definitions
  (id, name, description, item_type, equipment_slot, icon_path, stats, stackable, max_stack)
values
  (
    'fire_staff',
    'Fire Staff',
    'Crackles with magical flame.',
    'weapon',
    'weapon',                          -- null for non-equippable items
    'items/fire_staff.png',
    '{"attack": 4, "magic": 9}'::jsonb,
    false,
    1
  )
on conflict (id) do update set
  name = excluded.name, stats = excluded.stats;
```

**Equipment slots:** `head` · `chest` · `legs` · `boots` · `weapon` · `shield` · `ring` · `amulet`

**Item types:** `weapon` · `armor` · `jewelry` · `consumable`

### 3. Grant to a character (for testing)

```sql
insert into public.character_inventory (character_id, item_id, quantity)
values ('<character-uuid>', 'fire_staff', 1);
```

---

## Adding a New Map

Maps use the [Tiled Map Editor](https://www.mapeditor.org/) JSON export format.

### 1. Create your map in Tiled

- New map → Orthogonal, tile size 16×16
- Create three tile layers (names are case-insensitive):
  - **ground** — base terrain tiles
  - **decoration** — objects drawn on top of ground (use empty tiles for none)
  - **collision** — any non-empty tile marks that cell as blocked; hide this layer in Tiled

### 2. Export as JSON

File → Export As → JSON format. Save to:

```
apps/web/public/assets/maps/my_map.json
```

See `public/assets/maps/example_map.json` for a working example.

### 3. Load it in the game

```ts
import { loadTiledMap } from "../game/MapLoader";

// In GameScene.create() or wherever you initialise the map:
const mapData = await loadTiledMap("my_map", "/assets/maps/my_map.json");
```

### 4. Register the collision data for server-side validation

Add the collision array to `packages/shared/src/index.ts`:

```ts
import myMapCollision from "./maps/my_map_collision.json"; // or inline it

export const MAP_COLLISIONS: Record<string, boolean[][]> = {
  starter_map: STARTER_MAP_COLLISION,
  my_map: myMapCollision,
};
```

Then rebuild the shared package: `pnpm --filter shared build`.

### Tileset

The default programmatic tileset uses these indices:

| Index | Tile      |
|-------|-----------|
| 0–3   | Grass     |
| 4–7   | Dirt/Path |
| 8–11  | Water     |
| 12–15 | Wall/Dark |

To use a real tileset PNG: load it in `PreloadScene.ts` with `this.load.image("tileset", "/assets/tilesets/my_tileset.png")` and remove the programmatic generation.
