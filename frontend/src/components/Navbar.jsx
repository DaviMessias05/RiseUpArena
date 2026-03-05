import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield, ChevronDown, Bell, MessageCircle, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SocialPanel from './SocialPanel';
import FriendsBar from './FriendsBar';

const NAV_LINKS = [
  { label: 'Campeonatos', to: '/tournaments' },
  { label: 'Lobbies', to: '/lobbies' },
  { label: 'Ranking', to: '/rankings' },
  { label: 'Loja', to: '/store' },
  { label: 'VIP', to: '/vip', highlight: true },
];

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const socialRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (socialRef.current && !socialRef.current.contains(e.target)) {
        setSocialOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSocialOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await signOut(); } catch {}
    setSocialOpen(false);
    setMobileOpen(false);
    navigate('/');
  };

  const displayName = profile?.username || 'Jogador';
  const userRC = profile?.rise_coins ?? profile?.credits ?? 0;
  const userAC = profile?.arena_coins ?? 0;
  const avatarUrl = profile?.avatar_url;

  const isActive = (to) =>
    to === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(to);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0f1116] border-b border-white/5 h-14">
        <div className="h-full px-4 lg:px-6 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center mr-2">
            <img
              src="/logo.png"
              alt="Rise Up Arena"
              className="h-9 w-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-0.5 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-md ${
                  isActive(link.to)
                    ? link.highlight
                      ? 'text-yellow-400 bg-yellow-400/5'
                      : 'text-white bg-white/5'
                    : link.highlight
                    ? 'text-yellow-400/60 hover:text-yellow-400 hover:bg-yellow-400/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
              <Bell size={18} />
            </button>

            {user ? (
              <>
                {/* User profile + social panel */}
                <div ref={socialRef} className="relative ml-1">
                  <button
                    onClick={() => setSocialOpen(prev => !prev)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors ${
                      socialOpen ? 'bg-white/8' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center flex-shrink-0">
                      {avatarUrl ? (
                        <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <span className="text-xs font-bold text-white">{displayName[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-start leading-none">
                      <span className="text-sm font-medium text-gray-200">{displayName}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">
                          <Coins size={10} className="text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-400">{userRC.toLocaleString('pt-BR')}</span>
                          <span className="text-[9px] text-gray-600 ml-0.5">RC</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <Coins size={10} className="text-emerald-400" />
                          <span className="text-[10px] font-bold text-emerald-400">{userAC.toLocaleString('pt-BR')}</span>
                          <span className="text-[9px] text-gray-600 ml-0.5">AC</span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform duration-200 ${socialOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Social Panel Dropdown */}
                  {socialOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#13161d] border border-white/8 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[calc(100vh-70px)] overflow-y-auto">
                      <SocialPanel
                        profile={profile}
                        displayName={displayName}
                        userRC={userRC}
                        userAC={userAC}
                        isAdmin={isAdmin}
                        onLogout={handleLogout}
                        onNavigate={(to) => { setSocialOpen(false); navigate(to); }}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/auth/login"
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#f28c38] to-[#e8611a] hover:opacity-90 text-white rounded-lg transition-all"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>


          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(prev => !prev)}
            className="md:hidden ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Friends Bar — só aparece quando logado */}
      {user && <FriendsBar isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} />}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-[#0f1116] border-b border-white/5">
          <div className="px-4 py-3 space-y-0.5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  link.highlight
                    ? 'text-yellow-400 hover:bg-yellow-400/5'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-white/5 my-2" />

            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span className="text-xs font-bold text-white">{displayName[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{displayName}</span>
                </div>
                <div className="flex items-center gap-4 px-3 pb-2">
                  <div className="flex items-center gap-1">
                    <Coins size={13} className="text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{userRC.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-gray-600">RC</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins size={13} className="text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">{userAC.toLocaleString('pt-BR')}</span>
                    <span className="text-[10px] text-gray-600">AC</span>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <User size={15} />
                  Perfil
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Shield size={15} />
                    Painel Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  to="/auth/login"
                  className="block text-center px-4 py-2.5 text-sm font-medium text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth/register"
                  className="block text-center px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-[#f28c38] to-[#e8611a] text-white rounded-lg"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
