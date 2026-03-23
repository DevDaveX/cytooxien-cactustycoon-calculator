import { useState } from 'react';
import { WikiLayout } from '@/components/WikiLayout';
import { useSubmitFeedback, useMyFeedback } from '@/hooks/useFeedback';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const TYPES = [
  { value: 'bug' as const, label: '🐛 Bug melden', desc: 'Etwas funktioniert nicht richtig' },
  { value: 'feature' as const, label: '💡 Feature-Wunsch', desc: 'Neue Funktion vorschlagen' },
  { value: 'feedback' as const, label: '💬 Feedback', desc: 'Allgemeines Feedback geben' },
];

const STATUS_INFO: Record<string, { label: string; color: string }> = {
  open: { label: '📬 Offen', color: 'bg-accent text-white' },
  in_progress: { label: '🔧 In Bearbeitung', color: 'bg-warning text-black' },
  done: { label: '✅ Erledigt', color: 'bg-cactus text-white' },
  rejected: { label: '❌ Abgelehnt', color: 'bg-danger text-white' },
};

const TYPE_LABELS: Record<string, string> = {
  bug: '🐛 Bug',
  feature: '💡 Feature',
  feedback: '💬 Feedback',
};

export default function FeedbackPage() {
  const { user, signInWithDiscord, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const submitMutation = useSubmitFeedback();
  const { data: myFeedbacks = [], isLoading: feedbacksLoading } = useMyFeedback();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'bug' | 'feature' | 'feedback'>('feedback');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({ title: '⚠️ Bitte einen Titel eingeben', variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: '⚠️ Bitte eine Beschreibung eingeben', variant: 'destructive' });
      return;
    }
    try {
      await submitMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        type,
        author_name: user?.displayName || undefined,
      });
      setTitle('');
      setDescription('');
      setShowForm(false);
      toast({ title: '✅ Feedback gesendet!' });
    } catch {
      toast({ title: '❌ Fehler beim Senden', variant: 'destructive' });
    }
  };

  return (
    <WikiLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-title text-xs text-cactus pixel-text">📝 Feedback & Bug-Report</h1>

        {}
        {!user && !authLoading && (
          <div className="mc-panel space-y-4 text-center py-8">
            <p className="text-foreground text-lg">🔒 Melde dich mit Discord an, um Feedback zu schreiben und deine Historie zu sehen.</p>
            <button onClick={signInWithDiscord} className="mc-button mc-button-primary text-base">
              🎮 Login mit Discord
            </button>
          </div>
        )}

        {}
        {user && (
          <>
            {}
            {!showForm ? (
              <button onClick={() => setShowForm(true)} className="mc-button mc-button-primary">
                ➕ Neues Feedback einreichen
              </button>
            ) : (
              <div className="mc-panel space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-title text-[9px] text-accent pixel-text">Neues Feedback einreichen</h2>
                  <button onClick={() => setShowForm(false)} className="mc-button text-sm">✕ Abbrechen</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setType(t.value)}
                      className={`p-3 border-2 text-left transition-colors ${
                        type === t.value
                          ? 'border-cactus bg-cactus/10'
                          : 'border-border bg-muted hover:border-muted-foreground'
                      }`}
                    >
                      <p className="text-foreground text-base font-medium">{t.label}</p>
                      <p className="text-muted-foreground text-sm">{t.desc}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-foreground text-sm font-medium block mb-1">Titel *</label>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Kurze Zusammenfassung..."
                    className="mc-input w-full"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="text-foreground text-sm font-medium block mb-1">Beschreibung *</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Beschreibe dein Feedback möglichst genau..."
                    className="mc-input w-full min-h-[120px] resize-y"
                    maxLength={2000}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="mc-button mc-button-primary"
                >
                  {submitMutation.isPending ? '⏳ Wird gesendet...' : '📤 Feedback absenden'}
                </button>
              </div>
            )}

            {}
            <div className="mc-panel space-y-4">
              <h2 className="font-title text-[9px] text-accent pixel-text">📋 Meine Feedbacks ({myFeedbacks.length})</h2>

              {feedbacksLoading && <p className="text-muted-foreground text-sm">Lade...</p>}

              {!feedbacksLoading && myFeedbacks.length === 0 && (
                <p className="text-muted-foreground text-sm">Du hast noch kein Feedback eingereicht.</p>
              )}

              {myFeedbacks.map(entry => {
                const s = STATUS_INFO[entry.status] || STATUS_INFO.open;
                const isExpanded = expandedId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="bg-muted border border-border cursor-pointer hover:border-cactus/50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <div className="p-3 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-xs px-2 py-0.5 shrink-0 ${s.color}`}>{s.label}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{TYPE_LABELS[entry.type]}</span>
                        <span className="text-foreground text-sm truncate">{entry.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(entry.created_at).toLocaleDateString('de-DE')}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border p-3 space-y-3">
                        <p className="text-foreground text-sm whitespace-pre-wrap">{entry.description}</p>

                        {entry.admin_notes && (
                          <div className="border-l-4 border-cactus pl-3 space-y-1">
                            <p className="font-title text-[8px] text-cactus pixel-text">💬 Antwort vom Team</p>
                            <p className="text-foreground text-sm whitespace-pre-wrap">{entry.admin_notes}</p>
                            <p className="text-muted-foreground text-xs">
                              Aktualisiert: {new Date(entry.updated_at).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </WikiLayout>
  );
}
