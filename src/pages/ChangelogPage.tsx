import { WikiLayout } from '@/components/WikiLayout';
import { useChangelog } from '@/hooks/useChangelog';

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  feature: { label: 'Neu', icon: '✨', color: 'bg-cactus text-white' },
  change: { label: 'Änderung', icon: '🔄', color: 'bg-accent text-white' },
  bugfix: { label: 'Bugfix', icon: '🐛', color: 'bg-warning text-black' },
  removal: { label: 'Entfernt', icon: '🗑️', color: 'bg-danger text-white' },
};

export default function ChangelogPage() {
  const { data: entries = [], isLoading } = useChangelog();

  const grouped: Record<string, typeof entries> = {};
  entries.forEach(e => {
    if (!grouped[e.version]) grouped[e.version] = [];
    grouped[e.version].push(e);
  });

  return (
    <WikiLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-title text-xs text-cactus pixel-text">📋 Changelog & Updates</h1>
        <p className="text-muted-foreground text-base">Alle Änderungen und Updates im Überblick.</p>

        {isLoading && <p className="text-muted-foreground">Lade...</p>}

        {Object.entries(grouped).map(([version, items]) => (
          <div key={version} className="mc-panel space-y-3">
            <div className="flex items-center gap-3">
              <span className="font-title text-[9px] text-cactus pixel-text">Version {version}</span>
              <span className="text-muted-foreground text-sm">
                {new Date(items[0].created_at).toLocaleDateString('de-DE')}
              </span>
            </div>
            <div className="space-y-2">
              {items.map(entry => {
                const t = TYPE_LABELS[entry.type] || TYPE_LABELS.change;
                return (
                  <div key={entry.id} className="flex items-start gap-3 p-2 bg-muted border border-border">
                    <span className={`text-xs px-2 py-0.5 shrink-0 ${t.color}`}>
                      {t.icon} {t.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-foreground text-base font-medium">{entry.title}</p>
                      {entry.description && (
                        <p className="text-muted-foreground text-sm mt-1">{entry.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {!isLoading && entries.length === 0 && (
          <div className="mc-panel py-8 text-center">
            <p className="text-muted-foreground text-base">Noch keine Einträge vorhanden.</p>
          </div>
        )}
      </div>
    </WikiLayout>
  );
}
