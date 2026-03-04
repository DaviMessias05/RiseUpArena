import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, AlertCircle, UserCheck } from 'lucide-react';
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

export default function CompleteProfilePage() {
  const { user, profile, isProfileComplete, loading: authLoading, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth/login', { replace: true });
    }
    if (!authLoading && isProfileComplete === true) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, isProfileComplete, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  function validateForm() {
    if (displayName.trim().length < 3) {
      return 'O nome completo deve ter pelo menos 3 caracteres.';
    }
    if (displayName.trim().split(/\s+/).length < 2) {
      return 'Informe seu nome completo (nome e sobrenome).';
    }
    if (!isValidCpf(cpf)) {
      return 'CPF inválido.';
    }
    if (username.length < 3) {
      return 'O nome de usuário deve ter pelo menos 3 caracteres.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'O nome de usuário deve conter apenas letras, números e underline.';
    }
    if (username.length > 20) {
      return 'O nome de usuário deve ter no máximo 20 caracteres.';
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
      const cpfDigits = cpf.replace(/\D/g, '');

      await api.apiPost('/auth/complete-profile', {
        cpf: cpfDigits,
        username,
        display_name: displayName.trim(),
      });

      // Recarregar perfil no contexto
      await fetchProfile(user.id);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao completar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
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
          <h1 className="mt-4 text-2xl font-bold text-white">Complete seu perfil</h1>
          <p className="mt-1 text-gray-400">Preencha as informações obrigatórias para continuar</p>
        </div>

        <div className="bg-surface rounded-2xl border border-surface-light/50 p-8">
          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3">
              <AlertCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{error}</p>
            </div>
          )}

          <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-xl">
            <div className="flex items-start gap-3">
              <UserCheck size={20} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-accent font-medium">Conta conectada via Google</p>
                <p className="text-xs text-gray-400 mt-1">
                  {user?.email} — Complete os dados abaixo para acessar a plataforma.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome completo
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome de usuário
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
                Letras, números e underline. 3-20 caracteres.
              </p>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                'Completar Perfil'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
