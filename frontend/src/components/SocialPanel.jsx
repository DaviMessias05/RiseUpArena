import { Shield, LogOut } from 'lucide-react';

export default function SocialPanel({ profile, displayName, userRC = 0, userAC = 0, isAdmin, onLogout, onNavigate }) {
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="text-sm select-none">
      {/* User header */}
      <button
        onClick={() => onNavigate('/profile')}
        className="w-full px-4 py-3 border-b border-white/5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center flex-shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-sm font-bold text-white">{displayName[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-white text-sm leading-tight">{displayName}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">Ver perfil</p>
        </div>
      </button>

      {/* Actions */}
      <div className="py-1">
        {isAdmin && (
          <button
            onClick={() => onNavigate('/admin')}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Shield size={14} />
            Painel Admin
          </button>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors"
        >
          <LogOut size={14} />
          Sair
        </button>
      </div>
    </div>
  );
}
