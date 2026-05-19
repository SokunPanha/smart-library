export type CellType = "EMPTY" | "CABINET" | "SHELF" | "WALL" | "DOOR" | "TABLE" | "DESK" | "WINDOW";

export interface MapCell {
  row: number;
  col: number;
  type: CellType;
  shelfId?: string;
  cabinetCode?: string;
  label?: string;
}

export const PALETTE: CellType[] = ["EMPTY", "CABINET", "SHELF", "WALL", "DOOR", "TABLE", "DESK", "WINDOW"];
