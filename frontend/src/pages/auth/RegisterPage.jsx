import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCaptcha } from '../../lib/useCaptcha';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../lib/api';

function formatCpf(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isValidCpf(cpf) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;

  return true;
}

export default function RegisterPage() {
  const { user, loading: authLoading, signUp, signInWithGoogle } = useAuth();
  const { executeRecaptcha } = useCaptcha();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function validateForm() {
    if (fullName.trim().length < 3) {
      return 'O nome completo deve ter pelo menos 3 caracteres.';
    }
    if (fullName.trim().split(/\s+/).length < 2) {
      return 'Informe seu nome completo (nome e sobrenome).';
    }
    if (!isValidCpf(cpf)) {
      return 'CPF invalido.';
    }
    if (username.length < 3) {
      return 'O nome de usuario deve ter pelo menos 3 caracteres.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'O nome de usuario deve conter apenas letras, numeros e underline.';
    }
    if (username.length > 20) {
      return 'O nome de usuario deve ter no maximo 20 caracteres.';
    }
    if (password.length < 6) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (password !== confirmPassword) {
      return 'As senhas nao coincidem.';
    }
    if (!acceptedTerms) {
      return 'Voce deve aceitar os Termos de Servico para continuar.';
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      if (executeRecaptcha) {
        const captchaToken = await executeRecaptcha('register');
        await api.verifyCaptcha(captchaToken, 'register');
      }
      await signUp(email, password, username, fullName, cpf.replace(/\D/g, ''));
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleRegister() {
    setError(null);
    setGoogleLoading(true);

    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Erro ao registrar com Google.');
      setGoogleLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-surface rounded-2xl border border-surface-light/50 p-8">
            <CheckCircle size={64} className="text-success mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Conta criada!</h1>
            <p className="text-gray-400 mb-6">
              Verifique seu email para confirmar sua conta. Enviamos um link de verificacao para{' '}
              <span className="text-white font-medium">{email}</span>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Nao recebeu o email? Verifique sua pasta de spam.
            </p>
            <Link
              to="/auth/login"
              className="inline-block px-8 py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors"
            >
              Ir para Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black tracking-wider">
            <span className="text-white">RISE </span>
            <span className="text-primary-light">UP</span>
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Criar sua conta</h1>
          <p className="mt-1 text-gray-400">Entre na arena competitiva</p>
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
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome completo
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-1.5">
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                required
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className={inputClass}
                placeholder="000.000.000-00"
                maxLength={14}
                inputMode="numeric"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome de usuario
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClass}
                placeholder="meu_nick"
                maxLength={20}
              />
              <p className="mt-1 text-xs text-gray-500">
                Letras, numeros e underline. 3-20 caracteres.
              </p>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                  placeholder="Minimo 6 caracteres"
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Repita a senha"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-xs text-danger">As senhas nao coincidem.</p>
              )}
            </div>

            <div className="flex items-start gap-3">
              <input
                id="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-surface-lighter bg-surface-light text-primary focus:ring-primary focus:ring-2 cursor-pointer accent-primary"
              />
              <label htmlFor="terms" className="text-sm text-gray-400 cursor-pointer">
                Li e aceito os{' '}
                <Link to="/terms" className="text-primary-light hover:text-primary font-medium transition-colors underline">
                  Termos de Servico
                </Link>{' '}
                e a{' '}
                <Link to="/privacy" className="text-primary-light hover:text-primary font-medium transition-colors underline">
                  Politica de Privacidade
                </Link>.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar Conta'
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
            onClick={handleGoogleRegister}
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
            Registrar com Google
          </button>

          <p className="mt-6 text-center text-sm text-gray-400">
            Ja tem uma conta?{' '}
            <Link to="/auth/login" className="text-primary-light hover:text-primary font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
