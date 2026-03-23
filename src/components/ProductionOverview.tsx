import { useMemo } from 'react';
import { formatNumber, formatLargeNumber, ProductionSnapshot, BuildingState, BUILDING_LABELS } from '@/lib/productionEngine';
import type { Booster } from '@/lib/boosterUtils';
import { calculateBoostedKakteenProSekunde } from '@/lib/boosterUtils';

interface ProductionOverviewProps {
  snapshot: ProductionSnapshot;
  boosters?: Booster[];
  buildings?: BuildingState[];
}

export function ProductionOverview({ snapshot, boosters = [], buildings = [] }: ProductionOverviewProps) {
  const boostedKakteen = useMemo(() => {
    if (boosters.length === 0 || buildings.length === 0) return null;
    return calculateBoostedKakteenProSekunde(buildings, boosters);
  }, [buildings, boosters]);

  const hasBoostedKakteen = boostedKakteen !== null && boostedKakteen !== snapshot.kakteenProSekunde;

  const stats = [
    {
      label: 'Kakteen / Sek',
      value: formatNumber(snapshot.kakteenProSekunde),
      boostedValue: hasBoostedKakteen ? formatNumber(boostedKakteen!) : null,
      icon: '🌵',
      color: 'text-cactus',
    },
    {
      label: 'Kakteen / Std',
      value: formatLargeNumber(snapshot.kakteenProStunde),
      boostedValue: hasBoostedKakteen ? formatLargeNumber(boostedKakteen! * 3600) : null,
      icon: '📊',
      color: 'text-cactus',
    },
    {
      label: 'Lagerkapazität',
      value: formatLargeNumber(snapshot.lagerKapazitaet),
      boostedValue: null,
      icon: '📦',
      color: 'text-accent',
    },
    {
      label: 'Volles Lager',
      value: snapshot.vollesLagerIn,
      boostedValue: null,
      icon: '⏱️',
      color: 'text-info',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="mc-panel glow-green">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{stat.icon}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
          <div className={`stat-value ${stat.color}`}>
            {stat.value}
            {stat.boostedValue && (
              <span className="text-green-400 text-xs ml-1">
                (🚀 {stat.boostedValue})
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
