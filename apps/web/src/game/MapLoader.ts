import type { MapData } from "./maps/StarterMap";

// ── Tiled JSON types (subset of the full Tiled format) ────────────────────────

type TiledLayer = {
  name: string;
  type: "tilelayer" | "objectgroup" | "imagelayer" | "group";
  data?: number[];
  width: number;
  height: number;
  visible?: boolean;
};

type TiledTileset = {
  firstgid: number;
  source?: string;   // external .tsj — you'll need to inline it
  name?: string;
};

type TiledJson = {
  width: number;
  height: number;
  tilewidth: number;
  tileheight: number;
  layers: TiledLayer[];
  tilesets: TiledTileset[];
};

// ── Converter ─────────────────────────────────────────────────────────────────

export function tiledJsonToMapData(id: string, tiled: TiledJson): MapData {
  const firstGid = tiled.tilesets[0]?.firstgid ?? 1;
  const w = tiled.width;
  const h = tiled.height;

  function layerData(name: string): number[] | null {
    return tiled.layers.find(
      (l) => l.type === "tilelayer" && l.name.toLowerCase() === name.toLowerCase(),
    )?.data ?? null;
  }

  function to2D<T>(flat: number[], mapper: (gid: number) => T): T[][] {
    const out: T[][] = [];
    for (let row = 0; row < h; row++) {
      out.push(flat.slice(row * w, (row + 1) * w).map(mapper));
    }
    return out;
  }

  const empty = () => new Array<number>(w * h).fill(0);

  const ground = to2D(
    layerData("ground") ?? empty(),
    (gid) => (gid > 0 ? gid - firstGid : 0),
  );

  const decoration = to2D(
    layerData("decoration") ?? empty(),
    (gid) => (gid > 0 ? gid - firstGid : -1),
  );

  const collision = to2D(
    layerData("collision") ?? empty(),
    (gid) => gid > 0,
  ) as unknown as boolean[][];

  return { id, ground, decoration, collision };
}

/**
 * Fetch a Tiled JSON file from the public directory and convert it.
 * Usage: const map = await loadTiledMap("my_map", "/assets/maps/my_map.json");
 */
export async function loadTiledMap(id: string, url: string): Promise<MapData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load map: ${url} (${res.status})`);
  const tiled = (await res.json()) as TiledJson;
  return tiledJsonToMapData(id, tiled);
}
