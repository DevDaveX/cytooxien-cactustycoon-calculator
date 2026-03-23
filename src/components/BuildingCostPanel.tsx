import { useState, useMemo } from 'react';
import {
  BuildingType,
  BuildingState,
  ALL_BUILDING_TYPES,
  BUILDING_LABELS,
  BUILDING_ICONS,
  BUILDING_CATEGORY,
  formatLargeNumber,
} from '@/lib/productionEngine';
import {
  getInstancePrice,
  getTotalInstanceCost,
  getUpgradeCost,
  getTotalRubies,
  getTotalUpgradeTime,
  formatUpgradeTime,
} from '@/lib/costData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface BuildingCostPanelProps {
  buildings: BuildingState[];
}

function calculateFactoryValue(buildings: BuildingState[]) {
  
  const typeCounts: Partial<Record<BuildingType, number>> = {};
  buildings.forEach(b => {
    typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
  });

  let totalKakteen = 0;
  let totalRubies = 0;
  let totalUpgradeSeconds = 0;

  for (const [type, count] of Object.entries(typeCounts)) {
    totalKakteen += getTotalInstanceCost(type as BuildingType, count!);
  }

  buildings.forEach(b => {
    totalRubies += getTotalRubies(b.level);
    totalUpgradeSeconds += getTotalUpgradeTime(b.level);
  });

  return { totalKakteen, totalRubies, totalUpgradeSeconds };
}

export function BuildingCostPanel({ buildings }: BuildingCostPanelProps) {
  const [selectedType, setSelectedType] = useState<BuildingType | null>(null);

  const buildingCounts = useMemo(() => {
    const counts: Partial<Record<BuildingType, number>> = {};
    buildings.forEach(b => {
      counts[b.type] = (counts[b.type] || 0) + 1;
    });
    return counts;
  }, [buildings]);

  const categories = useMemo(() => {
    const cats: Record<string, BuildingType[]> = {};
    ALL_BUILDING_TYPES.forEach(t => {
      const cat = BUILDING_CATEGORY[t];
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push(t);
    });
    return cats;
  }, []);

  const factoryValue = useMemo(() => calculateFactoryValue(buildings), [buildings]);

  const selectedCount = selectedType ? (buildingCounts[selectedType] || 0) : 0;
  const nextInstancePrice = selectedType ? getInstancePrice(selectedType, selectedCount + 1) : 0;
  const totalSpent = selectedType ? getTotalInstanceCost(selectedType, selectedCount) : 0;

  const typeValues = useMemo(() => {
    const map: Record<string, { kakteen: number; rubies: number; count: number }> = {};
    const typeCounts: Partial<Record<BuildingType, number>> = {};
    
    buildings.forEach(b => {
      typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
    });

    buildings.forEach(b => {
      if (!map[b.type]) {
        map[b.type] = { kakteen: getTotalInstanceCost(b.type, typeCounts[b.type] || 0), rubies: 0, count: typeCounts[b.type] || 0 };
      }
      map[b.type].rubies += getTotalRubies(b.level);
    });
    return map;
  }, [buildings]);

  return (
    <>
      {}
      {buildings.length > 0 && (
        <div className="mc-panel text-left">
          <h2 className="font-title text-sm text-foreground pixel-text flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
            <span>🏭</span> Fabrik-Wert
          </h2>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded p-4 text-center">
              <div className="text-xs uppercase tracking-widest text-yellow-500/70 font-bold mb-1">Gesamtwert (Kakteen)</div>
              <div className="text-xl font-mono font-bold text-yellow-400 leading-tight">
                {formatLargeNumber(factoryValue.totalKakteen)} 🌵
              </div>
            </div>
            <div className="bg-purple-500/5 border border-purple-500/20 rounded p-4 text-center">
              <div className="text-xs uppercase tracking-widest text-purple-400/70 font-bold mb-1">Rubinenwert</div>
              <div className="text-xl font-mono font-bold text-purple-400 leading-tight">
                {factoryValue.totalRubies.toLocaleString('de-DE')} 💎
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded p-4 text-center">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-1">Upgrade-Zeit gesamt</div>
              <div className="text-xl font-mono font-bold text-foreground leading-tight">
                {formatUpgradeTime(factoryValue.totalUpgradeSeconds)} ⏱️
              </div>
            </div>
          </div>

          {}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground text-left">
                  <th className="py-2 px-3 font-bold uppercase tracking-widest text-xs">Maschine</th>
                  <th className="py-2 px-3 text-center font-bold uppercase tracking-widest text-xs">Anzahl</th>
                  <th className="py-2 px-3 text-right font-bold uppercase tracking-widest text-xs">Kaufkosten</th>
                  <th className="py-2 px-3 text-right font-bold uppercase tracking-widest text-xs">Rubine</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(typeValues)
                  .sort(([,a], [,b]) => b.kakteen - a.kakteen)
                  .map(([type, val]) => (
                    <tr key={type} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3">
                        <span className="mr-2">{BUILDING_ICONS[type as BuildingType]}</span>
                        <span className="font-bold">{BUILDING_LABELS[type as BuildingType]}</span>
                      </td>
                      <td className="py-2 px-3 text-center font-mono">{val.count}×</td>
                      <td className="py-2 px-3 text-right font-mono text-yellow-400">{formatLargeNumber(val.kakteen)}</td>
                      <td className="py-2 px-3 text-right font-mono text-purple-400">{val.rubies}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/20 font-bold">
                  <td className="py-2 px-3 uppercase text-xs tracking-widest">Gesamt</td>
                  <td className="py-2 px-3 text-center font-mono">{buildings.length}×</td>
                  <td className="py-2 px-3 text-right font-mono text-yellow-400">{formatLargeNumber(factoryValue.totalKakteen)}</td>
                  <td className="py-2 px-3 text-right font-mono text-purple-400">{factoryValue.totalRubies}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {}
      <div className="mc-panel text-left">
        <h2 className="font-title text-sm text-foreground pixel-text flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
          <span>💰</span> Maschinenkosten
        </h2>

        <div className="space-y-5">
          {Object.entries(categories).map(([cat, types]) => (
            <div key={cat} className="space-y-2">
              <h3 className="text-muted-foreground text-xs font-title uppercase tracking-[0.15em] opacity-60 border-b border-white/5 pb-1">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {types.map(type => {
                  const count = buildingCounts[type] || 0;
                  const nextPrice = getInstancePrice(type, count + 1);
                  const invested = getTotalInstanceCost(type, count);
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className="mc-panel !p-4 text-left hover:border-yellow-500/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{BUILDING_ICONS[type]}</span>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm uppercase tracking-tight leading-none mb-1">{BUILDING_LABELS[type]}</h4>
                          <span className="text-xs text-muted-foreground">{count}× vorhanden</span>
                        </div>
                      </div>
                      <div className="space-y-1.5 border-t border-white/5 pt-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="opacity-50">Investiert:</span>
                          <span className="font-mono text-foreground">
                            {invested === 0 ? '—' : `${formatLargeNumber(invested)} 🌵`}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="opacity-50">Nächste:</span>
                          <span className="font-mono font-bold text-yellow-400">
                            {nextPrice === 0 ? 'Kostenlos' : `${formatLargeNumber(nextPrice)} 🌵`}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {}
      <Dialog open={selectedType !== null} onOpenChange={(v) => { if (!v) setSelectedType(null); }}>
        <DialogContent className="bg-card border-2 border-border max-w-2xl max-h-[85vh] flex flex-col !rounded-none shadow-[4px_4px_0_hsl(0_0%_0%/0.5)]">
          {selectedType && (
            <>
              <DialogHeader>
                <DialogTitle className="font-title text-sm text-cactus pixel-text flex items-center gap-2">
                  {BUILDING_ICONS[selectedType]} {BUILDING_LABELS[selectedType]} — Kosten
                </DialogTitle>
              </DialogHeader>

              {}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-cactus/10 border border-cactus/20 rounded p-3">
                  <div className="text-xs uppercase tracking-widest text-cactus/60 mb-1">Besitz</div>
                  <div className="font-mono font-bold text-lg text-cactus">{selectedCount}×</div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <div className="text-xs uppercase tracking-widest text-yellow-500/60 mb-1">Investiert</div>
                  <div className="font-mono font-bold text-lg text-yellow-400">{formatLargeNumber(totalSpent)}</div>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-500/10 rounded p-3">
                  <div className="text-xs uppercase tracking-widest text-yellow-500/40 mb-1">Nächste</div>
                  <div className="font-mono font-bold text-lg text-yellow-300">
                    {nextInstancePrice === 0 ? 'Frei' : formatLargeNumber(nextInstancePrice)}
                  </div>
                </div>
              </div>

              {}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Kaufpreise pro Exemplar
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const price = getInstancePrice(selectedType, i + 1);
                    const isOwned = i < selectedCount;
                    const isNext = i === selectedCount;
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded border text-center text-xs transition-all ${
                          isOwned
                            ? 'bg-cactus/10 border-cactus/30'
                            : isNext
                            ? 'bg-yellow-500/10 border-yellow-500/50 ring-1 ring-yellow-500/30 shadow-md'
                            : 'bg-black/20 border-white/5 opacity-50'
                        }`}
                      >
                        <div className="font-bold text-xs mb-1 opacity-60">#{i + 1}</div>
                        <div className={`font-mono font-bold ${isOwned ? 'text-cactus' : isNext ? 'text-yellow-400' : ''}`}>
                          {price === 0 ? 'Frei' : formatLargeNumber(price)}
                        </div>
                        {isOwned && <div className="text-cactus text-xs mt-0.5">✓</div>}
                      </div>
                    );
                  })}
                </div>
              </div>

              {}
              <div className="space-y-2 flex-1 min-h-0">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Stufen-Upgrades
                </h3>
                <div className="overflow-y-auto max-h-[35vh] pr-1">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-card z-10">
                      <tr className="border-b border-white/10 text-muted-foreground">
                        <th className="text-left py-1.5 px-2 text-xs uppercase tracking-widest">Lv</th>
                        <th className="text-right py-1.5 px-2 text-xs uppercase tracking-widest">Dauer</th>
                        <th className="text-right py-1.5 px-2 text-xs uppercase tracking-widest">💎</th>
                        <th className="text-right py-1.5 px-2 text-xs uppercase tracking-widest">Σ 💎</th>
                        <th className="text-right py-1.5 px-2 text-xs uppercase tracking-widest">Σ Zeit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 30 }, (_, i) => {
                        const level = i + 1;
                        const { timeSeconds, rubies } = getUpgradeCost(level);
                        const totalRub = getTotalRubies(level);
                        const totalTime = getTotalUpgradeTime(level);
                        const isMax = level === 30;
                        return (
                          <tr key={level} className={`border-b border-white/5 ${isMax ? 'text-cactus font-bold bg-cactus/5' : 'hover:bg-white/5'}`}>
                            <td className="py-1.5 px-2 font-mono font-bold">{level}</td>
                            <td className="py-1.5 px-2 text-right font-mono">{formatUpgradeTime(timeSeconds)}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-purple-400">{rubies}</td>
                            <td className="py-1.5 px-2 text-right font-mono text-purple-300">{totalRub}</td>
                            <td className="py-1.5 px-2 text-right font-mono opacity-60">{formatUpgradeTime(totalTime)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-6 text-xs text-muted-foreground pt-2 border-t border-white/10">
                  <span>Bis Lv30: <strong className="text-purple-400">{getTotalRubies(30)} 💎</strong></span>
                  <span>Gesamtzeit: <strong className="text-foreground">{formatUpgradeTime(getTotalUpgradeTime(30))}</strong></span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
