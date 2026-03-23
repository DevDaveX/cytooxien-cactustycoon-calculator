
import {
  KOHLEKRAFTWERK_DATA,
  ATOMKRAFTWERK_DATA,
  KAKTUSFABRIK_DATA,
  Kohlebohrer_DATA,
  URANBOHRER_DATA,
  KAKTUSLAGER_DATA,
  KUEHLMITTELANLAGE_DATA,
  KOHLELAGER_DATA,
  URANLAGER_DATA,
  getLevelValue,
} from './buildingData';
import { getInstancePrice } from './costData';

export type BuildingType =
  | 'Kohlebohrer'
  | 'uranbohrer'
  | 'kuehlmittelanlage'
  | 'kohlekraftwerk'
  | 'atomkraftwerk'
  | 'kaktusfabrik'
  | 'kaktuslager'
  | 'kohlelager'
  | 'uranlager';

export type BuildingStatus = 'An' | 'Aus' | 'Leer';

export interface BuildingState {
  id: number;
  type: BuildingType;
  level: number;
  maxLevel: number;
  status: BuildingStatus;
}

export interface ResourceState {
  kohle: ResourceInfo;
  uran: ResourceInfo;
  kuehlmittel: ResourceInfo;
  energie: ResourceInfo;
}

export interface ResourceInfo {
  production: number;
  consumption: number;
  balance: number;
}

export interface ProductionSnapshot {
  kakteenProSekunde: number;
  kakteenProStunde: number;
  buildings: BuildingState[];
  resources: ResourceState;
  vollesLagerIn: string;
  lagerKapazitaet: number;
  lagerFuellung: number;
  kohleLagerKapazitaet: number;
  uranLagerKapazitaet: number;
}

export function calculateResourceConsumption(buildings: BuildingState[]): ResourceState {
  let kohleProduction = 0;
  let kohleConsumption = 0;
  let uranProduction = 0;
  let uranConsumption = 0;
  let kuehlmittelProduction = 0;
  let kuehlmittelConsumption = 0;
  let energieProduction = 0;
  let energieConsumption = 0;

  buildings.forEach(b => {
    if (b.status !== 'An') return;
    switch (b.type) {
      case 'Kohlebohrer': {
        kohleProduction += getLevelValue(Kohlebohrer_DATA, b.level);
        break;
      }
      case 'uranbohrer': {
        uranProduction += getLevelValue(URANBOHRER_DATA, b.level);
        break;
      }
      case 'kuehlmittelanlage': {
        kuehlmittelProduction += getLevelValue(KUEHLMITTELANLAGE_DATA, b.level);
        break;
      }
      case 'kohlekraftwerk': {
        const [kohle, energie] = getLevelValue(KOHLEKRAFTWERK_DATA, b.level);
        kohleConsumption += kohle;
        energieProduction += energie;
        break;
      }
      case 'atomkraftwerk': {
        const [uran, energie, kuehlmittel] = getLevelValue(ATOMKRAFTWERK_DATA, b.level);
        uranConsumption += uran;
        energieProduction += energie;
        kuehlmittelConsumption += kuehlmittel;
        break;
      }
      case 'kaktusfabrik': {
        const [, energie] = getLevelValue(KAKTUSFABRIK_DATA, b.level);
        energieConsumption += energie;
        break;
      }
      
    }
  });

  return {
    kohle: {
      production: kohleProduction,
      consumption: kohleConsumption,
      balance: kohleProduction - kohleConsumption,
    },
    uran: {
      production: uranProduction,
      consumption: uranConsumption,
      balance: uranProduction - uranConsumption,
    },
    kuehlmittel: {
      production: kuehlmittelProduction,
      consumption: kuehlmittelConsumption,
      balance: kuehlmittelProduction - kuehlmittelConsumption,
    },
    energie: {
      production: energieProduction,
      consumption: energieConsumption,
      balance: energieProduction - energieConsumption,
    },
  };
}

export function calculateKakteenProSekunde(buildings: BuildingState[]): number {
  return buildings
    .filter(b => b.type === 'kaktusfabrik' && b.status === 'An')
    .reduce((sum, b) => sum + getLevelValue(KAKTUSFABRIK_DATA, b.level)[0], 0);
}

export function calculateLagerKapazitaet(buildings: BuildingState[]): number {
  return buildings
    .filter(b => b.type === 'kaktuslager')
    .reduce((sum, b) => sum + getLevelValue(KAKTUSLAGER_DATA, b.level), 0);
}

export function calculateKohleLagerKapazitaet(buildings: BuildingState[]): number {
  return buildings
    .filter(b => b.type === 'kohlelager')
    .reduce((sum, b) => sum + getLevelValue(KOHLELAGER_DATA, b.level), 0);
}

export function calculateUranLagerKapazitaet(buildings: BuildingState[]): number {
  return buildings
    .filter(b => b.type === 'uranlager')
    .reduce((sum, b) => sum + getLevelValue(URANLAGER_DATA, b.level), 0);
}

export function calculateVollesLagerIn(
  kakteenProSekunde: number,
  lagerKapazitaet: number,
  aktuellerBestand: number
): string {
  if (kakteenProSekunde <= 0) return '∞';
  const remaining = lagerKapazitaet - aktuellerBestand;
  if (remaining <= 0) return 'Voll!';
  const seconds = remaining / kakteenProSekunde;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function calculateFullProduction(buildings: BuildingState[]): ProductionSnapshot {
  const resources = calculateResourceConsumption(buildings);
  const kakteenProSekunde = calculateKakteenProSekunde(buildings);
  const lagerKapazitaet = calculateLagerKapazitaet(buildings);
  const kohleLagerKapazitaet = calculateKohleLagerKapazitaet(buildings);
  const uranLagerKapazitaet = calculateUranLagerKapazitaet(buildings);

  return {
    kakteenProSekunde,
    kakteenProStunde: kakteenProSekunde * 3600,
    buildings,
    resources,
    vollesLagerIn: calculateVollesLagerIn(kakteenProSekunde, lagerKapazitaet, 0),
    lagerKapazitaet,
    lagerFuellung: 0,
    kohleLagerKapazitaet,
    uranLagerKapazitaet,
  };
}

export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('de-DE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatLargeNumber(num: number): string {
  if (num === 0) return '0,00';
  if (num < 0) return '-' + formatLargeNumber(-num);

  const suffixes = [
    'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'N', 'D',
    'UD', 'DD', 'TD', 'QaD', 'QiD', 'SxD', 'SpD', 'OcD', 'ND', 'V',
  ];
  
  if (num < 1_000) return formatNumber(num);

  const exp = Math.floor(Math.log10(num));
  const tier = Math.floor(exp / 3) - 1; 

  if (tier >= suffixes.length) {
    
    const mantissa = num / Math.pow(10, exp);
    return `${mantissa.toFixed(2)}e${exp}`;
  }

  const divisor = Math.pow(10, (tier + 1) * 3);
  const value = num / divisor;
  return `${formatNumber(value)}${suffixes[tier]}`;
}

export const ALL_BUILDING_TYPES: BuildingType[] = [
  'Kohlebohrer',
  'uranbohrer',
  'kuehlmittelanlage',
  'kohlekraftwerk',
  'atomkraftwerk',
  'kaktusfabrik',
  'kaktuslager',
  'kohlelager',
  'uranlager',
];

export const BUILDING_LABELS: Record<BuildingType, string> = {
  Kohlebohrer: 'Kohlebohrer',
  uranbohrer: 'Uranbohrer',
  kuehlmittelanlage: 'Kühlmittelanlage',
  kohlekraftwerk: 'Kohlekraftwerk',
  atomkraftwerk: 'Atomkraftwerk',
  kaktusfabrik: 'Kaktusfabrik',
  kaktuslager: 'Kaktuslager',
  kohlelager: 'Kohlelager',
  uranlager: 'Uranlager',
};

export const BUILDING_ICONS: Record<BuildingType, string> = {
  Kohlebohrer: '⛏️',
  uranbohrer: '☢️',
  kuehlmittelanlage: '❄️',
  kohlekraftwerk: '🏭',
  atomkraftwerk: '⚛️',
  kaktusfabrik: '🌵',
  kaktuslager: '📦',
  kohlelager: '🪨',
  uranlager: '🛢️',
};

export const BUILDING_CATEGORY: Record<BuildingType, string> = {
  Kohlebohrer: 'Ressourcen',
  uranbohrer: 'Ressourcen',
  kuehlmittelanlage: 'Ressourcen',
  kohlekraftwerk: 'Energie',
  atomkraftwerk: 'Energie',
  kaktusfabrik: 'Produktion',
  kaktuslager: 'Lager',
  kohlelager: 'Lager',
  uranlager: 'Lager',
};

export const RESOURCE_LABELS = {
  kohle: 'Kohle',
  uran: 'Uran',
  kuehlmittel: 'Kühlmittel',
  energie: 'Energie',
};

export const RESOURCE_ICONS = {
  kohle: '⛏️',
  uran: '☢️',
  kuehlmittel: '❄️',
  energie: '⚡',
};

export const STATUS_LABELS: Record<BuildingStatus, string> = {
  An: 'Aktiv',
  Aus: 'Inaktiv',
  Leer: 'Leer',
};

export function generateConfigSummary(buildings: BuildingState[], snapshot: ProductionSnapshot): string {
  const lines: string[] = [];
  lines.push('=== Aktuelle Gebäude-Konfiguration ===');
  
  const grouped: Record<string, { an: number; aus: number; leer: number; levels: number[] }> = {};
  buildings.forEach(b => {
    if (!grouped[b.type]) grouped[b.type] = { an: 0, aus: 0, leer: 0, levels: [] };
    grouped[b.type].levels.push(b.level);
    if (b.status === 'An') grouped[b.type].an++;
    else if (b.status === 'Aus') grouped[b.type].aus++;
    else grouped[b.type].leer++;
  });

  for (const [type, info] of Object.entries(grouped)) {
    const label = BUILDING_LABELS[type as BuildingType] || type;
    const total = info.an + info.aus + info.leer;
    lines.push(`${label}: ${total}x (Aktiv: ${info.an}, Inaktiv: ${info.aus}, Leer: ${info.leer}) — Level: ${info.levels.join(', ')}`);
  }

  lines.push('');
  lines.push('=== Produktion ===');
  lines.push(`Kakteen/Sek: ${formatNumber(snapshot.kakteenProSekunde)}`);
  lines.push(`Kakteen/Std: ${formatLargeNumber(snapshot.kakteenProStunde)}`);
  lines.push(`Lagerkapazität: ${formatLargeNumber(snapshot.lagerKapazitaet)}`);
  lines.push(`Volles Lager in: ${snapshot.vollesLagerIn}`);

  lines.push('');
  lines.push('=== Ressourcen (pro Sekunde) ===');
  const r = snapshot.resources;
  lines.push(`Kohle: Prod ${formatNumber(r.kohle.production)} | Verb ${formatNumber(r.kohle.consumption)} | Bilanz ${formatNumber(r.kohle.balance)}`);
  lines.push(`Uran: Prod ${formatNumber(r.uran.production)} | Verb ${formatNumber(r.uran.consumption)} | Bilanz ${formatNumber(r.uran.balance)}`);
  lines.push(`Kühlmittel: Prod ${formatNumber(r.kuehlmittel.production)} | Verb ${formatNumber(r.kuehlmittel.consumption)} | Bilanz ${formatNumber(r.kuehlmittel.balance)}`);
  lines.push(`Energie: Prod ${formatNumber(r.energie.production)} | Verb ${formatNumber(r.energie.consumption)} | Bilanz ${formatNumber(r.energie.balance)}`);

  lines.push('');
  lines.push('=== Kosten für nächste Instanz (Taler) ===');
  const typeCounts: Record<string, number> = {};
  buildings.forEach(b => { typeCounts[b.type] = (typeCounts[b.type] || 0) + 1; });
  for (const type of ALL_BUILDING_TYPES) {
    const count = typeCounts[type] || 0;
    const nextPrice = getInstancePrice(type, count + 1);
    const label = BUILDING_LABELS[type] || type;
    lines.push(`${label}: Aktuell ${count}x → Nächste (#${count + 1}) kostet ${formatLargeNumber(nextPrice)} Taler`);
  }

  return lines.join('\n');
}
