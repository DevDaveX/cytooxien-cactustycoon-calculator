import { useState, useEffect } from 'react';
import { WikiLayout } from '@/components/WikiLayout';
import { useAuth } from '@/hooks/useAuth';
import { fetchRoles, addRoleApi, removeRoleApi } from '@/lib/authClient';
import { useToast } from '@/hooks/use-toast';
import { useChangelog, useSaveChangelogEntry, useDeleteChangelogEntry } from '@/hooks/useChangelog';
import { useAllFeedback, useUpdateFeedback, useDeleteFeedback } from '@/hooks/useFeedback';

interface UserRole {
  id: number;
  user_id: number;
  role: string;
  username?: string;
  avatar?: string | null;
}

const CHANGELOG_TYPES = [
  { value: 'feature', label: '✨ Neu' },
  { value: 'change', label: '🔄 Änderung' },
  { value: 'bugfix', label: '🐛 Bugfix' },
  { value: 'removal', label: '🗑️ Entfernt' },
];

const FEEDBACK_STATUSES = [
  { value: 'open', label: '📬 Offen' },
  { value: 'in_progress', label: '🔧 In Bearbeitung' },
  { value: 'done', label: '✅ Erledigt' },
  { value: 'rejected', label: '❌ Abgelehnt' },
];

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [newUserId, setNewUserId] = useState('');
  const [newRole, setNewRole] = useState<string>('editor');
  const [activeTab, setActiveTab] = useState<'roles' | 'changelog' | 'feedback'>('feedback');
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('cactus_admin_key') || '');

  const { data: changelogEntries = [] } = useChangelog();
  const saveChangelog = useSaveChangelogEntry(adminKey);
  const deleteChangelog = useDeleteChangelogEntry(adminKey);
  const [clVersion, setClVersion] = useState('');
  const [clTitle, setClTitle] = useState('');
  const [clDesc, setClDesc] = useState('');
  const [clType, setClType] = useState<'feature' | 'change' | 'bugfix' | 'removal'>('feature');

  const { data: feedbackEntries = [] } = useAllFeedback(adminKey);
  const updateFeedback = useUpdateFeedback(adminKey);
  const deleteFeedback = useDeleteFeedback(adminKey);
  const [editingFeedback, setEditingFeedback] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<string>('open');

  const loadRoles = async () => {
    try {
      const data = await fetchRoles(adminKey);
      setRoles(data);
    } catch (err: any) {
      toast({ title: '❌ Fehler beim Laden der Rollen', description: err.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (isAdmin && adminKey) loadRoles();
  }, [isAdmin, adminKey]);

  const addRole = async () => {
    if (!newUserId.trim()) {
      toast({ title: '⚠️ User-ID eingeben', variant: 'destructive' });
      return;
    }
    try {
      await addRoleApi(adminKey, parseInt(newUserId.trim()), newRole);
      toast({ title: '✅ Rolle hinzugefügt' });
      setNewUserId('');
      loadRoles();
    } catch (err: any) {
      toast({ title: '❌ Fehler', description: err.message, variant: 'destructive' });
    }
  };

  const removeRole = async (id: number) => {
    try {
      await removeRoleApi(adminKey, id);
      toast({ title: '✅ Rolle entfernt' });
      loadRoles();
    } catch (err: any) {
      toast({ title: '❌ Fehler', description: err.message, variant: 'destructive' });
    }
  };
  const handleAddChangelog = async () => {
    if (!clVersion.trim() || !clTitle.trim()) {
      toast({ title: '⚠️ Version und Titel erforderlich', variant: 'destructive' });
      return;
    }
    try {
      await saveChangelog.mutateAsync({
        version: clVersion.trim(),
        title: clTitle.trim(),
        description: clDesc.trim(),
        type: clType,
      });
      toast({ title: '✅ Changelog-Eintrag hinzugefügt' });
      setClTitle('');
      setClDesc('');
    } catch {
      toast({ title: '❌ Fehler', variant: 'destructive' });
    }
  };

  const handleUpdateFeedback = async (id: number) => {
    try {
      await updateFeedback.mutateAsync({
        id,
        status: editStatus,
        admin_notes: editNotes,
      });
      toast({ title: '✅ Feedback aktualisiert' });
      setEditingFeedback(null);
    } catch {
      toast({ title: '❌ Fehler', variant: 'destructive' });
    }
  };

  const handleDeleteFeedback = async (id: number) => {
    if (!confirm('Feedback wirklich löschen?')) return;
    try {
      await deleteFeedback.mutateAsync(id);
      toast({ title: '✅ Gelöscht' });
    } catch {
      toast({ title: '❌ Fehler', variant: 'destructive' });
    }
  };

  if (!authLoading && !isAdmin) {
    return (
      <WikiLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mc-panel py-12 text-center">
            <h2 className="font-title text-xs text-danger pixel-text">Kein Zugriff</h2>
            <p className="text-muted-foreground text-lg mt-2">Nur Admins können diese Seite sehen.</p>
          </div>
        </div>
      </WikiLayout>
    );
  }

  return (
    <WikiLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <h1 className="font-title text-xs text-cactus pixel-text">⚙️ Admin Panel</h1>

        {}
        <div className="mc-panel space-y-2">
          <h2 className="font-title text-[9px] text-accent pixel-text">🔑 Admin API-Key</h2>
          <input
            type="password"
            value={adminKey}
            onChange={e => {
              setAdminKey(e.target.value);
              localStorage.setItem('cactus_admin_key', e.target.value);
            }}
            placeholder="CACTUS_ADMIN_API_KEY eingeben..."
            className="mc-input w-full"
          />
          <p className="text-muted-foreground text-xs">Wird lokal gespeichert. Benötigt für Changelog- und Feedback-Verwaltung.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'feedback', label: '📝 Feedback', count: feedbackEntries.filter(f => f.status === 'open').length },
            { key: 'changelog', label: '📋 Changelog', count: 0 },
            { key: 'roles', label: '👥 Rollen', count: 0 },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`mc-button text-sm ${activeTab === tab.key ? 'mc-button-primary' : ''}`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 bg-danger text-white text-xs px-1.5 py-0.5 rounded-sm">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {}
        {activeTab === 'roles' && (
          <div className="mc-panel space-y-4">
            <h2 className="font-title text-[9px] text-accent pixel-text">👥 Benutzer-Rollen</h2>
            <div className="flex gap-2 flex-wrap">
              <input
                value={newUserId}
                onChange={e => setNewUserId(e.target.value)}
                placeholder="User-ID (UUID)..."
                className="mc-input flex-1 min-w-[200px]"
              />
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value as 'admin' | 'editor')}
                className="mc-select"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={addRole} className="mc-button mc-button-primary">+ Hinzufügen</button>
            </div>
            <div className="space-y-2">
              {roles.map(r => (
                <div key={r.id} className="flex items-center justify-between bg-muted p-2 border border-border">
                  <div className="flex items-center gap-2">
                    {r.avatar && <img src={`https://cdn.discordapp.com/avatars/${r.user_id}/${r.avatar}.png`} alt="" className="w-6 h-6 rounded-sm" />}
                    <span className="text-foreground text-sm">{r.username || `User #${r.user_id}`}</span>
                    <span className={`text-xs px-2 py-0.5 ${r.role === 'admin' ? 'bg-danger text-white' : 'bg-cactus text-white'}`}>{r.role}</span>
                  </div>
                  <button onClick={() => removeRole(r.id)} className="mc-button mc-button-danger text-sm">×</button>
                </div>
              ))}
              {roles.length === 0 && <p className="text-muted-foreground text-sm">Keine Rollen vergeben.</p>}
            </div>
          </div>
        )}

        {}
        {activeTab === 'changelog' && (
          <div className="space-y-4">
            <div className="mc-panel space-y-4">
              <h2 className="font-title text-[9px] text-accent pixel-text">➕ Neuer Changelog-Eintrag</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  value={clVersion}
                  onChange={e => setClVersion(e.target.value)}
                  placeholder="Version (z.B. 1.2.0)"
                  className="mc-input"
                />
                <select
                  value={clType}
                  onChange={e => setClType(e.target.value as any)}
                  className="mc-select"
                >
                  {CHANGELOG_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <input
                value={clTitle}
                onChange={e => setClTitle(e.target.value)}
                placeholder="Titel..."
                className="mc-input w-full"
              />
              <textarea
                value={clDesc}
                onChange={e => setClDesc(e.target.value)}
                placeholder="Beschreibung (optional)..."
                className="mc-input w-full min-h-[80px] resize-y"
              />
              <button onClick={handleAddChangelog} disabled={saveChangelog.isPending} className="mc-button mc-button-primary">
                {saveChangelog.isPending ? '⏳ ...' : '💾 Eintrag speichern'}
              </button>
            </div>

            <div className="mc-panel space-y-2">
              <h2 className="font-title text-[9px] text-accent pixel-text">📋 Alle Einträge ({changelogEntries.length})</h2>
              {changelogEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between bg-muted p-2 border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0">v{entry.version}</span>
                    <span className="text-foreground text-sm truncate">{entry.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{entry.type}</span>
                  </div>
                  <button
                    onClick={() => { if (confirm('Löschen?')) deleteChangelog.mutate(entry.id); }}
                    className="mc-button mc-button-danger text-sm shrink-0"
                  >🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {}
        {activeTab === 'feedback' && (
          <div className="mc-panel space-y-3">
            <h2 className="font-title text-[9px] text-accent pixel-text">📝 Feedback-Einträge ({feedbackEntries.length})</h2>
            {feedbackEntries.map(entry => (
              <div key={entry.id} className="bg-muted p-3 border border-border space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground font-mono">{entry.feedback_id}</span>
                    <span className={`text-xs px-2 py-0.5 ${
                      entry.status === 'open' ? 'bg-accent text-white' :
                      entry.status === 'in_progress' ? 'bg-warning text-black' :
                      entry.status === 'done' ? 'bg-cactus text-white' : 'bg-danger text-white'
                    }`}>
                      {FEEDBACK_STATUSES.find(s => s.value === entry.status)?.label}
                    </span>
                    <span className="text-xs text-muted-foreground">{entry.type}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingFeedback(editingFeedback === entry.id ? null : entry.id);
                        setEditNotes(entry.admin_notes || '');
                        setEditStatus(entry.status);
                      }}
                      className="mc-button text-sm"
                    >✏️</button>
                    <button onClick={() => handleDeleteFeedback(entry.id)} className="mc-button mc-button-danger text-sm">🗑️</button>
                  </div>
                </div>
                <p className="text-foreground text-base font-medium">{entry.title}</p>
                <p className="text-muted-foreground text-sm">{entry.description}</p>
                <div className="text-xs text-muted-foreground">
                  {entry.author_name && <span>Von: {entry.author_name} · </span>}
                  {new Date(entry.created_at).toLocaleDateString('de-DE')}
                </div>

                {editingFeedback === entry.id && (
                  <div className="border-t border-border pt-3 space-y-2 mt-2">
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value)}
                      className="mc-select"
                    >
                      {FEEDBACK_STATUSES.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Admin-Notiz / Antwort..."
                      className="mc-input w-full min-h-[80px] resize-y"
                    />
                    <button
                      onClick={() => handleUpdateFeedback(entry.id)}
                      disabled={updateFeedback.isPending}
                      className="mc-button mc-button-primary"
                    >
                      💾 Speichern
                    </button>
                  </div>
                )}
              </div>
            ))}
            {feedbackEntries.length === 0 && (
              <p className="text-muted-foreground text-sm">Keine Feedback-Einträge vorhanden.</p>
            )}
          </div>
        )}
      </div>
    </WikiLayout>
  );
}
