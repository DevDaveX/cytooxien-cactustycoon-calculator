import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { WikiLayout } from '@/components/WikiLayout';
import { useWikiPage, useWikiPages, useDeleteWikiPage } from '@/hooks/useWikiPages';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function WikiPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading } = useWikiPage(slug || '');
  const { data: allPages = [] } = useWikiPages();
  const { isAdmin, isEditor } = useAuth();
  const deleteMutation = useDeleteWikiPage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const sidebarPages = allPages.filter(p => p.published).map(p => ({
    slug: p.slug, title: p.title, icon: p.icon || '📄', category: p.category,
  }));

  const handleDelete = async () => {
    if (!page || !confirm('Diese Seite wirklich löschen?')) return;
    try {
      await deleteMutation.mutateAsync(page.id);
      toast({ title: '✅ Gelöscht' });
      navigate('/');
    } catch {
      toast({ title: '❌ Fehler beim Löschen', variant: 'destructive' });
    }
  };

  return (
    <WikiLayout sidebarPages={sidebarPages}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-8 bg-muted/50 rounded w-2/3 animate-pulse" />
            <div className="mc-panel !p-8 space-y-3">
              <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
              <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-muted/50 rounded w-4/6 animate-pulse" />
            </div>
          </div>
        ) : !page ? (
          <div className="mc-panel !py-16 text-center">
            <span className="text-5xl block mb-4">🔍</span>
            <h2 className="font-title text-[9px] text-danger pixel-text mb-4">Seite nicht gefunden</h2>
            <p className="text-muted-foreground text-lg mb-6">
              Die Seite „<span className="text-accent">{slug}</span>" existiert nicht.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/" className="mc-button text-sm">← Zur Startseite</Link>
              {isEditor && (
                <Link to={`/wiki/neu?slug=${slug}`} className="mc-button mc-button-primary text-sm">
                  ✏️ Seite erstellen
                </Link>
              )}
            </div>
          </div>
        ) : (
          <article className="space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-cactus transition-colors">🏠 Wiki</Link>
              <span className="text-muted-foreground/50">›</span>
              <span className="text-accent">{page.category}</span>
              <span className="text-muted-foreground/50">›</span>
              <span className="text-foreground">{page.title}</span>
            </nav>

            {/* Page Header */}
            <div className="mc-panel !p-6 flex flex-col md:flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{page.icon}</span>
                <div>
                  <h1 className="font-title text-[10px] md:text-xs text-cactus pixel-text leading-relaxed">
                    {page.title}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      📂 {page.category}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      🕐 {new Date(page.updated_at).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
              {(isAdmin || isEditor) && (
                <div className="flex gap-2 flex-shrink-0">
                  <Link to={`/wiki/bearbeiten/${page.slug}`} className="mc-button text-sm">
                    ✏️ Bearbeiten
                  </Link>
                  {isAdmin && (
                    <button onClick={handleDelete} className="mc-button mc-button-danger text-sm">
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="mc-panel !p-6 md:!p-8 wiki-content">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="font-title text-[10px] text-cactus pixel-text mt-8 mb-4 pb-2 border-b-2 border-border">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="font-title text-[9px] text-accent pixel-text mt-6 mb-3 flex items-center gap-2">
                      <span className="w-3 h-3 bg-accent/30 inline-block" />
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => <h3 className="text-cactus font-bold text-xl mt-5 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="text-foreground text-lg mb-4 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-none text-foreground text-lg mb-4 space-y-2 ml-2">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2">
                      <span className="text-cactus mt-1 flex-shrink-0">▸</span>
                      <span>{children}</span>
                    </li>
                  ),
                  ol: ({ children }) => <ol className="list-decimal list-inside text-foreground text-lg mb-4 space-y-2">{children}</ol>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-');
                    if (isBlock) return <code className={className}>{children}</code>;
                    return <code className="bg-muted px-2 py-0.5 text-cactus text-base border border-border">{children}</code>;
                  },
                  pre: ({ children }) => (
                    <pre className="mc-panel !bg-[hsl(30_10%_10%)] overflow-x-auto text-sm mb-4 !p-4 border-l-4 border-cactus">{children}</pre>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full border-2 border-border">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="bg-[hsl(120_100%_33%/0.1)] border border-border px-4 py-2.5 text-left text-cactus font-bold text-base">{children}</th>
                  ),
                  td: ({ children }) => <td className="border border-border px-4 py-2.5 text-foreground">{children}</td>,
                  a: ({ href, children }) => (
                    <a href={href} className="text-cactus underline underline-offset-2 hover:text-accent transition-colors">{children}</a>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-accent bg-accent/5 pl-4 pr-3 py-2 my-4 text-muted-foreground italic">{children}</blockquote>
                  ),
                  strong: ({ children }) => <strong className="text-accent font-bold">{children}</strong>,
                  hr: () => <hr className="border-t-2 border-border my-8" />,
                  img: ({ src, alt }) => (
                    <img src={src} alt={alt || ''} className="max-w-full h-auto my-4 border-2 border-border" loading="lazy" />
                  ),
                }}
              >
                {page.content}
              </ReactMarkdown>
            </div>

            {/* Footer nav */}
            <div className="flex justify-between items-center text-sm">
              <Link to="/" className="mc-button text-sm">← Zurück zum Wiki</Link>
              {(isAdmin || isEditor) && (
                <Link to={`/wiki/bearbeiten/${page.slug}`} className="text-muted-foreground hover:text-cactus transition-colors">
                  ✏️ Seite bearbeiten
                </Link>
              )}
            </div>
          </article>
        )}
      </div>
    </WikiLayout>
  );
}
