import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductionState, exportConfig, importConfig } from '@/hooks/useProductionState';
import { ProductionOverview } from '@/components/ProductionOverview';
import { ResourcePanel } from '@/components/ResourcePanel';
import { ProductionTable } from '@/components/ProductionTable';
import { ConfigShareDialog } from '@/components/ConfigShareDialog';
import { BuildingEditorDialog } from '@/components/BuildingEditorDialog';
import { ChatPanel } from '@/components/ChatPanel';
import { BuildingCostPanel } from '@/components/BuildingCostPanel';
import { WikiLayout } from '@/components/WikiLayout';
import { useToast } from '@/hooks/use-toast';
import { BuildingType, ALL_BUILDING_TYPES, BUILDING_LABELS, BUILDING_ICONS, BUILDING_CATEGORY } from '@/lib/productionEngine';

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

const COOKIE_CONSENT_KEY = 'ct_cookie_consent';
const COOKIE_CONFIG_KEY = 'ct_building_config';
const COOKIE_BOOSTER_KEY = 'boosters';

import type { Booster } from '@/lib/boosterUtils';

const Index = () => {
  const { buildings, snapshot, setAllBuildings, resetToDefault } = useProductionState();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<boolean | null>(null);
  const [showCookieModal, setShowCookieModal] = useState(false);
  
  const [boosters, setBoosters] = useState<Booster[]>(() => {
    const saved = localStorage.getItem(COOKIE_BOOSTER_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [showBoosterModal, setShowBoosterModal] = useState(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [amount, setAmount] = useState(1);
  const [duration, setDuration] = useState(30);
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours">("minutes");

  const { toast } = useToast();

  const availableBuildings = useMemo(() => {
    return buildings.filter(b => b.status === 'An');
  }, [buildings]);

  useEffect(() => {
    if (showBoosterModal && availableBuildings.length > 0) {
      if (selectedBuildingId === null || !availableBuildings.find(b => b.id === selectedBuildingId)) {
        setSelectedBuildingId(availableBuildings[0].id);
      }
    }
  }, [showBoosterModal, availableBuildings, selectedBuildingId]);

  const saveBoosters = (current: Booster[]) => {
    localStorage.setItem(COOKIE_BOOSTER_KEY, JSON.stringify(current));
    if (cookieConsent) setCookie(COOKIE_BOOSTER_KEY, JSON.stringify(current));
  };

  const removeBooster = (buildingId: number) => {
    setBoosters(prev => {
      const updated = prev.filter(b => b.buildingId !== buildingId);
      saveBoosters(updated);
      return updated;
    });
    toast({ title: "🗑️ Deaktiviert", description: "Booster wurde entfernt." });
  };

  const handleAddBooster = () => {
    if (selectedBuildingId === null) return;
    const targetBuilding = buildings.find(b => b.id === selectedBuildingId);
    if (!targetBuilding) return;

    const durationMinutes = durationUnit === "hours" ? duration * 60 : duration;
    const expiresAt = Date.now() + durationMinutes * 60 * 1000;
    
    const newBooster: Booster = { 
      buildingId: targetBuilding.id, 
      deviceLabel: `${BUILDING_LABELS[targetBuilding.type]} (Lvl ${targetBuilding.level})`,
      amount, 
      expiresAt 
    };
    
    setBoosters(prev => {
      const filtered = prev.filter(b => b.buildingId !== selectedBuildingId);
      const updated = [...filtered, newBooster];
      saveBoosters(updated);
      return updated;
    });

    toast({ title: "🚀 Booster aktiviert", description: `${newBooster.deviceLabel} wird nun geboostet.` });
    setShowBoosterModal(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setBoosters(prev => {
        const active = prev.filter(b => b.expiresAt > now);
        if (active.length !== prev.length) {
          localStorage.setItem(COOKIE_BOOSTER_KEY, JSON.stringify(active));
          return active;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const configParam = searchParams.get('config');
    if (configParam) {
      const imported = importConfig(configParam);
      if (imported && imported.length > 0) setAllBuildings(imported);
      setSearchParams({}, { replace: true });
    }
    const consent = getCookie(COOKIE_CONSENT_KEY);
    if (consent === 'true') setCookieConsent(true);
    else if (consent === null) setShowCookieModal(true);
    
    const savedBoosters = getCookie(COOKIE_BOOSTER_KEY);
    if (savedBoosters && consent === 'true') {
      try { setBoosters(JSON.parse(savedBoosters)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (cookieConsent && buildings.length > 0) {
      setCookie(COOKIE_CONFIG_KEY, exportConfig(buildings));
    }
  }, [buildings, cookieConsent]);

  const handleAcceptCookies = () => {
    setCookieConsent(true);
    setCookie(COOKIE_CONSENT_KEY, 'true');
    setShowCookieModal(false);
    if (buildings.length > 0) setCookie(COOKIE_CONFIG_KEY, exportConfig(buildings));
    if (boosters.length > 0) saveBoosters(boosters);
  };

  const handleDeclineCookies = () => {
    setCookieConsent(false);
    setCookie(COOKIE_CONSENT_KEY, 'false');
    setShowCookieModal(false);
  };

  const handleReset = () => {
    resetToDefault();
    if (cookieConsent) deleteCookie(COOKIE_CONFIG_KEY);
  };

  const formatRemaining = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return "0s";
    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${min}m ${sec}s`;
  };

  const grouped = useMemo(() => {
    const map: Record<string, { total: number; active: number; levels: Record<number, number> }> = {};
    buildings.forEach(b => {
      if (!map[b.type]) map[b.type] = { total: 0, active: 0, levels: {} };
      const g = map[b.type];
      g.total++;
      if (b.status === 'An') g.active++;
      g.levels[b.level] = (g.levels[b.level] || 0) + 1;
    });
    return map;
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

  return (
    <WikiLayout>
      <div className="px-4 py-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌵</span>
            <div>
              <h1 className="font-title text-sm text-cactus pixel-text">Kaktus Cytooxien Rechner</h1>
              <p className="text-muted-foreground text-sm mt-1">Produktions-Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setShowBoosterModal(true)} className="mc-button text-sm !bg-orange-600">🚀 Booster</button>
            <button onClick={() => setShowShareDialog(true)} className="mc-button text-sm">📤 Code</button>
            <button onClick={handleReset} className="mc-button text-sm">↻ Reset</button>
          </div>
        </div>

        <ProductionOverview snapshot={snapshot} boosters={boosters} buildings={buildings} />

        {boosters.length > 0 && (
          <div className="mc-panel p-4 border-l-4 border-orange-500 bg-orange-500/10 shadow-lg">
            <h3 className="font-title text-[10px] mb-3 uppercase tracking-widest text-orange-400 text-left font-bold">🔥 Aktive Booster</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {boosters.map((b, i) => (
                <div key={i} className="flex justify-between items-center bg-black/40 p-3 rounded border border-white/5 group">
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-[11px] uppercase tracking-tighter">{b.amount}× {b.deviceLabel}</span>
                    <span className="text-[10px] text-cactus font-mono">{formatRemaining(b.expiresAt)}</span>
                  </div>
                  <button 
                    onClick={() => removeBooster(b.buildingId)}
                    className="h-7 w-7 flex items-center justify-center rounded bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white transition-all border border-red-500/30 shadow-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mc-panel text-left">
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h2 className="font-title text-xs text-foreground pixel-text flex items-center gap-2">
              <span>🏗️</span> Gebäude ({buildings.length})
            </h2>
            <button onClick={() => setShowEditorDialog(true)} className="mc-button mc-button-primary text-sm shadow-md">✏️ Bearbeiten</button>
          </div>
          <div className="space-y-4">
            {Object.entries(categories).map(([cat, types]) => {
              const hasAny = types.some(t => grouped[t]?.total > 0);
              if (!hasAny) return null;
              return (
                <div key={cat} className="space-y-2">
                  <h3 className="text-muted-foreground text-[8px] font-title uppercase tracking-[0.2em] opacity-50">{cat}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {types.map(type => {
                      const g = grouped[type];
                      if (!g || g.total === 0) return null;
                      const levelEntries = Object.entries(g.levels).sort(([a],[b]) => Number(b)-Number(a));
                      const buildingsOfType = buildings.filter(bl => bl.type === type);
                      const boostersForType = boosters.filter(bo => buildingsOfType.some(bl => bl.id === bo.buildingId));
                      return (
                        <div key={type} className="mc-panel !p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl drop-shadow-sm">{BUILDING_ICONS[type]}</span>
                            <div>
                              <h4 className="font-bold text-[11px] pixel-text leading-none mb-1 uppercase">{BUILDING_LABELS[type]}</h4>
                              <span className="text-[10px] text-cactus bg-cactus/10 px-1 rounded">{g.active}/{g.total} aktiv</span>
                            </div>
                          </div>
                          <div className="space-y-0.5 border-t border-white/5 pt-1 mt-1">
                            {levelEntries.map(([level, count]) => (
                              <div key={level} className="flex items-center justify-between text-[10px]">
                                <span className="font-sans opacity-70">Level {level}</span>
                                <span className="font-bold font-mono">{count}×</span>
                              </div>
                            ))}
                          </div>
                          {boostersForType.length > 0 && (
                            <div className="mt-2 pt-1 border-t border-orange-500/20 space-y-1">
                              {boostersForType.map((bo, i) => (
                                <div key={i} className="flex items-center justify-between text-[10px]">
                                  <span className="text-orange-400 font-bold">🚀 {bo.amount}× Boost</span>
                                  <span className="text-cactus font-mono">{formatRemaining(bo.expiresAt)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ProductionTable buildings={buildings} boosters={boosters} />
          </div>
          <div>
            <ResourcePanel resources={snapshot.resources} boosters={boosters} buildings={buildings} />
          </div>
        </div>

        <BuildingCostPanel buildings={buildings} />
      </div>

      {showBoosterModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[200] backdrop-blur-md p-4 text-left">
          <div className="mc-panel max-w-md w-full p-6 space-y-6 shadow-2xl border-2 border-orange-500 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-title text-center text-orange-400 uppercase tracking-widest font-bold">🚀 Booster zünden</h2>
            
            {availableBuildings.length === 0 ? (
              <div className="p-6 bg-red-500/10 border border-red-500/30 rounded text-center space-y-4 shadow-inner">
                <p className="text-sm text-red-400 font-bold uppercase">⚠️ Keine aktiven Maschinen gefunden!</p>
                <button onClick={() => setShowBoosterModal(false)} className="mc-button w-full !bg-red-900/50 hover:!bg-red-800">Schließen</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest opacity-70">Maschine auswählen</label>
                  <select 
                    value={selectedBuildingId ?? ''} 
                    onChange={e => setSelectedBuildingId(Number(e.target.value))} 
                    className="w-full bg-black/60 border border-white/20 p-3 rounded outline-none text-sm text-white focus:border-orange-500 transition-all cursor-pointer shadow-inner appearance-none"
                  >
                    {availableBuildings.map(b => (
                      <option key={b.id} value={b.id} className="bg-zinc-900">
                        {BUILDING_LABELS[b.type]} (Lvl {b.level})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest opacity-70">Menge (×)</label>
                    <input type="number" min={1} value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full bg-black/60 border border-white/20 p-2 rounded text-sm text-white outline-none focus:border-orange-500 transition-all shadow-inner"/>
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest opacity-70">Dauer</label>
                    <div className="flex gap-1">
                      <input type="number" min={1} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-[60%] bg-black/60 border border-white/20 p-2 rounded text-sm text-center text-white outline-none focus:border-orange-500 transition-all shadow-inner"/>
                      <select value={durationUnit} onChange={e => setDurationUnit(e.target.value as any)} className="w-[40%] bg-black/60 border border-white/20 p-2 rounded text-[10px] outline-none text-white focus:border-orange-500">
                        <option value="minutes">Min.</option>
                        <option value="hours">Std.</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3 mt-2">
                  <button onClick={handleAddBooster} className="mc-button mc-button-primary w-full shadow-lg !py-3 font-bold uppercase tracking-widest">✅ Aktivieren</button>
                  <button onClick={() => setShowBoosterModal(false)} className="text-xs text-muted-foreground hover:text-white transition-colors text-center w-full uppercase tracking-widest opacity-50 hover:opacity-100 py-1">Abbrechen</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showCookieModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] backdrop-blur-md">
          <div className="mc-panel max-w-md p-6 space-y-4 text-center border-2 border-cactus shadow-2xl animate-in zoom-in-95">
            <h2 className="text-lg font-bold pixel-text text-cactus">🍪 Speichern?</h2>
            <div className="flex justify-center gap-3 mt-4">
              <button onClick={handleAcceptCookies} className="mc-button mc-button-primary px-6">✅ Ja</button>
              <button onClick={handleDeclineCookies} className="mc-button px-6">❌ Nein</button>
            </div>
          </div>
        </div>
      )}

      <ConfigShareDialog open={showShareDialog} onClose={() => setShowShareDialog(false)} buildings={buildings} onImport={setAllBuildings} />
      <BuildingEditorDialog open={showEditorDialog} onClose={() => setShowEditorDialog(false)} currentBuildings={buildings} onApply={setAllBuildings} />
      <ChatPanel buildings={buildings} snapshot={snapshot} />
    </WikiLayout>
  );
};

export default Index;
