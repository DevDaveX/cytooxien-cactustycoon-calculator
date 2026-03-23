
import type { BuildingType } from './productionEngine';

export const UPGRADE_SCHEDULE: [number, number][] = [
  [0, 0],         
  [120, 1],       
  [180, 1],       
  [240, 1],       
  [300, 1],       
  [360, 1],       
  [420, 1],       
  [480, 1],       
  [540, 1],       
  [600, 1],       
  [900, 1],       
  [1200, 2],      
  [1500, 2],      
  [1800, 2],      
  [2100, 3],      
  [2400, 3],      
  [2700, 3],      
  [3000, 4],      
  [3300, 4],      
  [3600, 4],      
  [7200, 8],      
  [10800, 12],    
  [14400, 16],    
  [21600, 24],    
  [28800, 32],    
  [43200, 48],    
  [57600, 64],    
  [79200, 88],    
  [100800, 112],  
  [129600, 144],  
  [0, 0],         
];

const PRICE_GROUP_A: number[] = [
  0,                  
  100_000,            
  800_000,            
  6_400_000,          
  51_200_000,         
  409_600_000,        
  3_277_000_000,      
  26_214_000_000,     
  209_715_000_000,    
  1_677_720_000_000,  
];

const PRICE_GROUP_B: number[] = [
  900_000,              
  5_400_000,            
  32_400_000,           
  194_400_000,          
  1_166_000_000,        
  6_998_000_000,        
  41_990_000_000,       
  251_942_000_000,      
  1_510_000_000_000,    
  12_080_000_000_000,   
];

const PRICE_GROUP_C: number[] = [
  0,                    
  2_200_000,            
  15_440_000,           
  108_040_000,          
  756_320_000,          
  5_294_000_000,        
  37_059_000_000,       
  259_416_000_000,      
  1_820_000_000_000,    
  14_560_000_000_000,   
];

const PRICE_GROUP_D: number[] = [
  25_000_000,                    
  125_000_000,           
  625_000_000,          
  3_125_000_000,          
  15_625_000_000,        
  78_125_000_000,       
  390_625_000_000,       
  1_950_000_000_000,      
  9_760_000_000_000,    
  12_710_000_000_000,   
];

export const ROEHRE_PRICES: number[] = [1_000, 20_000];
export const VENTIL_PRICES: number[] = [1_000, 20_000];

const PRICE_GROUP_MAP: Record<BuildingType, number[]> = {
  kaktuslager: PRICE_GROUP_A,
  kaktusfabrik: PRICE_GROUP_A,
  kohlelager: PRICE_GROUP_A,
  kohlekraftwerk: PRICE_GROUP_A,
  Kohlebohrer: PRICE_GROUP_B,
  kuehlmittelanlage: PRICE_GROUP_C,
  uranlager: PRICE_GROUP_C,
  atomkraftwerk: PRICE_GROUP_C,
  uranbohrer: PRICE_GROUP_D,
};

export function getInstancePrice(type: BuildingType, instanceNumber: number): number {
  const prices = PRICE_GROUP_MAP[type];
  if (!prices) return 0;
  const idx = instanceNumber - 1;
  if (idx < 0) return 0;
  if (idx < prices.length) return prices[idx];
  
  const multiplier = type === 'uranbohrer' ? 5 : (['kuehlmittelanlage', 'uranlager', 'atomkraftwerk'].includes(type) ? 7 : 8);
  const lastKnown = prices[prices.length - 1];
  const extra = idx - prices.length + 1;
  return Math.round(lastKnown * Math.pow(multiplier, extra));
}

export function getTotalInstanceCost(type: BuildingType, count: number): number {
  let total = 0;
  for (let i = 1; i <= count; i++) {
    total += getInstancePrice(type, i);
  }
  return total;
}

export function getUpgradeCost(level: number): { timeSeconds: number; rubies: number } {
  if (level < 0 || level >= UPGRADE_SCHEDULE.length) return { timeSeconds: 0, rubies: 0 };
  const [timeSeconds, rubies] = UPGRADE_SCHEDULE[level];
  return { timeSeconds, rubies };
}

export function getTotalRubies(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i <= Math.min(targetLevel, 30); i++) {
    total += UPGRADE_SCHEDULE[i][1];
  }
  return total;
}

export function getTotalUpgradeTime(targetLevel: number): number {
  let total = 0;
  for (let i = 1; i <= Math.min(targetLevel, 30); i++) {
    total += UPGRADE_SCHEDULE[i][0];
  }
  return total;
}

export function formatUpgradeTime(seconds: number): string {
  if (seconds <= 0) return 'Max';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} Min`;
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return h > 0 ? `${d}T ${h}h` : `${d}T`;
}
