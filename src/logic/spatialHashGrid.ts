export interface SpatialNode<T> {
  id: string;
  x: number;
  z: number;
  data: T;
}

export class SpatialHashGrid<T> {
  public cellSize: number;
  private cells: Map<string, SpatialNode<T>[]> = new Map();

  constructor(cellSize = 16.0) {
    this.cellSize = cellSize;
  }

  private hash(cx: number, cz: number): string {
    return `${cx}_${cz}`;
  }

  public insert(node: SpatialNode<T>): void {
    const cx = Math.floor(node.x / this.cellSize);
    const cz = Math.floor(node.z / this.cellSize);
    const key = this.hash(cx, cz);

    let list = this.cells.get(key);
    if (!list) {
      list = [];
      this.cells.set(key, list);
    }
    list.push(node);
  }

  public remove(id: string, x: number, z: number): boolean {
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    const key = this.hash(cx, cz);

    const list = this.cells.get(key);
    if (!list) return false;

    const idx = list.findIndex((n) => n.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
      if (list.length === 0) {
        this.cells.delete(key);
      }
      return true;
    }
    return false;
  }

  public clear(): void {
    this.cells.clear();
  }

  // Query nodes within radius around (x, z) into outArray (zero allocation if reusing outArray)
  public query(x: number, z: number, radius: number, outArray: SpatialNode<T>[]): SpatialNode<T>[] {
    outArray.length = 0;
    const r2 = radius * radius;

    const minCx = Math.floor((x - radius) / this.cellSize);
    const maxCx = Math.floor((x + radius) / this.cellSize);
    const minCz = Math.floor((z - radius) / this.cellSize);
    const maxCz = Math.floor((z + radius) / this.cellSize);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cz = minCz; cz <= maxCz; cz++) {
        const key = this.hash(cx, cz);
        const list = this.cells.get(key);
        if (!list) continue;

        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          const dx = item.x - x;
          const dz = item.z - z;
          if (dx * dx + dz * dz <= r2) {
            outArray.push(item);
          }
        }
      }
    }

    return outArray;
  }
}
