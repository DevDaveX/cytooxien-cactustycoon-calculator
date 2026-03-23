import { useState, useCallback, useMemo } from 'react';
import {
  BuildingState,
  BuildingType,
  BuildingStatus,
  calculateFullProduction,
} from '@/lib/productionEngine';

let nextId = 1;

export function createBuilding(type: BuildingType, level = 30, status: BuildingStatus = 'An'): BuildingState {
  return { id: nextId++, type, level, maxLevel: 30, status };
}

function getDefaultBuildings(): BuildingState[] {
  return [];
}

const TYPE_CODES: Record<BuildingType, string> = {
  Kohlebohrer: 'km',
  uranbohrer: 'ub',
  kuehlmittelanlage: 'ka',
  kohlekraftwerk: 'kw',
  atomkraftwerk: 'ak',
  kaktusfabrik: 'kf',
  kaktuslager: 'kl',
  kohlelager: 'cl',
  uranlager: 'ul',
};

const CODE_TO_TYPE: Record<string, BuildingType> = Object.fromEntries(
  Object.entries(TYPE_CODES).map(([k, v]) => [v, k as BuildingType])
) as Record<string, BuildingType>;

const STATUS_CODE: Record<BuildingStatus, string> = { An: '1', Aus: '0', Leer: '2' };
const CODE_STATUS: Record<string, BuildingStatus> = { '1': 'An', '0': 'Aus', '2': 'Leer' };

function levelToChar(l: number): string { return l.toString(36); }
function charToLevel(c: string): number { return parseInt(c, 36); }

export function exportConfig(buildings: BuildingState[]): string {
  return buildings
    .map(b => `${TYPE_CODES[b.type]}${levelToChar(b.level)}${STATUS_CODE[b.status] ?? '1'}`)
    .join('');
}

export function importConfig(code: string): BuildingState[] | null {
  try {
    const trimmed = code.trim();

    if (/^([a-z]{2}[0-9a-u][012])+$/.test(trimmed) && trimmed.length % 4 === 0) {
      const results: BuildingState[] = [];
      for (let i = 0; i < trimmed.length; i += 4) {
        const tc = trimmed.slice(i, i + 2);
        const lvl = charToLevel(trimmed[i + 2]);
        const st = trimmed[i + 3];
        if (!CODE_TO_TYPE[tc] || lvl < 0 || lvl > 30) continue;
        results.push(createBuilding(CODE_TO_TYPE[tc], lvl, CODE_STATUS[st] ?? 'An'));
      }
      return results.length > 0 ? results : null;
    }

    if (/^[a-z]{2}\.\d+\.[012](-[a-z]{2}\.\d+\.[012])*$/.test(trimmed)) {
      return trimmed.split('-').map(seg => {
        const [tc, lvl, st] = seg.split('.');
        if (!CODE_TO_TYPE[tc]) return null;
        return createBuilding(CODE_TO_TYPE[tc], Math.max(0, Math.min(30, Number(lvl))), CODE_STATUS[st] ?? 'An');
      }).filter(Boolean) as BuildingState[];
    }

    const json = decodeURIComponent(atob(trimmed));
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return null;
    const validStatuses: BuildingStatus[] = ['An', 'Aus', 'Leer'];
    return data
      .filter((d: any) => d.t2 && CODE_TO_TYPE[d.t2] && typeof d.l === 'number' && d.l >= 0 && d.l <= 30)
      .map((d: any) => createBuilding(CODE_TO_TYPE[d.t2], Math.max(0, Math.min(30, d.l)), validStatuses.includes(d.s) ? d.s : 'An'));
  } catch {
    return null;
  }
}

export function useProductionState() {
  const [buildings, setBuildings] = useState<BuildingState[]>(getDefaultBuildings);
  const [lagerBestand, setLagerBestand] = useState(0);

  const snapshot = useMemo(() => {
    const s = calculateFullProduction(buildings);
    s.lagerFuellung = lagerBestand;
    return s;
  }, [buildings, lagerBestand]);

  const updateBuilding = useCallback((id: number, patch: Partial<Omit<BuildingState, 'id'>>) => {
    setBuildings(prev => prev.map(b =>
      b.id === id ? { ...b, ...patch, level: Math.max(0, Math.min(patch.level ?? b.level, b.maxLevel)) } : b
    ));
  }, []);

  const addBuilding = useCallback((type: BuildingType, level = 1) => {
    setBuildings(prev => [...prev, createBuilding(type, level)]);
  }, []);

  const removeBuilding = useCallback((id: number) => {
    setBuildings(prev => prev.filter(b => b.id !== id));
  }, []);

  const setAllBuildings = useCallback((newBuildings: BuildingState[]) => {
    setBuildings(newBuildings);
  }, []);

  const resetToDefault = useCallback(() => {
    nextId = 1;
    setBuildings(getDefaultBuildings());
    setLagerBestand(0);
  }, []);

  return {
    buildings,
    snapshot,
    lagerBestand,
    setLagerBestand,
    updateBuilding,
    addBuilding,
    removeBuilding,
    setAllBuildings,
    resetToDefault,
  };
}
