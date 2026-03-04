import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Loader2, Filter, Plus, Calendar, Gamepad2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';

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

function TournamentCard({ tournament }) {
  return (
    <div className="bg-surface rounded-xl border border-surface-light/50 hover:border-primary/50 transition-all duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">{tournament.name}</h3>
            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
              <Gamepad2 size={14} />
              {tournament.game_name || 'Jogo'}
            </p>
          </div>
          <span
            className={`ml-3 px-2.5 py-1 text-xs font-semibold rounded text-white flex-shrink-0 ${
              STATUS_COLORS[tournament.status] || 'bg-gray-500'
            }`}
          >
            {STATUS_LABELS[tournament.status] || tournament.status}
          </span>
        </div>

        {tournament.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">{tournament.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users size={14} />
            {tournament.current_players || 0}/{tournament.max_players || '?'}
          </span>
          {tournament.prize_pool && (
            <span className="flex items-center gap-1">
              <Trophy size={14} />
              {tournament.prize_pool}
            </span>
          )}
          {tournament.start_date && (
            <span className="flex items-center gap-1">
              <Calendar size={14} />
              {new Date(tournament.start_date).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TournamentsPage() {
  const { isAdmin } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterGame, setFilterGame] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [tournamentsData, gamesData] = await Promise.all([
          api.getTournaments(),
          api.getGames(),
        ]);

        if (cancelled) return;

        setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
        setGames(Array.isArray(gamesData) ? gamesData : []);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    if (filterGame && t.game_slug !== filterGame && t.game_id !== filterGame) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Campeonatos</h1>
          <p className="text-gray-400 mt-1">Participe de competicoes e conquiste premios</p>
        </div>
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
            {games.map((game) => (
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
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-danger mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-surface-light hover:bg-surface-lighter text-white rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="text-center py-20">
          <Trophy size={64} className="text-surface-lighter mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhum campeonato encontrado</h2>
          <p className="text-gray-400">
            {filterGame || filterStatus
              ? 'Tente ajustar os filtros.'
              : 'Novos campeonatos serao anunciados em breve.'}
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
