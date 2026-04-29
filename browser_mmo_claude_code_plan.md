# Claude Code Plan: Browser-Based Top-Down MMO with Supabase

## Project Goal

Build a browser-based top-down MMO-style game using tilemap rendering, custom sprites, multiplayer movement, and a right-side equipment UI.

The first version should be a small but complete vertical slice:
- A top-down tilemap world
- A controllable player character
- Easy custom sprite support
- A right-side equipment and inventory UI
- Supabase-backed auth and persistence
- WebSocket-based multiplayer
- Server-authoritative game state

Do not try to build a huge MMO immediately. Start with one shared map where multiple players can log in, move around, chat, and equip items.

---

## Preferred Stack

Use:

- TypeScript
- React
- Vite
- Phaser 3 or PixiJS for the game renderer
- Tiled JSON tilemaps
- Supabase for:
  - Auth
  - Postgres database
  - Row Level Security
  - Storage for custom sprites, tilesets, and item icons if useful
- Node.js backend for authoritative multiplayer
- WebSockets for real-time player sync
- Shared TypeScript types between client and server

Suggested monorepo structure:

```txt
browser-mmo/
  apps/
    web/
      src/
        game/
        ui/
        lib/
        assets/
    server/
      src/
  packages/
    shared/
      src/
  supabase/
    migrations/
    seed.sql
  docs/
```

---

## Important Architecture Rules

1. The server is authoritative.
2. The client must never be trusted for position, inventory, equipment, combat, currency, or item ownership.
3. Supabase stores persistent state.
4. The WebSocket server owns live world state.
5. React owns the UI.
6. Phaser/Pixi owns the game canvas.
7. Game content should be data-driven where possible.
8. Sprites, maps, items, NPCs, and equipment should be easy to add without changing engine code.

---

## Core Features

### 1. Game View

Create a top-down tilemap game view.

Requirements:
- Render maps exported from Tiled as JSON.
- Support layers:
  - ground
  - decoration
  - collision
  - foreground
- Camera follows the local player.
- Player moves using WASD and arrow keys.
- Collision prevents walking through blocked tiles.
- Other players are rendered on the map.
- Local player should feel responsive.
- Remote players should be interpolated smoothly.

---

### 2. Sprite System

Make it easy to add custom sprites.

Use this folder convention:

```txt
apps/web/src/assets/
  sprites/
    players/
    npcs/
    items/
  tilesets/
  maps/
```

Each sprite should have a JSON metadata file:

```json
{
  "id": "knight",
  "image": "knight.png",
  "frameWidth": 32,
  "frameHeight": 32,
  "frameRate": 8,
  "animations": {
    "idle_down": [0],
    "idle_left": [4],
    "idle_right": [8],
    "idle_up": [12],
    "walk_down": [0, 1, 2, 3],
    "walk_left": [4, 5, 6, 7],
    "walk_right": [8, 9, 10, 11],
    "walk_up": [12, 13, 14, 15]
  }
}
```

Build a sprite loader that:
- Reads sprite metadata.
- Loads the image.
- Registers animations automatically.
- Allows a character to reference a sprite by `sprite_id`.

The long-term goal is that I can create a new sprite sheet and metadata JSON file, drop them into the project or Supabase Storage, and use them in-game.

---

### 3. Right-Side Equipment UI

Create a fixed right-side UI panel outside the game canvas.

Layout:

```txt
+-----------------------------------+----------------------+
|                                   | Character            |
|            Game Canvas            | Equipment            |
|                                   | Inventory            |
+-----------------------------------+----------------------+
```

The right-side panel should include:

- Character name
- Character preview placeholder
- Equipment slots:
  - Head
  - Chest
  - Legs
  - Boots
  - Weapon
  - Shield
  - Ring
  - Amulet
- Inventory grid
- Item hover tooltips
- Click-to-equip
- Click-to-unequip

React should manage the equipment UI.

The backend and Supabase should store the actual inventory and equipment state.

---

### 4. Multiplayer

Use a Node.js WebSocket server.

Client sends input, not final position.

Client messages:

```ts
export type ClientMessage =
  | {
      type: "move";
      direction: "up" | "down" | "left" | "right";
      seq: number;
    }
  | {
      type: "stop";
      seq: number;
    }
  | {
      type: "chat";
      message: string;
    }
  | {
      type: "equip_item";
      inventoryItemId: string;
    }
  | {
      type: "unequip_item";
      slot: EquipmentSlot;
    };
```

Server messages:

```ts
export type ServerMessage =
  | {
      type: "world_state";
      players: PlayerState[];
    }
  | {
      type: "player_joined";
      player: PlayerState;
    }
  | {
      type: "player_left";
      playerId: string;
    }
  | {
      type: "player_moved";
      player: PlayerState;
    }
  | {
      type: "chat";
      fromCharacterId: string;
      fromName: string;
      message: string;
    }
  | {
      type: "inventory_updated";
      inventory: InventoryItem[];
      equipment: CharacterEquipment;
    }
  | {
      type: "error";
      message: string;
    };
```

The server should:
- Authenticate WebSocket connections using a Supabase JWT.
- Load the player character from Supabase.
- Validate movement.
- Check collision.
- Broadcast player positions.
- Persist character position periodically and on disconnect.
- Validate equipment changes.
- Save inventory/equipment updates to Supabase.

---

## Supabase Database Design

Create Supabase migrations for the following tables.

### profiles

Stores public user profile data.

```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);
```

### characters

Stores playable characters.

```sql
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sprite_id text not null default 'default_player',
  map_id text not null default 'starter_map',
  x integer not null default 10,
  y integer not null default 10,
  level integer not null default 1,
  experience integer not null default 0,
  created_at timestamptz not null default now(),

  unique(user_id, name)
);
```

### item_definitions

Stores static item definitions.

```sql
create table if not exists public.item_definitions (
  id text primary key,
  name text not null,
  description text,
  item_type text not null,
  equipment_slot text,
  icon_path text,
  sprite_id text,
  stats jsonb not null default '{}'::jsonb,
  stackable boolean not null default false,
  max_stack integer not null default 1,
  created_at timestamptz not null default now()
);
```

### character_inventory

Stores character-owned items.

```sql
create table if not exists public.character_inventory (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  item_id text not null references public.item_definitions(id),
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);
```

### character_equipment

Stores equipped items per character and slot.

```sql
create table if not exists public.character_equipment (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters(id) on delete cascade,
  slot text not null,
  inventory_item_id uuid not null references public.character_inventory(id) on delete cascade,

  unique(character_id, slot)
);
```

### chat_messages

Optional persisted chat log.

```sql
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  character_id uuid references public.characters(id) on delete set null,
  character_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);
```

---

## Supabase Row Level Security

Enable RLS for all player-owned tables.

```sql
alter table public.profiles enable row level security;
alter table public.characters enable row level security;
alter table public.character_inventory enable row level security;
alter table public.character_equipment enable row level security;
alter table public.chat_messages enable row level security;
```

Policies:

```sql
create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Users can read their own characters"
on public.characters
for select
using (auth.uid() = user_id);

create policy "Users can insert their own characters"
on public.characters
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own characters"
on public.characters
for update
using (auth.uid() = user_id);

create policy "Users can read inventory for their own characters"
on public.character_inventory
for select
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_inventory.character_id
    and c.user_id = auth.uid()
  )
);

create policy "Users can read equipment for their own characters"
on public.character_equipment
for select
using (
  exists (
    select 1
    from public.characters c
    where c.id = character_equipment.character_id
    and c.user_id = auth.uid()
  )
);

create policy "Users can read item definitions"
on public.item_definitions
for select
using (true);

create policy "Users can read chat messages"
on public.chat_messages
for select
using (true);
```

Important:
- Normal clients should not directly mutate inventory or equipment.
- Inventory/equipment writes should happen through the authoritative server using the Supabase service role key.
- Never expose the service role key to the browser.

---

## Environment Variables

### Web App

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_WS_URL=ws://localhost:3001
```

### Server

```txt
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
```

The server should use:
- `SUPABASE_ANON_KEY` to verify user JWTs if appropriate.
- `SUPABASE_SERVICE_ROLE_KEY` only for trusted server-side writes.

---

## Shared Types

Create shared TypeScript types in `packages/shared`.

Include:

```ts
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
```

---

## Milestones

### Milestone 1: Project Setup

Create:
- Vite React app
- Node WebSocket server
- Shared TypeScript package
- Supabase client setup
- Basic folder structure
- Environment variable examples

Acceptance criteria:
- Web app runs.
- Server runs.
- Shared types can be imported by both web and server.

---

### Milestone 2: Local Tilemap Prototype

Create:
- Tilemap rendering
- Local player movement
- Camera follow
- Collision against blocked tiles
- Placeholder player sprite
- Right-side equipment panel placeholder

Acceptance criteria:
- Player can move around a map.
- Player cannot walk through blocked tiles.
- Equipment UI appears on the right side.

---

### Milestone 3: Supabase Auth and Characters

Create:
- Login screen
- Sign up / sign in with Supabase Auth
- Character creation
- Character selection
- Load selected character into the game

Acceptance criteria:
- User can authenticate.
- User can create a character.
- User can enter the game as that character.

---

### Milestone 4: Multiplayer Movement

Create:
- WebSocket authentication using Supabase JWT
- Server-side connected player registry
- Authoritative movement validation
- Broadcast nearby player state
- Render other players

Acceptance criteria:
- Two browser windows can log in as different characters.
- Both players can see each other moving.
- Server rejects invalid movement.

---

### Milestone 5: Inventory and Equipment

Create:
- Item definitions
- Inventory loading
- Equipment loading
- Right-side inventory grid
- Equip and unequip actions through WebSocket server
- Supabase persistence

Acceptance criteria:
- Character inventory loads from Supabase.
- Clicking an equippable item equips it.
- Equipment updates are saved.
- Client cannot fake equipment ownership.

---

### Milestone 6: Chat

Create:
- In-game chat input
- WebSocket chat broadcast
- Optional persisted chat messages in Supabase

Acceptance criteria:
- Players on the same map can chat.
- Messages display with character names.
- Empty or overly long messages are rejected.

---

### Milestone 7: Content Pipeline

Create:
- Sprite metadata loader
- Item definition seed data
- Tiled map loading documentation
- Example custom player sprite
- Example custom item icon

Acceptance criteria:
- Adding a new sprite requires only an image and metadata file.
- Adding a new item requires only database seed data and an icon.
- Adding a new map uses Tiled JSON.

---

## Initial Seed Data

Create a `supabase/seed.sql` file with a few item definitions:

```sql
insert into public.item_definitions
  (id, name, description, item_type, equipment_slot, icon_path, stats, stackable, max_stack)
values
  (
    'iron_sword',
    'Iron Sword',
    'A basic iron sword.',
    'weapon',
    'weapon',
    'items/iron_sword.png',
    '{"attack": 3}'::jsonb,
    false,
    1
  ),
  (
    'wooden_shield',
    'Wooden Shield',
    'A simple wooden shield.',
    'armor',
    'shield',
    'items/wooden_shield.png',
    '{"defense": 2}'::jsonb,
    false,
    1
  ),
  (
    'health_potion',
    'Health Potion',
    'Restores a small amount of health.',
    'consumable',
    null,
    'items/health_potion.png',
    '{"heal": 25}'::jsonb,
    true,
    20
  )
on conflict (id) do nothing;
```

---

## First Claude Code Task

Start by implementing Milestone 1 and Milestone 2 only.

Do not implement multiplayer, auth, inventory, or chat yet.

Create:
- Vite React app in `apps/web`
- Node TypeScript server app in `apps/server`
- Shared types package in `packages/shared`
- Game canvas using Phaser or PixiJS
- A simple test tilemap
- Local player movement
- Collision detection
- Camera follow
- Right-side equipment panel placeholder
- `.env.example` files for web and server
- Supabase migration files for the schema above, but do not wire Supabase into the app yet

After that, provide:
- A summary of what was created
- How to run the project locally
- What files to edit to add new sprites
- What the next milestone should be
