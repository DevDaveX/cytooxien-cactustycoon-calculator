import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { WikiLayout } from '@/components/WikiLayout';
import { useWikiPage, useWikiPages, useSaveWikiPage } from '@/hooks/useWikiPages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = ['Allgemein', 'Maschinen', 'Upgrades & Progress', 'Farmdesigns', 'Rechner & Tabellen', 'Changelog & Meta', 'Guides'];
const ICONS = ['📄', '📗', '⚙️', '📦', '🌵', '🧮', '❓', '📋', '🏗️', '⚡', '☢️', '❄️', '🏭', '⛏️', '🔧', '🎯', '💎', '🏆', '🗺️', '🤝'];

interface ToolbarButton {
  label: string;
  icon: string;
  before: string;
  after: string;
  placeholder: string;
  title: string;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { label: 'B', icon: '', before: '**', after: '**', placeholder: 'fett', title: 'Fett (Ctrl+B)' },
  { label: 'I', icon: '', before: '*', after: '*', placeholder: 'kursiv', title: 'Kursiv (Ctrl+I)' },
  { label: 'S', icon: '', before: '~~', after: '~~', placeholder: 'durchgestrichen', title: 'Durchgestrichen' },
  { label: 'H1', icon: '', before: '# ', after: '', placeholder: 'Überschrift 1', title: 'Überschrift 1' },
  { label: 'H2', icon: '', before: '## ', after: '', placeholder: 'Überschrift 2', title: 'Überschrift 2' },
  { label: 'H3', icon: '', before: '### ', after: '', placeholder: 'Überschrift 3', title: 'Überschrift 3' },
  { label: '• Liste', icon: '', before: '- ', after: '', placeholder: 'Listeneintrag', title: 'Aufzählung' },
  { label: '1. Liste', icon: '', before: '1. ', after: '', placeholder: 'Listeneintrag', title: 'Nummerierte Liste' },
  { label: '☑ Todo', icon: '', before: '- [ ] ', after: '', placeholder: 'Aufgabe', title: 'Checkliste' },
  { label: '🔗 Link', icon: '', before: '[', after: '](url)', placeholder: 'Linktext', title: 'Link einfügen' },
  { label: '🖼️ Bild', icon: '', before: '![', after: '](url)', placeholder: 'Alt-Text', title: 'Bild einfügen' },
  { label: '💬 Zitat', icon: '', before: '> ', after: '', placeholder: 'Zitat', title: 'Blockzitat' },
  { label: '`Code`', icon: '', before: '`', after: '`', placeholder: 'code', title: 'Inline Code' },
  { label: '```Block', icon: '', before: '```\n', after: '\n```', placeholder: 'Code-Block', title: 'Code Block' },
  { label: '📊 Tabelle', icon: '', before: '| Spalte 1 | Spalte 2 | Spalte 3 |\n| --- | --- | --- |\n| ', after: ' | Wert | Wert |', placeholder: '', title: 'Tabelle einfügen' },
  { label: '— Linie', icon: '', before: '\n---\n', after: '', placeholder: '', title: 'Horizontale Linie' },
];

const TEMPLATES = [
  {
    name: '📗 Guide-Vorlage',
    content: `# Guide-Titel

## Einleitung
Beschreibe hier, worum es in diesem Guide geht.

## Voraussetzungen
- Voraussetzung 1
- Voraussetzung 2

## Schritt-für-Schritt Anleitung

### Schritt 1: Titel
Beschreibung des ersten Schritts.

### Schritt 2: Titel
Beschreibung des zweiten Schritts.

## Tipps & Tricks
> **Tipp:** Hilfreicher Hinweis hier.

## Zusammenfassung
Kurze Zusammenfassung des Guides.
`,
  },
  {
    name: '⚙️ Maschinen-Vorlage',
    content: `# Maschinenname

## Übersicht
Kurze Beschreibung der Maschine.

## Eigenschaften
| Eigenschaft | Wert |
| --- | --- |
| Kosten | 000 |
| Produktion | 0/s |
| Energie | 0/s |

## Upgrades
- **Upgrade 1** — Beschreibung
- **Upgrade 2** — Beschreibung

## Tipps
> Hilfreiche Tipps zur optimalen Nutzung.
`,
  },
  {
    name: '📋 Allgemeine Vorlage',
    content: `# Titel

## Überblick
Beschreibung des Themas.

## Details
Detaillierte Informationen.

### Unterthema
Weitere Details.

## Siehe auch
- [Verwandtes Thema](link)
`,
  },
];

export default function WikiEditor() {
  const { slug: editSlug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isNew = !editSlug;
  const { data: existingPage } = useWikiPage(editSlug || '');
  const { data: allPages = [] } = useWikiPages();
  const saveMutation = useSaveWikiPage();
  const { isEditor, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState(searchParams.get('slug') || '');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Allgemein');
  const [icon, setIcon] = useState('📄');
  const [published, setPublished] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'split'>('edit');
  const [showMeta, setShowMeta] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (existingPage) {
      setTitle(existingPage.title);
      setSlug(existingPage.slug);
      setContent(existingPage.content);
      setCategory(existingPage.category);
      setIcon(existingPage.icon || '📄');
      setPublished(existingPage.published);
    }
  }, [existingPage]);

  useEffect(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    setWordCount(words);
  }, [content]);

  const sidebarPages = allPages.filter(p => p.published).map(p => ({
    slug: p.slug, title: p.title, icon: p.icon || '📄', category: p.category,
  }));

  const generateSlug = (t: string) =>
    t.toLowerCase()
      .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const insertAtCursor = useCallback((before: string, after: string, placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.slice(start, end) || placeholder;
    const newText = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
    setContent(newText);
    const cursorPos = start + before.length + selected.length;
    setTimeout(() => {
      textarea.setSelectionRange(cursorPos, cursorPos);
      textarea.focus();
    }, 0);
  }, []);

  const handleSave = async (asDraft = false) => {
    if (!title.trim() || !slug.trim()) {
      toast({ title: '⚠️ Titel und Slug sind erforderlich', variant: 'destructive' });
      return;
    }
    try {
      await saveMutation.mutateAsync({
        id: existingPage?.id,
        title,
        slug,
        content,
        category,
        icon,
        published: asDraft ? false : published,
      });
      toast({ title: asDraft ? '📝 Als Entwurf gespeichert!' : '✅ Gespeichert!' });
      navigate(`/wiki/${slug}`);
    } catch (e: any) {
      toast({ title: '❌ Fehler', description: e.message, variant: 'destructive' });
    }
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); insertAtCursor('**', '**', 'fett'); }
      if (e.key === 'i') { e.preventDefault(); insertAtCursor('*', '*', 'kursiv'); }
      if (e.key === 's') { e.preventDefault(); handleSave(); }
    }
  }, [insertAtCursor]);

  if (!authLoading && !isEditor) {
    return (
      <WikiLayout sidebarPages={sidebarPages}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mc-panel !py-16 text-center">
            <span className="text-5xl block mb-4">🔒</span>
            <h2 className="font-title text-[9px] text-danger pixel-text mb-2">Keine Berechtigung</h2>
            <p className="text-muted-foreground text-lg mt-2">Du benötigst Editor- oder Admin-Rechte.</p>
          </div>
        </div>
      </WikiLayout>
    );
  }

  const markdownComponents = {
    h1: ({ children }: any) => <h1 className="font-title text-[10px] text-cactus pixel-text mt-6 mb-3 pb-2 border-b-2 border-border">{children}</h1>,
    h2: ({ children }: any) => <h2 className="font-title text-[9px] text-accent pixel-text mt-5 mb-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-cactus font-bold text-xl mt-4 mb-2">{children}</h3>,
    p: ({ children }: any) => <p className="text-foreground text-lg mb-3 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-none text-foreground text-lg mb-3 space-y-1 ml-2">{children}</ul>,
    li: ({ children }: any) => <li className="flex items-start gap-2"><span className="text-cactus mt-1">▸</span><span>{children}</span></li>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside text-foreground text-lg mb-3 space-y-1">{children}</ol>,
    strong: ({ children }: any) => <strong className="text-accent font-bold">{children}</strong>,
    code: ({ children }: any) => <code className="bg-muted px-2 py-0.5 text-cactus text-base border border-border">{children}</code>,
    pre: ({ children }: any) => <pre className="mc-panel !bg-[hsl(30_10%_10%)] overflow-x-auto text-sm mb-3 !p-4 border-l-4 border-cactus">{children}</pre>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-accent bg-accent/5 pl-4 pr-3 py-2 my-3 text-muted-foreground italic">{children}</blockquote>,
    table: ({ children }: any) => <div className="overflow-x-auto mb-4"><table className="w-full border-2 border-border">{children}</table></div>,
    th: ({ children }: any) => <th className="bg-[hsl(120_100%_33%/0.1)] border border-border px-3 py-2 text-left text-cactus font-bold">{children}</th>,
    td: ({ children }: any) => <td className="border border-border px-3 py-2 text-foreground">{children}</td>,
    a: ({ href, children }: any) => <a href={href} className="text-cactus underline hover:text-accent">{children}</a>,
    hr: () => <hr className="border-t-2 border-border my-6" />,
  };

  const renderPreview = () => (
    <div className="p-4 min-h-[500px]">
      {content ? (
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      ) : (
        <p className="text-muted-foreground text-center py-12">Noch kein Inhalt zum Anzeigen...</p>
      )}
    </div>
  );

  const renderEditor = () => (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={e => setContent(e.target.value)}
      onKeyDown={handleKeyDown}
      className="w-full min-h-[500px] resize-y text-base bg-[hsl(30_10%_10%)] text-foreground border-0 px-4 py-4 focus:outline-none font-mono leading-relaxed"
      placeholder="Schreibe hier deinen Inhalt in Markdown..."
      spellCheck
    />
  );

  return (
    <WikiLayout sidebarPages={sidebarPages}>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">

        {}
        <div className="flex items-center justify-between">
          <h1 className="font-title text-[9px] md:text-xs text-cactus pixel-text">
            {isNew ? '📝 Neue Seite' : `✏️ ${title || 'Bearbeiten'}`}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {wordCount} Wörter · {content.length} Zeichen
            </span>
          </div>
        </div>

        {}
        <button
          onClick={() => setShowMeta(!showMeta)}
          className="mc-button text-sm w-full flex items-center justify-between"
        >
          <span>📋 Seiten-Einstellungen</span>
          <span>{showMeta ? '▲' : '▼'}</span>
        </button>

        {}
        {showMeta && (
          <div className="mc-panel space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="stat-label block mb-1.5">Titel *</label>
                <input
                  value={title}
                  onChange={e => {
                    setTitle(e.target.value);
                    if (isNew) setSlug(generateSlug(e.target.value));
                  }}
                  className="mc-input w-full !py-2.5"
                  placeholder="Seitentitel..."
                />
              </div>
              <div>
                <label className="stat-label block mb-1.5">Slug (URL) *</label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">/wiki/</span>
                  <input
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="mc-input flex-1 !py-2.5"
                    placeholder="url-name"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="stat-label block mb-1.5">Kategorie</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="mc-select w-full !py-2.5"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="stat-label block mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICONS.map(i => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-9 h-9 text-xl flex items-center justify-center border-2 transition-all ${
                        icon === i
                          ? 'border-cactus bg-[hsl(120_100%_33%/0.15)] scale-110'
                          : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer mc-panel !py-3 !px-4 w-full">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={e => setPublished(e.target.checked)}
                    className="w-5 h-5 accent-[hsl(var(--cactus))]"
                  />
                  <div>
                    <span className="text-foreground text-lg block">Veröffentlicht</span>
                    <span className="text-muted-foreground text-sm">{published ? 'Sichtbar für alle' : 'Nur für Editoren'}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {}
        <div className="mc-panel !p-2 flex flex-wrap items-center gap-1">
          <div className="flex flex-wrap gap-1 flex-1">
            {TOOLBAR_BUTTONS.map((btn, i) => (
              <button
                key={i}
                onClick={() => insertAtCursor(btn.before, btn.after, btn.placeholder)}
                className="mc-button text-sm !px-2 !py-1"
                title={btn.title}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="border-l-2 border-border pl-2 ml-1">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="mc-button mc-button-primary text-sm !px-3 !py-1"
              title="Vorlage einfügen"
            >
              📝 Vorlagen
            </button>
          </div>
        </div>

        {}
        {showTemplates && (
          <div className="mc-panel !p-3 space-y-2 animate-slide-up">
            <h4 className="stat-label mb-2">Vorlage einfügen:</h4>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (!content || confirm('Vorhandenen Inhalt durch Vorlage ersetzen?')) {
                      setContent(tpl.content);
                      setShowTemplates(false);
                    }
                  }}
                  className="mc-button text-sm"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {}
        <div className="flex items-center gap-1 border-b-2 border-border pb-0">
          {(['edit', 'split', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm transition-colors border-b-2 -mb-[2px] ${
                activeTab === tab
                  ? 'border-cactus text-cactus'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'edit' ? '✏️ Editor' : tab === 'preview' ? '👁️ Vorschau' : '📐 Split-Ansicht'}
            </button>
          ))}
        </div>

        {}
        <div className="mc-panel !p-0 overflow-hidden">
          {activeTab === 'edit' && renderEditor()}
          {activeTab === 'preview' && renderPreview()}
          {activeTab === 'split' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-x-2 divide-border">
              <div>{renderEditor()}</div>
              <div className="overflow-y-auto max-h-[600px] bg-card">{renderPreview()}</div>
            </div>
          )}
        </div>

        {}
        <details className="mc-panel">
          <summary className="cursor-pointer text-muted-foreground text-sm font-bold flex items-center gap-2">
            <span>📖 Markdown-Referenz</span>
          </summary>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus"># H1</code> — Überschrift 1</div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">## H2</code> — Überschrift 2</div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">**fett**</code> — <strong className="text-accent">fett</strong></div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">*kursiv*</code> — <em>kursiv</em></div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">~~text~~</code> — <s>durchgestrichen</s></div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">- Liste</code> — Aufzählung</div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">1. Liste</code> — Nummeriert</div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">[Text](url)</code> — Link</div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">`code`</code> — <code className="text-cactus">Code</code></div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">&gt; Zitat</code> — Blockzitat</div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">| A | B |</code> — Tabelle</div>
            <div className="bg-muted/30 px-3 py-2"><code className="text-cactus">---</code> — Trennlinie</div>
          </div>
          <div className="mt-3 text-muted-foreground text-sm">
            <strong className="text-foreground">Tastenkürzel:</strong> Ctrl+B (Fett) · Ctrl+I (Kursiv) · Ctrl+S (Speichern)
          </div>
        </details>

        {}
        <div className="flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-background py-3 border-t-2 border-border -mx-4 px-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(false)}
              className="mc-button mc-button-primary"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? '⏳ Speichern...' : '💾 Speichern & Veröffentlichen'}
            </button>
            <button
              onClick={() => handleSave(true)}
              className="mc-button"
              disabled={saveMutation.isPending}
            >
              📝 Als Entwurf speichern
            </button>
          </div>
          <button onClick={() => navigate(-1)} className="mc-button text-sm">
            ← Zurück
          </button>
        </div>
      </div>
    </WikiLayout>
  );
}
