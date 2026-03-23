import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '@/lib/authClient';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token);
    }
    navigate('/', { replace: true });
  }, [params, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <p className="text-lg">Anmeldung wird verarbeitet...</p>
    </div>
  );
}
