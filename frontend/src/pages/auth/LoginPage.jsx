import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCaptcha } from '../../lib/useCaptcha';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../lib/api';

export default function LoginPage() {
  const { user, loading: authLoading, signIn, signInWithGoogle } = useAuth();
  const { executeRecaptcha } = useCaptcha();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (executeRecaptcha) {
        const captchaToken = await executeRecaptcha('login');
        await api.verifyCaptcha(captchaToken, 'login');
      }
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Erro ao fazer login com Google.');
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black tracking-wider">
            <span className="text-white">RISE </span>
            <span className="text-primary-light">UP</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Entrar na sua conta</h1>
          <p className="mt-1 text-gray-400">Bem-vindo de volta!</p>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-light/50 p-8">
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                  placeholder="Sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-lighter" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-surface text-gray-500">ou</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 bg-surface-light hover:bg-surface-lighter disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl border border-surface-lighter transition-colors flex items-center justify-center gap-3"
          >
            {googleLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Login com Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Não tem uma conta?{' '}
            <Link to="/auth/register" className="text-primary-light hover:text-primary font-medium transition-colors">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
