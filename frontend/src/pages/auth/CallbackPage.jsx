import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function CallbackPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (session) {
        navigate('/', { replace: true });
      } else {
        const timer = setTimeout(() => {
          navigate('/auth/login', { replace: true });
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [session, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="text-primary-light animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Autenticando...</h1>
        <p className="text-gray-400">Estamos verificando sua sessao. Aguarde um momento.</p>
      </div>
    </div>
  );
}
