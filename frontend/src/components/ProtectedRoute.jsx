import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireVerified = true,
}) {
  const { user, isAdmin, isEmailVerified, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (requireVerified && !isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg px-4">
        <div className="bg-surface rounded-xl border border-surface-light p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-8 h-8 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Verificacao de Email Necessaria
          </h2>
          <p className="text-gray-400 mb-6">
            Verifique seu email para acessar esta pagina. Confira sua caixa de entrada (e spam) pelo link de verificacao que enviamos no cadastro.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors"
          >
            Ja Verifiquei Meu Email
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
