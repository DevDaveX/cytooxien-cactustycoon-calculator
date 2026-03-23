import { useState } from 'react';
import { exportConfig, importConfig } from '@/hooks/useProductionState';
import { BuildingState } from '@/lib/productionEngine';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ConfigShareDialogProps {
  open: boolean;
  onClose: () => void;
  buildings: BuildingState[];
  onImport: (buildings: BuildingState[]) => void;
}

export function ConfigShareDialog({ open, onClose, buildings, onImport }: ConfigShareDialogProps) {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importCode, setImportCode] = useState('');
  const { toast } = useToast();

  const exportCode = buildings.length > 0 ? exportConfig(buildings) : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(exportCode);
    toast({ title: '✅ Kopiert!', description: 'Code wurde in die Zwischenablage kopiert.' });
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/rechner?config=${exportCode}`;
    navigator.clipboard.writeText(url);
    toast({ title: '✅ Link kopiert!', description: 'Direktlink wurde kopiert.' });
  };

  const handleImport = () => {
    if (!importCode.trim()) {
      toast({ title: '⚠️ Fehler', description: 'Bitte einen Code eingeben.', variant: 'destructive' });
      return;
    }
    const result = importConfig(importCode);
    if (!result || result.length === 0) {
      toast({ title: '❌ Ungültiger Code', description: 'Der eingegebene Code konnte nicht gelesen werden.', variant: 'destructive' });
      return;
    }
    onImport(result);
    toast({ title: '✅ Importiert!', description: `${result.length} Gebäude wurden geladen.` });
    setImportCode('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-2 border-border max-w-md !rounded-none shadow-[4px_4px_0_hsl(0_0%_0%/0.5)]">
        <DialogHeader>
          <DialogTitle className="font-title text-xs text-cactus pixel-text">📤 Config Teilen</DialogTitle>
        </DialogHeader>

        {}
        <div className="flex gap-1">
          <button
            onClick={() => setMode('export')}
            className={`mc-button flex-1 text-sm ${mode === 'export' ? 'mc-button-primary' : ''}`}
          >
            Exportieren
          </button>
          <button
            onClick={() => setMode('import')}
            className={`mc-button flex-1 text-sm ${mode === 'import' ? 'mc-button-primary' : ''}`}
          >
            Importieren
          </button>
        </div>

        {mode === 'export' ? (
          <div className="space-y-3">
            <p className="text-muted-foreground text-[11px]">
              Teile diesen Code oder Link mit anderen Spielern.
            </p>
            {buildings.length === 0 ? (
              <p className="text-yellow-400 text-[11px]">Keine Gebäude vorhanden.</p>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Code</label>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={exportCode}
                      className="mc-input w-full h-16 resize-none text-[11px] font-mono pr-16"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleCopy} className="mc-button mc-button-primary text-sm">
                    📋 Code kopieren
                  </button>
                  <button onClick={handleCopyLink} className="mc-button text-sm">
                    🔗 Link kopieren
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground opacity-50 text-center">
                  {buildings.length} Gebäude · {exportCode.length} Zeichen
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-muted-foreground text-[11px]">
              Füge einen Config-Code ein um eine Konfiguration zu laden.
            </p>
            <textarea
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              placeholder="Code hier einfügen..."
              className="mc-input w-full h-20 resize-none text-[11px] font-mono"
            />
            <button onClick={handleImport} className="mc-button mc-button-primary w-full text-sm">
              📥 Config laden
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
