import { generateWorldData } from '../logic/worldLogic';

self.onmessage = (e: MessageEvent<{ seed: number }>) => {
  const seed = e.data?.seed ?? 42;
  const worldData = generateWorldData(seed);

  // Transfer ArrayBuffers to avoid copying overhead
  (postMessage as (msg: unknown, transfer: Transferable[]) => void)(
    {
      heightmap: worldData.heightmap,
      biomeMap: worldData.biomeMap,
      seed: worldData.seed,
    },
    [worldData.heightmap.buffer, worldData.biomeMap.buffer]
  );
};
