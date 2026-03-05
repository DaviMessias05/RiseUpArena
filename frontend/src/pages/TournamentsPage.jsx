import { Link } from 'react-router-dom';
import { Trophy, Users, Loader2, Filter, Plus, Calendar, Gamepad2, RefreshCw, Clock } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCachedData } from '../hooks/useCache';
import { fetchTournaments, fetchGames } from '../lib/fetchers';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'open', label: 'Aberto' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'finished', label: 'Finalizado' },
];

const STATUS_COLORS = {
  open: 'bg-success',
  in_progress: 'bg-warning',
  finished: 'bg-gray-500',
};

const STATUS_LABELS = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  finished: 'Finalizado',
};

const FORMAT_LABELS = {
  single_elimination: 'Eliminação simples',
  double_elimination: 'Eliminação dupla',
};

function formatTournamentDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const day = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${day}, ${time}`;
}

const PRIZE_TRUNCATE = 15;

function PrizeOverlay({ prize, tournamentId }) {
  const isLong = prize.length > PRIZE_TRUNCATE;

  return (
    <div className="absolute top-2 right-2 max-w-[45%]">
      <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
        <span className="text-[10px] text-gray-400">Premiação: </span>
        <span className="text-[10px] text-yellow-400 font-semibold">
          {isLong ? prize.slice(0, PRIZE_TRUNCATE) + '…' : prize}
        </span>
        {isLong && (
          <Link
            to={`/tournaments/${tournamentId}#prize`}
            onClick={e => e.stopPropagation()}
            className="block text-[9px] text-blue-400 hover:text-blue-300 mt-0.5 underline"
          >
            ver detalhes
          </Link>
        )}
      </div>
    </div>
  );
}

function TournamentCard({ tournament }) {
  return (
    <Link
      to={`/tournaments/${tournament.id}`}
      className="bg-surface rounded-xl border border-surface-light/50 hover:border-primary/50 transition-all duration-300 overflow-hidden block"
    >
      {/* Banner */}
      <div className="relative aspect-[16/9] bg-surface-light overflow-hidden">
        {tournament.banner_url ? (
          <img
            src={tournament.banner_url}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-light to-surface">
            <Trophy size={48} className="text-surface-lighter" />
          </div>
        )}
        {tournament.start_date && (
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
              <Clock size={10} className="text-gray-300" />
              <span className="text-[10px] text-gray-200 font-medium">{formatTournamentDate(tournament.start_date)}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
              <span className="text-[10px] text-gray-400">Nível</span>
              <span className="text-[10px] text-white font-semibold">{tournament.min_level ?? 1} → {tournament.max_level ?? 10}</span>
            </div>
          </div>
        )}
        {tournament.prize_pool && (
          <PrizeOverlay prize={tournament.prize_pool} tournamentId={tournament.id} />
        )}
        {/* Game icon overlay */}
        <div className="absolute bottom-3 left-3 w-8 h-8 rounded-lg bg-surface/80 backdrop-blur-sm flex items-center justify-center border border-surface-light/50">
          <Gamepad2 size={16} className="text-gray-300" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-base font-bold text-white truncate">{tournament.name}</h3>

        {/* Details line */}
        <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
          <span>{tournament.game_name || 'Jogo'}</span>
          <span className="text-gray-600">•</span>
          <span>{tournament.team_size}vs{tournament.team_size}</span>
          <span className="text-gray-600">•</span>
          <span>{tournament.max_players || '?'} slots</span>
          {tournament.format && (
            <>
              <span className="text-gray-600">•</span>
              <span>{FORMAT_LABELS[tournament.format] || tournament.format}</span>
            </>
          )}
        </p>

        {/* Status badge */}
        <div className="mt-3">
          <span
            className={`inline-block px-3 py-1.5 text-xs font-semibold rounded-lg text-white ${
              STATUS_COLORS[tournament.status] || 'bg-gray-500'
            }`}
          >
            {STATUS_LABELS[tournament.status] || tournament.status}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TournamentsPage() {
  const { isAdmin } = useAuth();
  const { data: tournaments, loading: tLoading, refetch: refetchTournaments } = useCachedData('tournaments', fetchTournaments);
  const { data: games, loading: gLoading } = useCachedData('games', fetchGames);
  const [filterGame, setFilterGame] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const loading = tLoading || gLoading;

  const filteredTournaments = (tournaments || []).filter((t) => {
    if (filterGame && t.game_slug !== filterGame && t.game_id !== filterGame) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Campeonatos</h1>
          <p className="text-gray-400 mt-1">Participe de competições e conquiste prêmios</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetchTournaments}
            disabled={loading}
            className="p-2.5 bg-surface-light hover:bg-surface-lighter text-gray-400 hover:text-white rounded-xl border border-surface-lighter transition-colors disabled:opacity-50"
            title="Atualizar"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors"
            >
              <Plus size={18} />
              Criar Campeonato
            </Link>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
            className="px-4 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os jogos</option>
            {(games || []).map((game) => (
              <option key={game.id || game.slug} value={game.slug || game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={40} className="text-primary-light animate-spin" />
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={64} className="text-surface-lighter mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhum campeonato encontrado</h2>
          <p className="text-gray-400">
            {filterGame || filterStatus
              ? 'Tente ajustar os filtros.'
              : 'Novos campeonatos serão anunciados em breve.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  );
}
