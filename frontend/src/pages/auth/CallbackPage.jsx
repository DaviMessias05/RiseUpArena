import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function CallbackPage() {
  const { session, loading, isProfileComplete } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  function getRedirectPath() {
    return isProfileComplete ? '/' : '/auth/complete-profile';
  }

  // Processa o callback OAuth diretamente
  useEffect(() => {
    async function handleCallback() {
      try {
        // Supabase detecta os tokens na URL hash automaticamente
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Callback session error:', sessionError.message);
          setError('Erro ao autenticar. Tente novamente.');
          setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
          return;
        }

        if (data?.session) {
          // Aguarda o AuthContext processar o perfil antes de redirecionar
          return;
        }

        // Se não tem sessão ainda, aguarda o onAuthStateChange resolver
      } catch (err) {
        console.error('Callback error:', err);
        setError('Erro inesperado. Redirecionando...');
        setTimeout(() => navigate('/auth/login', { replace: true }), 3000);
      }
    }

    handleCallback();
  }, [navigate]);

  // Fallback: se o contexto detectar a sessão e o perfil
  useEffect(() => {
    if (!loading && session) {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [session, loading, isProfileComplete, navigate]);

  // Timeout de segurança
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!session) {
        navigate('/auth/login', { replace: true });
      }
    }, 10000);
    return () => clearTimeout(timer);
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="text-primary-light animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Autenticando...</h1>
        <p className="text-gray-400">Estamos verificando sua sessão. Aguarde um momento.</p>
      </div>
    </div>
  );
}
