// Tile indices reference the generated tileset (4 columns x 4 rows):
// Row 0 (0-3):  grass variants
// Row 1 (4-7):  dirt/path
// Row 2 (8-11): water
// Row 3 (12-15): wall/dark
//
// collision: true = blocked, false = walkable

export type MapData = {
  id: string;
  ground: number[][];
  decoration: number[][];  // -1 = empty
  collision: boolean[][];
};

// prettier-ignore
export const STARTER_MAP: MapData = {
  id: "starter_map",

  ground: [
    [12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12],
    [12, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 1, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 4, 4, 4, 0, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 8, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 9, 9, 8, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 8, 8, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12],
    [12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,12],
    [12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12],
  ],

  decoration: [
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
  ],

  collision: [
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
  ],
};
