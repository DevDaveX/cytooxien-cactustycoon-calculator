import { Link } from 'react-router-dom';
import { WikiLayout } from '@/components/WikiLayout';
import { useWikiPages } from '@/hooks/useWikiPages';
import { useState } from 'react';

const QUICK_LINKS = [
  { label: 'Anfänger-Guide', icon: '📗', slug: 'anfaenger-guide', desc: 'Der perfekte Einstieg' },
  { label: 'Maschinen', icon: '⚙️', slug: 'maschinen', desc: 'Alle Maschinen im Überblick' },
  { label: 'Upgrades', icon: '📦', slug: 'upgrades', desc: 'Verbesserungen & Fortschritt' },
  { label: 'Farmdesigns', icon: '🌵', slug: 'farmdesigns', desc: 'Optimale Farm-Layouts' },
  { label: 'FAQ', icon: '❓', slug: 'faq', desc: 'Häufige Fragen' },
  { label: 'Mitmachen', icon: '🤝', slug: 'mitmachen', desc: 'Hilf beim Wiki mit!' },
];

export default function WikiHome() {
  const { data: pages = [], isLoading } = useWikiPages();
  const [searchQuery, setSearchQuery] = useState('');

  const publishedPages = pages.filter(p => p.published);

  const categories: Record<string, typeof pages> = {};
  publishedPages.forEach(p => {
    if (!categories[p.category]) categories[p.category] = [];
    categories[p.category].push(p);
  });

  const filteredPages = searchQuery.trim()
    ? publishedPages.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : null;

  const sidebarPages = publishedPages.map(p => ({
    slug: p.slug, title: p.title, icon: p.icon || '📄', category: p.category,
  }));

  return (
    <WikiLayout sidebarPages={sidebarPages}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {}
        <div className="relative overflow-hidden">
          <div className="mc-panel !p-8 md:!p-12 text-center relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(120_100%_33%/0.05)] to-transparent pointer-events-none" />
            <div className="relative space-y-4">
              <span className="text-5xl block">🌵</span>
              <h1 className="font-title text-[10px] md:text-sm text-cactus pixel-text leading-relaxed">
                Cactus Tycoon Wiki
              </h1>
              <p className="text-accent text-xl max-w-xl mx-auto">
                Das Community-Wiki für Cactus Tycoon auf Cytooxien
              </p>
              <p className="text-muted-foreground text-base max-w-lg mx-auto">
                Von Spielern für Spieler · Guides, Maschinen, Upgrades & mehr
              </p>

              {}
              <div className="max-w-md mx-auto pt-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg">🔍</span>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="mc-input w-full !pl-10 !py-3 text-lg"
                    placeholder="Wiki durchsuchen..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="flex items-start gap-3 bg-[hsl(40_80%_50%/0.08)] border-l-4 border-accent px-4 py-3">
          <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
          <p className="text-muted-foreground text-base">
            <span className="text-accent font-bold">Community-Projekt</span> — Dieses Wiki steht in keiner
            offiziellen Verbindung zu Cytooxien. Inhalte können unvollständig oder veraltet sein.
          </p>
        </div>

        {}
        {filteredPages && (
          <div className="space-y-3">
            <h2 className="font-title text-[8px] text-muted-foreground pixel-text uppercase tracking-wider">
              {filteredPages.length} Ergebnis{filteredPages.length !== 1 ? 'se' : ''} für „{searchQuery}"
            </h2>
            {filteredPages.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPages.map(page => (
                  <Link key={page.id} to={`/wiki/${page.slug}`} className="mc-panel group hover:glow-green transition-all duration-200 !p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{page.icon}</span>
                      <div className="min-w-0">
                        <h3 className="text-cactus font-bold text-lg group-hover:text-accent transition-colors">{page.title}</h3>
                        <span className="text-muted-foreground text-sm">{page.category}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mc-panel text-center !py-6">
                <p className="text-muted-foreground">Keine Ergebnisse gefunden.</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Access Grid */}
        {!filteredPages && (
          <>
            <div className="space-y-4">
              <h2 className="font-title text-[8px] text-muted-foreground pixel-text uppercase tracking-wider flex items-center gap-2">
                <span>⚡</span> Schnellzugriff
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {QUICK_LINKS.map(link => (
                  <Link
                    key={link.slug}
                    to={`/wiki/${link.slug}`}
                    className="mc-panel group hover:glow-green transition-all duration-200 !p-4 flex flex-col items-center text-center gap-2"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{link.icon}</span>
                    <span className="text-cactus font-bold text-lg group-hover:text-accent transition-colors">{link.label}</span>
                    <span className="text-muted-foreground text-sm">{link.desc}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Content by Category */}
            {!isLoading && Object.keys(categories).length > 0 && (
              <div className="space-y-6">
                <h2 className="font-title text-[8px] text-muted-foreground pixel-text uppercase tracking-wider flex items-center gap-2">
                  <span>📖</span> Alle Wiki-Einträge
                </h2>
                {Object.entries(categories).map(([cat, catPages]) => (
                  <div key={cat} className="space-y-3">
                    <h3 className="font-title text-[7px] text-accent pixel-text flex items-center gap-2">
                      <span className="w-8 h-px bg-accent/30" />
                      {cat}
                      <span className="text-muted-foreground text-sm font-mono">({catPages.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catPages.map(page => (
                        <Link
                          key={page.id}
                          to={`/wiki/${page.slug}`}
                          className="mc-panel group hover:glow-green transition-all duration-200 !p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">{page.icon}</span>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-cactus font-bold text-lg group-hover:text-accent transition-colors truncate">
                                {page.title}
                              </h4>
                              <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                                {page.content.replace(/[#*`\[\]]/g, '').slice(0, 100)}...
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-muted-foreground text-xs">
                                  {new Date(page.updated_at).toLocaleDateString('de-DE')}
                                </span>
                                <span className="text-cactus text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                  Lesen →
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && publishedPages.length === 0 && (
              <div className="mc-panel text-center !py-12">
                <span className="text-4xl block mb-4">📝</span>
                <p className="text-foreground text-xl mb-2">Noch keine Wiki-Seiten vorhanden</p>
                <p className="text-muted-foreground">Melde dich an und erstelle die erste Seite!</p>
              </div>
            )}

            {/* Tools Section */}
            <div className="space-y-4">
              <h2 className="font-title text-[8px] text-muted-foreground pixel-text uppercase tracking-wider flex items-center gap-2">
                <span>🛠️</span> Tools & Hilfe
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mc-panel !p-5 flex items-start gap-4">
                  <span className="text-3xl">🧮</span>
                  <div className="flex-1">
                    <h3 className="text-accent font-bold text-lg mb-1">Produktions-Rechner</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Berechne Produktionsraten, Ressourcenbilanzen und optimiere dein Setup.
                    </p>
                    <Link to="/rechner" className="mc-button mc-button-primary text-sm inline-block">
                      Rechner öffnen →
                    </Link>
                  </div>
                </div>
                <div className="mc-panel !p-5 flex items-start gap-4">
                  <span className="text-3xl">🤖</span>
                  <div className="flex-1">
                    <h3 className="text-accent font-bold text-lg mb-1">KI-Chat Assistent</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      Stelle Fragen zum Spiel – die KI durchsucht automatisch das Wiki.
                    </p>
                    <Link to="/rechner" className="mc-button text-sm inline-block">
                      Chat öffnen →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </WikiLayout>
  );
}
