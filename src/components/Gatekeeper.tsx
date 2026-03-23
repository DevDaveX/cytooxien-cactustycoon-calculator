
import { useState, useEffect, ReactNode } from "react";
import { getDeviceId, activateLicense, verifyToken } from "../license";

interface GatekeeperProps {
  children?: ReactNode; 
}

export default function Gatekeeper({ children }: GatekeeperProps) {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!import.meta.env.PROD) {
      setVerified(true);
      setLoading(false);
      return;
    }

    verifyToken().then(valid => {
      if (valid) setVerified(true);
      setLoading(false);
    });
  }, []);

  const handleActivate = async () => {
    try {
      setStatus("Aktivierung läuft...");
      await activateLicense(key);
      setVerified(true);
    } catch (err: any) {
      setStatus("Aktivierung fehlgeschlagen: " + err.message);
    }
  };

  if (loading) return <div className="text-center mt-40 text-lg text-gray-400">Lade...</div>;

  if (!verified) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
        <div className="bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] rounded-xl shadow-xl p-10 w-96">
          <h2 className="text-2xl font-bold mb-4 text-center">Beta-Zugang aktivieren</h2>
          <p className="mb-6 text-center">
            <span className="font-mono text-sm">Deine Device-ID: </span>
            <span className="font-bold break-all">{getDeviceId()}</span>
          </p>
          <input
            type="text"
            placeholder="Lizenzkey eingeben"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full p-3 rounded-md border border-gray-600 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] mb-4 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
          />
          <button
            onClick={handleActivate}
            className="w-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold py-3 rounded-md hover:bg-[hsl(var(--primary))]/80 transition"
          >
            Aktivieren
          </button>
          {status && <p className="mt-4 text-center text-red-500">{status}</p>}
        </div>
        <footer className="mt-10 text-sm text-gray-500">© 2026 Lizenzsystem - Noxera</footer>
      </div>
    );
  }

  return <>{children}</>;
}
