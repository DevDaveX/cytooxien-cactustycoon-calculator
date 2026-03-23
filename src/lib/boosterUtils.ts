import { BuildingState, calculateResourceConsumption, ResourceState } from './productionEngine';
import { KAKTUSFABRIK_DATA, KOHLEKRAFTWERK_DATA, ATOMKRAFTWERK_DATA, Kohlebohrer_DATA, URANBOHRER_DATA, KUEHLMITTELANLAGE_DATA, getLevelValue } from './buildingData';

export interface Booster {
  buildingId: number;
  deviceLabel: string;
  amount: number;
  expiresAt: number;
}

export function calculateBoostedKakteenProSekunde(buildings: BuildingState[], boosters: Booster[]): number {
  let total = 0;
  buildings
    .filter(b => b.type === 'kaktusfabrik' && b.status === 'An')
    .forEach(b => {
      const base = getLevelValue(KAKTUSFABRIK_DATA, b.level)[0];
      const booster = boosters.find(bo => bo.buildingId === b.id);
      total += booster ? base * booster.amount : base;
    });
  return total;
}

export function calculateBoostedResources(buildings: BuildingState[], boosters: Booster[]): ResourceState {
  let kohleProduction = 0, kohleConsumption = 0;
  let uranProduction = 0, uranConsumption = 0;
  let kuehlmittelProduction = 0, kuehlmittelConsumption = 0;
  let energieProduction = 0, energieConsumption = 0;

  buildings.forEach(b => {
    if (b.status !== 'An') return;
    const booster = boosters.find(bo => bo.buildingId === b.id);
    const mult = booster ? booster.amount : 1;

    switch (b.type) {
      case 'Kohlebohrer':
        kohleProduction += getLevelValue(Kohlebohrer_DATA, b.level) * mult;
        break;
      case 'uranbohrer':
        uranProduction += getLevelValue(URANBOHRER_DATA, b.level) * mult;
        break;
      case 'kuehlmittelanlage':
        kuehlmittelProduction += getLevelValue(KUEHLMITTELANLAGE_DATA, b.level) * mult;
        break;
      case 'kohlekraftwerk': {
        const [kohle, energie] = getLevelValue(KOHLEKRAFTWERK_DATA, b.level);
        kohleConsumption += kohle * mult;
        energieProduction += energie * mult;
        break;
      }
      case 'atomkraftwerk': {
        const [uran, energie, kuehlmittel] = getLevelValue(ATOMKRAFTWERK_DATA, b.level);
        uranConsumption += uran * mult;
        energieProduction += energie * mult;
        kuehlmittelConsumption += kuehlmittel * mult;
        break;
      }
      case 'kaktusfabrik': {
        const [, energie] = getLevelValue(KAKTUSFABRIK_DATA, b.level);
        energieConsumption += energie * mult;
        break;
      }
    }
  });

  return {
    kohle: { production: kohleProduction, consumption: kohleConsumption, balance: kohleProduction - kohleConsumption },
    uran: { production: uranProduction, consumption: uranConsumption, balance: uranProduction - uranConsumption },
    kuehlmittel: { production: kuehlmittelProduction, consumption: kuehlmittelConsumption, balance: kuehlmittelProduction - kuehlmittelConsumption },
    energie: { production: energieProduction, consumption: energieConsumption, balance: energieProduction - energieConsumption },
  };
}

export function getBoostMultiplier(buildingId: number, boosters: Booster[]): number {
  const b = boosters.find(bo => bo.buildingId === buildingId);
  return b ? b.amount : 1;
}
