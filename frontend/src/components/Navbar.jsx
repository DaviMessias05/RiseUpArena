import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield, ChevronDown, Crown, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const NAV_LINKS = [
  { label: 'Campeonatos', to: '/tournaments' },
  { label: 'Loja', to: '/store' },
  { label: 'VIP', to: '/vip', icon: Crown, highlight: true },
];

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setDropdownOpen(false);
      setMobileOpen(false);
      navigate('/');
    }
  };

  const displayName = profile?.username || profile?.display_name || 'Jogador';
  const userRC = profile?.rise_coins || 0;
  const userAC = profile?.arena_coins || 0;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-surface-light/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0">
            <img
              src="/logo.png"
              alt="Rise Up Arena"
              className="h-24 w-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  link.highlight
                    ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10'
                    : 'text-gray-300 hover:text-white hover:bg-surface-light'
                }`}
              >
                {link.icon && <link.icon size={14} />}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-light transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Coins size={14} className="text-accent" />
                    <span className="text-sm font-bold text-accent">{userRC.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-gray-500 font-medium">RC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins size={14} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">{userAC.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-gray-500 font-medium">AC</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-surface-light rounded-lg shadow-xl py-1 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-light transition-colors"
                    >
                      <User size={16} />
                      Perfil
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-surface-light transition-colors"
                      >
                        <Shield size={16} />
                        Painel Admin
                      </Link>
                    )}
                    <hr className="border-surface-light my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-danger hover:bg-surface-light transition-colors"
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#f28c38] to-[#e8611a] hover:from-[#f59e0b] hover:to-[#f28c38] text-white rounded-lg transition-all shadow-lg shadow-primary/25"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-surface-light transition-colors"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-light bg-surface/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-surface-light transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <hr className="border-surface-light my-2" />

            {user ? (
              <>
                <div className="flex items-center gap-4 px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Coins size={14} className="text-accent" />
                    <span className="text-sm font-bold text-accent">{userRC.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-gray-500 font-medium">RC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Coins size={14} className="text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">{userAC.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-gray-500 font-medium">AC</span>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-light transition-colors"
                >
                  <User size={16} />
                  Perfil
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-surface-light transition-colors"
                  >
                    <Shield size={16} />
                    Painel Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-danger hover:bg-surface-light transition-colors"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3 py-2">
                <Link
                  to="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-2 text-sm font-medium text-gray-300 border border-surface-light rounded-lg hover:text-white hover:bg-surface-light transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMobileOpen(false)}
                  className="block text-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-[#f28c38] to-[#e8611a] text-white rounded-lg transition-all"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
