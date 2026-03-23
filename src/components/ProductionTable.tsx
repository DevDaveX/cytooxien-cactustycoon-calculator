import { useMemo } from 'react';
import {
  BuildingState,
  ALL_BUILDING_TYPES,
  calculateResourceConsumption,
  calculateKakteenProSekunde,
  formatNumber,
  formatLargeNumber,
  BUILDING_LABELS,
  BUILDING_ICONS,
} from '@/lib/productionEngine';
import type { Booster } from '@/lib/boosterUtils';
import { calculateBoostedKakteenProSekunde, calculateBoostedResources } from '@/lib/boosterUtils';

interface ProductionTableProps {
  buildings: BuildingState[];
  boosters?: Booster[];
}

export function ProductionTable({ buildings, boosters = [] }: ProductionTableProps) {
  const volllastBuildings = buildings.map(b => ({ ...b, status: 'An' as const }));
  const volllastResources = calculateResourceConsumption(volllastBuildings);
  const volllastKakteen = calculateKakteenProSekunde(volllastBuildings);

  const currentResources = calculateResourceConsumption(buildings);
  const currentKakteen = calculateKakteenProSekunde(buildings);

  const boostedKakteen = useMemo(() => {
    if (boosters.length === 0) return null;
    return calculateBoostedKakteenProSekunde(buildings, boosters);
  }, [buildings, boosters]);

  const boostedResources = useMemo(() => {
    if (boosters.length === 0) return null;
    return calculateBoostedResources(buildings, boosters);
  }, [buildings, boosters]);

  const hasBoostedKakteen = boostedKakteen !== null && boostedKakteen !== currentKakteen;

  return (
    <div className="mc-panel overflow-x-auto">
      <h2 className="font-title text-xs text-foreground mb-4 pixel-text flex items-center gap-2">
        <span>📋</span> Produktionsvergleich
      </h2>

      <table className="w-full text-lg">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-2 text-muted-foreground">Metrik</th>
            <th className="text-right py-2 text-muted-foreground">Aktuell</th>
            <th className="text-right py-2 text-muted-foreground">Volllast</th>
            <th className="text-right py-2 text-muted-foreground">Diff</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-2">🌵 Kakteen/Sek</td>
            <td className="text-right text-cactus">
              {formatNumber(currentKakteen)}
              {hasBoostedKakteen && (
                <span className="text-green-400 text-xs ml-1">({formatNumber(boostedKakteen!)})</span>
              )}
            </td>
            <td className="text-right text-muted-foreground">{formatNumber(volllastKakteen)}</td>
            <td className={`text-right ${volllastKakteen - currentKakteen >= 0 ? 'text-cactus' : 'text-destructive'}`}>
              {formatNumber(volllastKakteen - currentKakteen)}
            </td>
          </tr>
          <tr className="border-b border-border">
            <td className="py-2">🌵 Kakteen/Std</td>
            <td className="text-right text-cactus">
              {formatLargeNumber(currentKakteen * 3600)}
              {hasBoostedKakteen && (
                <span className="text-green-400 text-xs ml-1">({formatLargeNumber(boostedKakteen! * 3600)})</span>
              )}
            </td>
            <td className="text-right text-muted-foreground">{formatLargeNumber(volllastKakteen * 3600)}</td>
            <td className={`text-right ${volllastKakteen >= currentKakteen ? 'text-cactus' : 'text-destructive'}`}>
              {formatLargeNumber((volllastKakteen - currentKakteen) * 3600)}
            </td>
          </tr>
          {([
            ['⛏️', 'Kohle/Sek', 'kohle'],
            ['☢️', 'Uran/Sek', 'uran'],
            ['❄️', 'Kühlmittel/Sek', 'kuehlmittel'],
            ['⚡', 'Energie/Sek', 'energie'],
          ] as const).map(([icon, label, key]) => {
            const boosted = boostedResources?.[key];
            const hasBoosted = boosted && boosted.balance !== currentResources[key].balance;
            return (
              <tr key={key} className="border-b border-border">
                <td className="py-2">{icon} {label}</td>
                <td className={`text-right ${currentResources[key].balance >= 0 ? 'text-cactus' : 'text-destructive'}`}>
                  {formatNumber(currentResources[key].balance)}
                  {hasBoosted && (
                    <span className={`text-xs ml-1 ${boosted!.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ({boosted!.balance >= 0 ? '+' : ''}{formatNumber(boosted!.balance)})
                    </span>
                  )}
                </td>
                <td className={`text-right ${volllastResources[key].balance >= 0 ? 'text-cactus' : 'text-destructive'}`}>
                  {formatNumber(volllastResources[key].balance)}
                </td>
                <td className="text-right text-muted-foreground">—</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 pt-4 border-t-2 border-border">
        <h3 className="text-muted-foreground mb-2 font-title text-[8px]">Gebäude-Zusammenfassung</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {ALL_BUILDING_TYPES.map(type => {
            const ofType = buildings.filter(b => b.type === type);
            if (ofType.length === 0) return null;
            const active = ofType.filter(b => b.status === 'An').length;
            return (
              <div key={type} className="flex items-center gap-1.5 text-sm min-w-0">
                <span className="shrink-0 w-5 text-center">{BUILDING_ICONS[type]}</span>
                <span className="text-muted-foreground truncate">{BUILDING_LABELS[type]}</span>
                <span className="ml-auto font-bold text-foreground">
                  {active}/{ofType.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
