import { useMemo } from 'react';
import { ResourceState, BuildingState, RESOURCE_LABELS, RESOURCE_ICONS, formatNumber } from '@/lib/productionEngine';
import type { Booster } from '@/lib/boosterUtils';
import { calculateBoostedResources } from '@/lib/boosterUtils';

interface ResourcePanelProps {
  resources: ResourceState;
  boosters?: Booster[];
  buildings?: BuildingState[];
}

type ResourceKey = keyof ResourceState;

const RESOURCE_COLORS: Record<ResourceKey, string> = {
  kohle: 'bg-coal',
  uran: 'bg-uranium',
  kuehlmittel: 'bg-coolant',
  energie: 'bg-energy',
};

export function ResourcePanel({ resources, boosters = [], buildings = [] }: ResourcePanelProps) {
  const keys: ResourceKey[] = ['kohle', 'uran', 'kuehlmittel', 'energie'];

  const boostedResources = useMemo(() => {
    if (boosters.length === 0 || buildings.length === 0) return null;
    return calculateBoostedResources(buildings, boosters);
  }, [buildings, boosters]);

  return (
    <div className="mc-panel">
      <h2 className="font-title text-xs text-foreground mb-4 pixel-text flex items-center gap-2">
        <span>⛏️</span> Ressourcen / Sek
      </h2>
      <div className="space-y-4">
        {keys.map((key) => {
          const res = resources[key];
          const boosted = boostedResources?.[key];
          const hasBoosted = boosted && (boosted.balance !== res.balance);
          const isPositive = res.balance >= 0;
          const isBoostedPositive = boosted ? boosted.balance >= 0 : isPositive;

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{RESOURCE_ICONS[key]}</span>
                  <span className="text-lg">{RESOURCE_LABELS[key]}</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold pixel-text ${isPositive ? 'text-cactus' : 'text-destructive'}`}>
                    {isPositive ? '+' : ''}{formatNumber(res.balance)}
                  </span>
                  {hasBoosted && (
                    <span className={`text-xs ml-1 font-bold ${isBoostedPositive ? 'text-green-400' : 'text-red-400'}`}>
                      (🚀 {isBoostedPositive ? '+' : ''}{formatNumber(boosted!.balance)})
                    </span>
                  )}
                </div>
              </div>

              <div className="resource-bar">
                <div
                  className={`h-full transition-all duration-300 ${RESOURCE_COLORS[key]}`}
                  style={{
                    width: `${Math.min(100, res.production > 0 ? (res.consumption / res.production) * 100 : 0)}%`,
                    opacity: 0.8,
                  }}
                />
              </div>

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Prod: {formatNumber(res.production)}{hasBoosted && boosted!.production !== res.production ? <span className="text-green-400 text-xs ml-1">({formatNumber(boosted!.production)})</span> : null}</span>
                <span>Verb: {formatNumber(res.consumption)}{hasBoosted && boosted!.consumption !== res.consumption ? <span className="text-orange-400 text-xs ml-1">({formatNumber(boosted!.consumption)})</span> : null}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
