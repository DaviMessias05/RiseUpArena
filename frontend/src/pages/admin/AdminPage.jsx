import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  Gamepad2,
  Trophy,
  ShoppingBag,
  Loader2,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Search,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import * as api from '../../lib/api';

const TABS = [
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'games', label: 'Jogos', icon: Gamepad2 },
  { id: 'tournaments', label: 'Campeonatos', icon: Trophy },
  { id: 'store', label: 'Loja', icon: ShoppingBag },
];

const ROLES = ['user', 'moderator', 'admin'];

function Alert({ type, message, onDismiss }) {
  if (!message) return null;
  const isSuccess = type === 'success';
  return (
    <div
      className={`mb-4 p-4 rounded-xl flex items-center gap-3 ${
        isSuccess ? 'bg-success/10 border border-success/30' : 'bg-danger/10 border border-danger/30'
      }`}
    >
      {isSuccess ? (
        <CheckCircle size={20} className="text-success flex-shrink-0" />
      ) : (
        <AlertCircle size={20} className="text-danger flex-shrink-0" />
      )}
      <p className={`text-sm flex-1 ${isSuccess ? 'text-success' : 'text-danger'}`}>{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-gray-400 hover:text-white">
          <X size={16} />
        </button>
      )}
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState('');
  const [changingRole, setChangingRole] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getAdminUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleRoleChange(userId, newRole) {
    setChangingRole(userId);
    setError(null);
    setSuccess(null);

    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setSuccess('Role atualizado com sucesso.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao atualizar role.');
    } finally {
      setChangingRole(null);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      !search ||
      (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={32} className="text-primary-light animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />
      <Alert type="error" message={error} onDismiss={() => setError(null)} />

      <div className="mb-4 relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full pl-10 pr-4 py-2.5 bg-surface-light border border-surface-lighter rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-light/50 bg-surface-light/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light/30">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt={u.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-lighter flex items-center justify-center">
                          <Users size={14} className="text-gray-400" />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">
                        {u.username || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{u.email || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        u.role === 'admin'
                          ? 'bg-danger/20 text-danger'
                          : u.role === 'moderator'
                          ? 'bg-accent/20 text-accent'
                          : 'bg-surface-lighter text-gray-400'
                      }`}
                    >
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role || 'user'}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      disabled={changingRole === u.id}
                      className="px-3 py-1.5 bg-surface-light border border-surface-lighter rounded-lg text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    >
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum usuario encontrado.</div>
        )}
      </div>
    </div>
  );
}

// ── Games Tab ─────────────────────────────────────────────────────────────────

function GamesTab() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    genre: '',
    banner_url: '',
  });

  const fetchGames = useCallback(async () => {
    try {
      const data = await api.getGames();
      setGames(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  function openCreateForm() {
    setEditingGame(null);
    setForm({ name: '', slug: '', description: '', genre: '', banner_url: '' });
    setShowForm(true);
  }

  function openEditForm(game) {
    setEditingGame(game);
    setForm({
      name: game.name || '',
      slug: game.slug || '',
      description: game.description || '',
      genre: game.genre || '',
      banner_url: game.banner_url || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingGame(null);
    setForm({ name: '', slug: '', description: '', genre: '', banner_url: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      if (editingGame) {
        await api.updateGame(editingGame.slug || editingGame.id, form);
        setSuccess('Jogo atualizado com sucesso.');
      } else {
        await api.createGame(form);
        setSuccess('Jogo criado com sucesso.');
      }
      closeForm();
      await fetchGames();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao salvar jogo.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(game) {
    if (!window.confirm(`Tem certeza que deseja excluir "${game.name}"?`)) return;

    setError(null);
    try {
      await api.deleteGame(game.slug || game.id);
      setSuccess('Jogo excluido com sucesso.');
      await fetchGames();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao excluir jogo.');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={32} className="text-primary-light animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />
      <Alert type="error" message={error} onDismiss={() => setError(null)} />

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreateForm}
          className="px-5 py-2 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Adicionar Jogo
        </button>
      </div>

      {showForm && (
        <div className="bg-surface rounded-xl border border-surface-light/50 p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingGame ? 'Editar Jogo' : 'Novo Jogo'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Slug</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="nome-do-jogo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Genero</label>
              <input
                type="text"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="FPS, MOBA, etc."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Banner URL</label>
              <input
                type="url"
                value={form.banner_url}
                onChange={(e) => setForm({ ...form, banner_url: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Descricao</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingGame ? 'Salvar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2 bg-surface-light hover:bg-surface-lighter text-white rounded-lg border border-surface-lighter transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-light/50 bg-surface-light/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Genero
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light/30">
              {games.map((game) => (
                <tr key={game.id || game.slug} className="hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">{game.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{game.slug}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{game.genre || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(game)}
                        className="p-1.5 text-gray-400 hover:text-primary-light transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(game)}
                        className="p-1.5 text-gray-400 hover:text-danger transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {games.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">Nenhum jogo cadastrado.</div>
        )}
      </div>
    </div>
  );
}

// ── Tournaments Tab ───────────────────────────────────────────────────────────

function TournamentsTab() {
  const [tournaments, setTournaments] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    game_id: '',
    description: '',
    max_players: 16,
    prize_pool: '',
    start_date: '',
    status: 'open',
  });

  const fetchData = useCallback(async () => {
    try {
      const [tournamentsData, gamesData] = await Promise.all([
        api.getTournaments(),
        api.getGames(),
      ]);
      setTournaments(Array.isArray(tournamentsData) ? tournamentsData : []);
      setGames(Array.isArray(gamesData) ? gamesData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openCreateForm() {
    setEditingTournament(null);
    setForm({
      name: '',
      game_id: '',
      description: '',
      max_players: 16,
      prize_pool: '',
      start_date: '',
      status: 'open',
    });
    setShowForm(true);
  }

  function openEditForm(tournament) {
    setEditingTournament(tournament);
    setForm({
      name: tournament.name || '',
      game_id: tournament.game_id || '',
      description: tournament.description || '',
      max_players: tournament.max_players || 16,
      prize_pool: tournament.prize_pool || '',
      start_date: tournament.start_date ? tournament.start_date.slice(0, 16) : '',
      status: tournament.status || 'open',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingTournament(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const payload = {
        ...form,
        max_players: Number(form.max_players),
      };

      if (editingTournament) {
        await api.updateTournament(editingTournament.id, payload);
        setSuccess('Campeonato atualizado com sucesso.');
      } else {
        await api.createTournament(payload);
        setSuccess('Campeonato criado com sucesso.');
      }
      closeForm();
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao salvar campeonato.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(tournament) {
    if (!window.confirm(`Tem certeza que deseja excluir "${tournament.name}"?`)) return;

    setError(null);
    try {
      await api.deleteTournament(tournament.id);
      setSuccess('Campeonato excluido com sucesso.');
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao excluir campeonato.');
    }
  }

  const statusLabels = { open: 'Aberto', in_progress: 'Em andamento', finished: 'Finalizado' };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={32} className="text-primary-light animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />
      <Alert type="error" message={error} onDismiss={() => setError(null)} />

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreateForm}
          className="px-5 py-2 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Criar Campeonato
        </button>
      </div>

      {showForm && (
        <div className="bg-surface rounded-xl border border-surface-light/50 p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingTournament ? 'Editar Campeonato' : 'Novo Campeonato'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Jogo</label>
              <select
                required
                value={form.game_id}
                onChange={(e) => setForm({ ...form, game_id: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione</option>
                {games.map((g) => (
                  <option key={g.id || g.slug} value={g.id || g.slug}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Max. Jogadores
              </label>
              <input
                type="number"
                min={2}
                required
                value={form.max_players}
                onChange={(e) => setForm({ ...form, max_players: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Premiacao</label>
              <input
                type="text"
                value={form.prize_pool}
                onChange={(e) => setForm({ ...form, prize_pool: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="500 creditos"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Data de Inicio
              </label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="open">Aberto</option>
                <option value="in_progress">Em andamento</option>
                <option value="finished">Finalizado</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Descricao</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingTournament ? 'Salvar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2 bg-surface-light hover:bg-surface-lighter text-white rounded-lg border border-surface-lighter transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-light/50 bg-surface-light/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Jogo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Jogadores
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light/30">
              {tournaments.map((t) => (
                <tr key={t.id} className="hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-3 text-white text-sm font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{t.game_name || t.game_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        t.status === 'open'
                          ? 'bg-success/20 text-success'
                          : t.status === 'in_progress'
                          ? 'bg-warning/20 text-warning'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {statusLabels[t.status] || t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {t.current_players || 0}/{t.max_players || '?'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(t)}
                        className="p-1.5 text-gray-400 hover:text-primary-light transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 text-gray-400 hover:text-danger transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tournaments.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhum campeonato cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Store Tab ─────────────────────────────────────────────────────────────────

function StoreTab() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
  });

  const fetchProducts = useCallback(async () => {
    try {
      const data = await api.getStoreProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreateForm() {
    setEditingProduct(null);
    setForm({ name: '', description: '', price: 0, image_url: '' });
    setShowForm(true);
  }

  function openEditForm(product) {
    setEditingProduct(product);
    setForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price || 0,
      image_url: product.image_url || '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormLoading(true);
    setError(null);

    try {
      const payload = { ...form, price: Number(form.price) };

      if (editingProduct) {
        await api.updateStoreProduct(editingProduct.id, payload);
        setSuccess('Produto atualizado com sucesso.');
      } else {
        await api.createStoreProduct(payload);
        setSuccess('Produto criado com sucesso.');
      }
      closeForm();
      await fetchProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao salvar produto.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Tem certeza que deseja excluir "${product.name}"?`)) return;

    setError(null);
    try {
      await api.deleteStoreProduct(product.id);
      setSuccess('Produto excluido com sucesso.');
      await fetchProducts();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Erro ao excluir produto.');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={32} className="text-primary-light animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <Alert type="success" message={success} onDismiss={() => setSuccess(null)} />
      <Alert type="error" message={error} onDismiss={() => setError(null)} />

      <div className="flex justify-end mb-4">
        <button
          onClick={openCreateForm}
          className="px-5 py-2 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          Adicionar Produto
        </button>
      </div>

      {showForm && (
        <div className="bg-surface rounded-xl border border-surface-light/50 p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">
            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Preco (creditos)
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Imagem URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Descricao</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={formLoading}
                className="px-5 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                {formLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {editingProduct ? 'Salvar' : 'Criar'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-5 py-2 bg-surface-light hover:bg-surface-lighter text-white rounded-lg border border-surface-lighter transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-light/50 bg-surface-light/30">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Produto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Preco
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descricao
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-light/30">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-surface-light/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-surface-lighter flex items-center justify-center">
                          <ShoppingBag size={14} className="text-gray-400" />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-accent text-sm font-bold">
                    {product.price || 0}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm truncate max-w-[200px]">
                    {product.description || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditForm(product)}
                        className="p-1.5 text-gray-400 hover:text-primary-light transition-colors"
                        title="Editar"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-1.5 text-gray-400 hover:text-danger transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products.length === 0 && (
          <div className="p-8 text-center text-gray-400 text-sm">
            Nenhum produto cadastrado.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={28} className="text-primary-light" />
        <div>
          <h1 className="text-3xl font-bold text-white">Painel Admin</h1>
          <p className="text-gray-400 text-sm">Gerencie a plataforma Rise Up</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/25'
                  : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter border border-surface-lighter'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'games' && <GamesTab />}
      {activeTab === 'tournaments' && <TournamentsTab />}
      {activeTab === 'store' && <StoreTab />}
    </div>
  );
}
