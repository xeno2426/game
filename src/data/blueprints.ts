import type { IconName } from '../ui/icons';
import type { RecipeIngredient } from './recipes';

export interface BuildSocket {
  id: string;
  type: 'horizontal' | 'vertical_top' | 'vertical_bottom';
  offset: [number, number, number]; // [x, y, z] relative to center
}

export interface BlueprintDefinition {
  id: string;
  name: string;
  icon: IconName;
  description: string;
  cost: RecipeIngredient[];
  dimensions: [number, number, number]; // [width, height, depth]
  sockets: BuildSocket[];
}

export const BLUEPRINTS: Record<string, BlueprintDefinition> = {
  foundation: {
    id: 'foundation',
    name: 'Foundation',
    icon: 'foundation',
    description: 'Sturdy 3x3m timber deck for placing structures on land or atop stilts.',
    cost: [{ itemId: 'wood_log', count: 4 }],
    dimensions: [3, 0.4, 3],
    sockets: [
      { id: 'north', type: 'horizontal', offset: [0, 0, -3] },
      { id: 'south', type: 'horizontal', offset: [0, 0, 3] },
      { id: 'east', type: 'horizontal', offset: [3, 0, 0] },
      { id: 'west', type: 'horizontal', offset: [-3, 0, 0] },
      { id: 'top', type: 'vertical_top', offset: [0, 0.2, 0] },
      { id: 'bottom', type: 'vertical_bottom', offset: [0, -3.0, 0] },
    ],
  },
  stilts: {
    id: 'stilts',
    name: 'High-Tide Stilts',
    icon: 'stilts',
    description: 'Elevates foundation 3m above sea level to keep shelter dry during high tide.',
    cost: [
      { itemId: 'wood_log', count: 4 },
      { itemId: 'rope', count: 2 },
    ],
    dimensions: [3, 3, 3],
    sockets: [
      { id: 'top', type: 'vertical_top', offset: [0, 3.0, 0] },
      { id: 'north', type: 'horizontal', offset: [0, 0, -3] },
      { id: 'south', type: 'horizontal', offset: [0, 0, 3] },
      { id: 'east', type: 'horizontal', offset: [3, 0, 0] },
      { id: 'west', type: 'horizontal', offset: [-3, 0, 0] },
    ],
  },
  wall: {
    id: 'wall',
    name: 'Plank Wall',
    icon: 'wall',
    description: 'Provides shelter from wind and reduces exposure drain.',
    cost: [
      { itemId: 'wood_log', count: 3 },
      { itemId: 'rope', count: 1 },
    ],
    dimensions: [3, 3, 0.2],
    sockets: [
      { id: 'top', type: 'vertical_top', offset: [0, 3.0, 0] },
      { id: 'left', type: 'horizontal', offset: [-3, 0, 0] },
      { id: 'right', type: 'horizontal', offset: [3, 0, 0] },
    ],
  },
  doorframe: {
    id: 'doorframe',
    name: 'Doorframe',
    icon: 'door',
    description: 'Wall with open passage for easy entry and exit.',
    cost: [{ itemId: 'wood_log', count: 3 }],
    dimensions: [3, 3, 0.2],
    sockets: [
      { id: 'top', type: 'vertical_top', offset: [0, 3.0, 0] },
      { id: 'left', type: 'horizontal', offset: [-3, 0, 0] },
      { id: 'right', type: 'horizontal', offset: [3, 0, 0] },
    ],
  },
  roof: {
    id: 'roof',
    name: 'Thatched Roof',
    icon: 'roof',
    description: 'Slanted palm frond roof that blocks rain and warms the interior.',
    cost: [
      { itemId: 'wood_log', count: 2 },
      { itemId: 'palm_frond', count: 4 },
    ],
    dimensions: [3, 1.2, 3],
    sockets: [
      { id: 'north', type: 'horizontal', offset: [0, 0, -3] },
      { id: 'south', type: 'horizontal', offset: [0, 0, 3] },
      { id: 'east', type: 'horizontal', offset: [3, 0, 0] },
      { id: 'west', type: 'horizontal', offset: [-3, 0, 0] },
    ],
  },
  campfire: {
    id: 'campfire',
    name: 'Campfire',
    icon: 'campfire',
    description: 'Warmth source that rapidly drops exposure and cooks raw meat.',
    cost: [
      { itemId: 'wood_log', count: 3 },
      { itemId: 'scrap_metal', count: 2 },
    ],
    dimensions: [1.2, 0.6, 1.2],
    sockets: [],
  },
  rain_collector: {
    id: 'rain_collector',
    name: 'Rain Collector',
    icon: 'rainCollector',
    description: 'Catches fresh rainwater during high-tide storms.',
    cost: [
      { itemId: 'wood_log', count: 3 },
      { itemId: 'cloth', count: 2 },
      { itemId: 'plastic_barrel', count: 1 },
    ],
    dimensions: [1.5, 1.8, 1.5],
    sockets: [],
  },
  raft_base: {
    id: 'raft_base',
    name: 'Modular Raft',
    icon: 'raft',
    description: 'Buoyant floating vessel fitted with blue barrels and canvas sail.',
    cost: [
      { itemId: 'wood_log', count: 4 },
      { itemId: 'plastic_barrel', count: 2 },
      { itemId: 'rope', count: 2 },
    ],
    dimensions: [3, 0.8, 3],
    sockets: [
      { id: 'north', type: 'horizontal', offset: [0, 0, -3] },
      { id: 'south', type: 'horizontal', offset: [0, 0, 3] },
      { id: 'east', type: 'horizontal', offset: [3, 0, 0] },
      { id: 'west', type: 'horizontal', offset: [-3, 0, 0] },
    ],
  },
};
