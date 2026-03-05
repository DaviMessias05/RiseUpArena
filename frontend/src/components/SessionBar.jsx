import { useNavigate } from 'react-router-dom';
import { Swords, ChevronRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';

export default function SessionBar() {
  const { activeSession } = useNotifications();
  const navigate = useNavigate();

  if (!activeSession) return null;

  return (
    <div className="fixed left-0 top-14 bottom-0 w-14 z-40 flex flex-col items-center pt-4 gap-3 bg-[#0f1116] border-r border-white/5">
      {/* Active session button */}
      <button
        onClick={() => navigate(`/match-room/${activeSession.tournamentId}`)}
        className="group relative w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center hover:bg-primary/30 transition-all"
        title="Sessão Atual"
      >
        <Swords size={18} className="text-primary-light" />
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-xl border border-primary/60 animate-ping opacity-30" />

        {/* Tooltip on hover */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-[#13161d] border border-white/10 rounded-lg px-3 py-2 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          <p className="text-[11px] font-bold text-white">Sessão Atual</p>
          <p className="text-[10px] text-gray-400 mt-0.5 max-w-40 truncate">{activeSession.tournamentName}</p>
          {activeSession.round && (
            <p className="text-[10px] text-primary-light mt-0.5">Rodada {activeSession.round}</p>
          )}
          <div className="flex items-center gap-1 mt-1 text-primary-light">
            <span className="text-[10px]">Entrar na sala</span>
            <ChevronRight size={10} />
          </div>
        </div>
      </button>

      {/* Label vertical */}
      <div className="flex-1 flex items-center">
        <span
          className="text-[9px] font-bold text-gray-600 uppercase tracking-widest"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
        >
          Sessão Atual
        </span>
      </div>
    </div>
  );
}
