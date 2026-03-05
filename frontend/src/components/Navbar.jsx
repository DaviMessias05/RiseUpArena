import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield, ChevronDown, Bell, Coins, Trophy, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
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
  const { notifications, unreadCount, markAllRead, dismissNotification } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const socialRef = useRef(null);
  const bellRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (socialRef.current && !socialRef.current.contains(e.target)) {
        setSocialOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setSocialOpen(false);
    setBellOpen(false);
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

          {/* Desktop Nav Links — só logado */}
          {user && (
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
          )}

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            {user ? (
              <>
                {/* Notification Bell */}
                <div ref={bellRef} className="relative">
                  <button
                    onClick={() => { setBellOpen(p => !p); if (!bellOpen) markAllRead(); }}
                    className={`relative p-2 rounded-lg transition-colors ${bellOpen ? 'text-white bg-white/8' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </button>

                  {bellOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#13161d] border border-white/8 rounded-xl shadow-2xl overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                        <span className="text-sm font-bold text-white">Notificações</span>
                        {notifications.length > 0 && (
                          <button onClick={() => { notifications.forEach(n => dismissNotification(n.id)); }} className="text-[11px] text-gray-500 hover:text-gray-300">
                            Limpar tudo
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Bell size={28} className="text-gray-700" />
                            <p className="text-gray-500 text-sm">Sem notificações</p>
                          </div>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="flex items-start gap-3 px-4 py-3 border-b border-white/4 hover:bg-white/3 transition-colors">
                              <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
                                n.type === 'tournament_start' ? 'bg-primary/20' :
                                n.type === 'checkin' ? 'bg-yellow-500/20' : 'bg-white/5'
                              }`}>
                                {n.type === 'tournament_start' ? <Trophy size={13} className="text-primary-light" /> : <Clock size={13} className="text-yellow-400" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white leading-tight">{n.title}</p>
                                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>
                                {n.tournamentId && (
                                  <button
                                    onClick={() => { setBellOpen(false); navigate(`/tournaments/${n.tournamentId}`); }}
                                    className="text-[11px] text-primary-light mt-1 hover:underline"
                                  >
                                    Ver torneio →
                                  </button>
                                )}
                              </div>
                              <button onClick={() => dismissNotification(n.id)} className="text-gray-600 hover:text-gray-400 flex-shrink-0 mt-0.5">
                                <X size={13} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

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


          {/* Mobile: login buttons (não logado) ou hamburger (logado) */}
          {user ? (
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="md:hidden ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          ) : (
            <div className="md:hidden ml-auto flex items-center gap-2">
              <Link
                to="/auth/login"
                className="px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                Entrar
              </Link>
              <Link
                to="/auth/register"
                className="px-3 py-1.5 text-sm font-semibold bg-gradient-to-r from-[#f28c38] to-[#e8611a] hover:opacity-90 text-white rounded-lg transition-all"
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Friends Bar — só aparece quando logado */}
      {user && <FriendsBar isOpen={friendsOpen} onClose={() => setFriendsOpen(false)} />}

      {/* Mobile Menu — só logado */}
      {user && mobileOpen && (
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
