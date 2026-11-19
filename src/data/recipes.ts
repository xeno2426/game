export interface RecipeIngredient {
  itemId: string;
  count: number;
}

export interface CraftingRecipe {
  id: string;
  name: string;
  outputItemId: string;
  outputCount: number;
  ingredients: RecipeIngredient[];
  craftTimeSec: number;
  stationRequired?: 'none' | 'workbench' | 'campfire';
}

export const RECIPES: CraftingRecipe[] = [
  {
    id: 'craft_rope',
    name: 'Stout Rope',
    outputItemId: 'rope',
    outputCount: 1,
    ingredients: [{ itemId: 'palm_frond', count: 3 }],
    craftTimeSec: 1.0,
    stationRequired: 'none',
  },
  {
    id: 'craft_bandage',
    name: 'Bandage',
    outputItemId: 'bandage',
    outputCount: 1,
    ingredients: [{ itemId: 'cloth', count: 2 }],
    craftTimeSec: 1.5,
    stationRequired: 'none',
  },
  {
    id: 'craft_scrap_axe',
    name: 'Scrap Axe',
    outputItemId: 'scrap_axe',
    outputCount: 1,
    ingredients: [
      { itemId: 'wood_log', count: 3 },
      { itemId: 'scrap_metal', count: 2 },
      { itemId: 'rope', count: 1 },
    ],
    craftTimeSec: 3.0,
    stationRequired: 'none',
  },
  {
    id: 'craft_scrap_pipe',
    name: 'Scrap Pipe',
    outputItemId: 'scrap_pipe',
    outputCount: 1,
    ingredients: [
      { itemId: 'scrap_metal', count: 3 },
      { itemId: 'cloth', count: 1 },
    ],
    craftTimeSec: 2.0,
    stationRequired: 'none',
  },
  {
    id: 'craft_slingshot',
    name: 'Slingshot',
    outputItemId: 'slingshot',
    outputCount: 1,
    ingredients: [
      { itemId: 'wood_log', count: 2 },
      { itemId: 'cloth', count: 2 },
      { itemId: 'rope', count: 1 },
    ],
    craftTimeSec: 2.5,
    stationRequired: 'none',
  },
  {
    id: 'craft_pebbles',
    name: 'Pebbles (x10)',
    outputItemId: 'pebble',
    outputCount: 10,
    ingredients: [{ itemId: 'scrap_metal', count: 1 }],
    craftTimeSec: 1.0,
    stationRequired: 'none',
  },
  {
    id: 'craft_cooked_meat',
    name: 'Cook Meat',
    outputItemId: 'cooked_meat',
    outputCount: 1,
    ingredients: [{ itemId: 'raw_meat', count: 1 }],
    craftTimeSec: 4.0,
    stationRequired: 'campfire',
  },
];
