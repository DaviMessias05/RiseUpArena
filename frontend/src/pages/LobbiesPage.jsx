import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCaptcha } from '../lib/useCaptcha';
import {
  Swords,
  Loader2,
  Filter,
  Plus,
  X,
  Users,
  Gamepad2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Play,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'waiting', label: 'Aguardando' },
  { value: 'ready', label: 'Pronto' },
  { value: 'in_match', label: 'Em partida' },
  { value: 'finished', label: 'Finalizado' },
];

const STATUS_COLORS = {
  waiting: 'bg-accent',
  ready: 'bg-success',
  in_match: 'bg-primary',
  finished: 'bg-gray-500',
};

const STATUS_LABELS = {
  waiting: 'Aguardando',
  ready: 'Pronto',
  in_match: 'Em partida',
  finished: 'Finalizado',
};

const STATUS_ICONS = {
  waiting: Clock,
  ready: CheckCircle2,
  in_match: Play,
  finished: CheckCircle2,
};

function LobbyCard({ lobby }) {
  const StatusIcon = STATUS_ICONS[lobby.status] || Clock;

  return (
    <Link
      to={`/lobbies/${lobby.id}`}
      className="bg-surface rounded-xl border border-surface-light/50 hover:border-primary/50 transition-all duration-300 p-5 block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{lobby.name || 'Lobby'}</h3>
          <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
            <Gamepad2 size={14} />
            {lobby.game_name || 'Jogo'}
          </p>
        </div>
        <span
          className={`ml-3 px-2.5 py-1 text-xs font-semibold rounded text-white flex-shrink-0 flex items-center gap-1 ${
            STATUS_COLORS[lobby.status] || 'bg-gray-500'
          }`}
        >
          <StatusIcon size={12} />
          {STATUS_LABELS[lobby.status] || lobby.status}
        </span>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-400">
        <span className="flex items-center gap-1">
          <Users size={14} />
          {lobby.player_count || 0}/{lobby.max_players || '?'}
        </span>
        {lobby.creator_name && (
          <span className="text-xs">
            Host: <span className="text-white">{lobby.creator_name}</span>
          </span>
        )}
      </div>
    </Link>
  );
}

export default function LobbiesPage() {
  const { user } = useAuth();
  const { executeRecaptcha } = useCaptcha();

  const [lobbies, setLobbies] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterGame, setFilterGame] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [newLobby, setNewLobby] = useState({
    name: '',
    game_id: '',
    max_players: 10,
  });

  const fetchLobbies = useCallback(async () => {
    try {
      const data = await api.getLobbies();
      setLobbies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [lobbiesData, gamesData] = await Promise.all([
          api.getLobbies(),
          api.getGames(),
        ]);

        if (cancelled) return;

        setLobbies(Array.isArray(lobbiesData) ? lobbiesData : []);
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

  async function handleCreateLobby(e) {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      if (!executeRecaptcha) {
        throw new Error('reCAPTCHA não carregou. Tente novamente.');
      }

      const captchaToken = await executeRecaptcha('create_lobby');
      await api.verifyCaptcha(captchaToken, 'create_lobby');

      await api.createLobby({
        name: newLobby.name,
        game_id: newLobby.game_id,
        max_players: Number(newLobby.max_players),
      });

      setShowCreate(false);
      setNewLobby({ name: '', game_id: '', max_players: 10 });
      await fetchLobbies();
    } catch (err) {
      setCreateError(err.message || 'Erro ao criar lobby.');
    } finally {
      setCreateLoading(false);
    }
  }

  const filteredLobbies = lobbies.filter((lobby) => {
    if (filterGame && lobby.game_slug !== filterGame && lobby.game_id !== filterGame) return false;
    if (filterStatus && lobby.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Lobbies</h1>
          <p className="text-gray-400 mt-1">Encontre ou crie partidas rápidas</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors"
          >
            <Plus size={18} />
            Criar Lobby
          </button>
        )}
      </div>

      {/* Create Lobby Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreate(false)} />
          <div className="relative bg-surface rounded-2xl border border-surface-light/50 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Criar Lobby</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger">{createError}</p>
              </div>
            )}

            <form onSubmit={handleCreateLobby} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nome do Lobby
                </label>
                <input
                  type="text"
                  required
                  value={newLobby.name}
                  onChange={(e) => setNewLobby({ ...newLobby, name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nome do lobby"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Jogo
                </label>
                <select
                  required
                  value={newLobby.game_id}
                  onChange={(e) => setNewLobby({ ...newLobby, game_id: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione um jogo</option>
                  {games.map((game) => (
                    <option key={game.id || game.slug} value={game.id || game.slug}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Max. Jogadores
                </label>
                <input
                  type="number"
                  min={2}
                  max={20}
                  required
                  value={newLobby.max_players}
                  onChange={(e) => setNewLobby({ ...newLobby, max_players: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={createLoading}
                className="w-full py-3 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {createLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Lobby'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

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
      ) : filteredLobbies.length === 0 ? (
        <div className="text-center py-20">
          <Swords size={64} className="text-surface-lighter mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhum lobby encontrado</h2>
          <p className="text-gray-400">
            {filterGame || filterStatus
              ? 'Tente ajustar os filtros.'
              : 'Crie um lobby e convide seus amigos!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLobbies.map((lobby) => (
            <LobbyCard key={lobby.id} lobby={lobby} />
          ))}
        </div>
      )}
    </div>
  );
}
