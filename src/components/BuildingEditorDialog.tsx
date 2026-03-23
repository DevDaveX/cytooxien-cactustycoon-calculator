import { useState, useEffect } from 'react';
import {
  BuildingType,
  BuildingStatus,
  BuildingState,
  ALL_BUILDING_TYPES,
  BUILDING_LABELS,
  BUILDING_ICONS,
  BUILDING_CATEGORY,
  STATUS_LABELS,
} from '@/lib/productionEngine';
import { createBuilding } from '@/hooks/useProductionState';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DraftEntry {
  tempId: number;
  type: BuildingType;
  level: number;
  status: BuildingStatus;
  count: number;
}

let draftNextId = 1;

interface BuildingEditorDialogProps {
  open: boolean;
  onClose: () => void;
  currentBuildings: BuildingState[];
  onApply: (buildings: BuildingState[]) => void;
}

export function BuildingEditorDialog({ open, onClose, currentBuildings, onApply }: BuildingEditorDialogProps) {
  const buildInitialDraft = (): DraftEntry[] => {
    const map = new Map<string, DraftEntry>();
    currentBuildings.forEach(b => {
      const key = `${b.type}-${b.level}-${b.status}`;
      if (map.has(key)) {
        map.get(key)!.count++;
      } else {
        map.set(key, { tempId: draftNextId++, type: b.type, level: b.level, status: b.status, count: 1 });
      }
    });
    return Array.from(map.values());
  };

  const [drafts, setDrafts] = useState<DraftEntry[]>([]);

  useEffect(() => {
    if (open) {
      draftNextId = 1;
      setDrafts(buildInitialDraft());
    }
  }, [open, currentBuildings]);

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      onClose();
    }
  };

  const addDraft = (type: BuildingType = 'kaktusfabrik') => {
    setDrafts(prev => [...prev, { tempId: draftNextId++, type, level: 30, status: 'An', count: 1 }]);
  };

  const updateDraft = (tempId: number, patch: Partial<DraftEntry>) => {
    setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, ...patch } : d));
  };

  const removeDraft = (tempId: number) => {
    setDrafts(prev => prev.filter(d => d.tempId !== tempId));
  };

  const handleApply = () => {
    const newBuildings: BuildingState[] = [];
    drafts.forEach(d => {
      const count = Math.max(0, Math.min(d.count, 100));
      for (let i = 0; i < count; i++) {
        newBuildings.push(createBuilding(d.type, Math.max(0, Math.min(d.level, 30)), d.status));
      }
    });
    onApply(newBuildings);
    onClose();
  };

  const totalBuildings = drafts.reduce((s, d) => s + Math.max(0, d.count), 0);

  const categories: Record<string, BuildingType[]> = {};
  ALL_BUILDING_TYPES.forEach(t => {
    const cat = BUILDING_CATEGORY[t];
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(t);
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-2 border-border max-w-3xl max-h-[85vh] flex flex-col !rounded-none shadow-[4px_4px_0_hsl(0_0%_0%/0.5)]">
        <DialogHeader>
          <DialogTitle className="font-title text-xs text-cactus pixel-text">🏗️ Gebäude-Editor</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Lege hier alle Maschinen mit Typ, Level, Anzahl und Status an.
        </p>

        {}
        <div className="space-y-2 pb-2 border-b-2 border-border">
          {Object.entries(categories).map(([cat, types]) => (
            <div key={cat} className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm w-20 font-title text-[7px]">{cat}:</span>
              {types.map(t => (
                <button
                  key={t}
                  onClick={() => addDraft(t)}
                  className="mc-button text-sm !py-1 !px-2"
                >
                  {BUILDING_ICONS[t]} {BUILDING_LABELS[t]}
                </button>
              ))}
            </div>
          ))}
        </div>

        {}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0 pr-1">
          {drafts.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-lg">
              Keine Einträge. Wähle oben einen Gebäudetyp aus.
            </p>
          )}
          {drafts.map((d) => (
            <div key={d.tempId} className="mc-panel !p-2 flex flex-wrap items-center gap-3">
              {}
              <select
                value={d.type}
                onChange={e => updateDraft(d.tempId, { type: e.target.value as BuildingType })}
                className="mc-select text-sm flex-shrink-0"
              >
                {ALL_BUILDING_TYPES.map(t => (
                  <option key={t} value={t}>{BUILDING_ICONS[t]} {BUILDING_LABELS[t]}</option>
                ))}
              </select>

              {}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm text-muted-foreground">Lv.</span>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={d.level}
                  onChange={e => updateDraft(d.tempId, { level: Math.max(0, Math.min(30, parseInt(e.target.value) || 0)) })}
                  className="mc-input w-14 text-center text-sm"
                />
              </div>

              {}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm text-muted-foreground">Anz.</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={d.count}
                  onChange={e => updateDraft(d.tempId, { count: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)) })}
                  className="mc-input w-14 text-center text-sm"
                />
              </div>

              {}
              <select
                value={d.status}
                onChange={e => updateDraft(d.tempId, { status: e.target.value as BuildingStatus })}
                className="mc-select text-sm flex-shrink-0"
              >
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              {}
              <button
                onClick={() => removeDraft(d.tempId)}
                className="ml-auto mc-button mc-button-danger !py-0.5 !px-2 text-sm flex-shrink-0"
                title="Entfernen"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {}
        <div className="flex items-center justify-between pt-3 border-t-2 border-border">
          <span className="text-muted-foreground text-sm">{totalBuildings} Gebäude total</span>
          <button onClick={handleApply} className="mc-button mc-button-primary text-sm">
            ✓ Übernehmen
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
