import { useParams, Link } from 'react-router-dom';
import { WikiLayout } from '@/components/WikiLayout';
import { useFeedbackById } from '@/hooks/useFeedback';

const STATUS_INFO: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  open: { label: 'Offen', icon: '📬', color: 'bg-accent text-white', desc: 'Dein Feedback wurde empfangen und wartet auf Bearbeitung.' },
  in_progress: { label: 'In Bearbeitung', icon: '🔧', color: 'bg-warning text-black', desc: 'Ein Admin bearbeitet dein Feedback gerade.' },
  done: { label: 'Erledigt', icon: '✅', color: 'bg-cactus text-white', desc: 'Dein Feedback wurde bearbeitet und umgesetzt.' },
  rejected: { label: 'Abgelehnt', icon: '❌', color: 'bg-danger text-white', desc: 'Dein Feedback wurde geprüft, aber leider abgelehnt.' },
};

const TYPE_LABELS: Record<string, string> = {
  bug: '🐛 Bug-Report',
  feature: '💡 Feature-Wunsch',
  feedback: '💬 Feedback',
};

export default function FeedbackTracker() {
  const { feedbackId } = useParams<{ feedbackId: string }>();
  const { data: entry, isLoading } = useFeedbackById(feedbackId || '');

  return (
    <WikiLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link to="/feedback" className="text-cactus hover:underline text-sm">← Zurück zum Feedback</Link>

        <h1 className="font-title text-xs text-cactus pixel-text">🔍 Feedback-Status</h1>

        {isLoading && <p className="text-muted-foreground">Lade...</p>}

        {!isLoading && !entry && (
          <div className="mc-panel py-8 text-center">
            <p className="text-xl mb-2">😕</p>
            <p className="text-foreground text-base font-medium">Feedback nicht gefunden</p>
            <p className="text-muted-foreground text-sm mt-1">
              Die ID <strong>{feedbackId}</strong> existiert nicht. Bitte prüfe die ID.
            </p>
          </div>
        )}

        {entry && (() => {
          const s = STATUS_INFO[entry.status] || STATUS_INFO.open;
          return (
            <div className="space-y-4">
              {}
              <div className="mc-panel border-2 border-cactus space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl">{s.icon}</span>
                  <div>
                    <span className={`text-sm px-3 py-1 ${s.color}`}>{s.label}</span>
                    <p className="text-muted-foreground text-sm mt-1">{s.desc}</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">
                  Feedback-ID: <strong className="text-foreground">{entry.feedback_id}</strong>
                </p>
              </div>

              {}
              <div className="mc-panel space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">{TYPE_LABELS[entry.type]}</span>
                  {entry.author_name && (
                    <span className="text-sm text-muted-foreground">• von {entry.author_name}</span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    • {new Date(entry.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <h2 className="text-foreground text-lg font-medium">{entry.title}</h2>
                <p className="text-foreground text-base whitespace-pre-wrap">{entry.description}</p>
              </div>

              {}
              {entry.admin_notes && (
                <div className="mc-panel border-l-4 border-cactus space-y-2">
                  <h3 className="font-title text-[8px] text-cactus pixel-text">💬 Antwort vom Team</h3>
                  <p className="text-foreground text-base whitespace-pre-wrap">{entry.admin_notes}</p>
                  <p className="text-muted-foreground text-xs">
                    Zuletzt aktualisiert: {new Date(entry.updated_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </WikiLayout>
  );
}
