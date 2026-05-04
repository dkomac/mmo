# browser-mmo

A real-time browser MMO built with Phaser 3, React, and WebSockets.

## Monorepo structure

```
apps/web      — Phaser 3 + React frontend (Vite, TypeScript)
apps/server   — WebSocket game server (Node.js, TypeScript)
packages/shared — shared types, constants, collision maps
```

`apps/web` and `apps/server` both import from `packages/shared` via `dist/`. **Always rebuild shared after editing its source:**

```bash
cd packages/shared && pnpm build
```

## Dev

```bash
pnpm dev           # starts web (Vite) + server (ts-node-dev) concurrently
pnpm test          # run all tests across all packages
pnpm build         # build everything (shared → web → server)
pnpm typecheck     # type-check all packages
```

Server requires a `.env` in `apps/server/`:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=3001
```

The server runs without Supabase credentials — inventory and position persistence are disabled but the WebSocket game loop works.

## Architecture

- **WebSocket protocol** — client sends `move`, `stop`, `equip_item`, `unequip_item`, `chat`; server broadcasts `world_state`, `player_joined`, `player_left`, `player_moved`, `inventory_updated`, `chat`
- **Client-side prediction** — the client moves the player immediately on input and the server sends corrections when positions diverge beyond `CORRECTION_THRESHOLD`
- **Map** — tile-based (16px/tile), collision grid lives in `packages/shared/src/constants/maps.ts` and must match the `ground` array in `apps/web/src/game/map/StarterMap.ts`
- **Tile indices** — 0–3: grass, 4–7: dirt/path, 8–11: water, 12–15: wall/dark

## Test counts

54 total: 5 shared · 31 server · 18 web. Run `pnpm test` from root.
