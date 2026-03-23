import { BuildingState, BuildingType, BUILDING_LABELS, BUILDING_ICONS, BuildingStatus, STATUS_LABELS } from '@/lib/productionEngine';
import { Slider } from '@/components/ui/slider';

interface BuildingCardProps {
  building: BuildingState;
  onUpdate: (id: number, patch: Partial<Omit<BuildingState, 'id'>>) => void;
  onRemove: (id: number) => void;
}

export function BuildingCard({ building, onUpdate, onRemove }: BuildingCardProps) {
  const statusColors: Record<BuildingStatus, string> = {
    An: 'bg-cactus',
    Aus: 'bg-muted-foreground',
    Leer: 'bg-warning',
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{BUILDING_ICONS[building.type]}</span>
          <span className="font-semibold text-sm text-foreground">{BUILDING_LABELS[building.type]}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`pulse-dot ${statusColors[building.status]}`} />
          <select
            value={building.status}
            onChange={(e) => onUpdate(building.id, { status: e.target.value as BuildingStatus })}
            className="bg-secondary text-secondary-foreground text-xs rounded px-1.5 py-0.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <button
            onClick={() => onRemove(building.id)}
            className="text-muted-foreground hover:text-destructive transition-colors text-sm"
            title="Entfernen"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Level</span>
          <span className="font-mono text-sm font-bold text-primary">{building.level}</span>
        </div>
        <Slider
          value={[building.level]}
          onValueChange={([v]) => onUpdate(building.id, { level: v })}
          min={0}
          max={building.maxLevel}
          step={1}
        />
      </div>
    </div>
  );
}
