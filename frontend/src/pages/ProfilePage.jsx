import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  User,
  Edit3,
  Save,
  X,
  Loader2,
  Gamepad2,
  Trophy,
  Swords,
  Clock,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../lib/api';

function getTierLabel(rating) {
  if (rating >= 2000) return { label: 'Challenger', color: 'text-yellow-400' };
  if (rating >= 1700) return { label: 'Diamond', color: 'text-cyan-400' };
  if (rating >= 1400) return { label: 'Platinum', color: 'text-teal-400' };
  if (rating >= 1100) return { label: 'Gold', color: 'text-yellow-500' };
  if (rating >= 800) return { label: 'Silver', color: 'text-gray-300' };
  return { label: 'Bronze', color: 'text-orange-400' };
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-surface rounded-xl border border-surface-light/50 p-5 text-center">
      <Icon size={24} className={`mx-auto mb-2 ${color || 'text-primary-light'}`} />
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function MatchHistoryRow({ match }) {
  const isWin = match.result === 'win';
  const isDraw = match.result === 'draw';

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        isWin
          ? 'bg-success/5 border-success/20'
          : isDraw
          ? 'bg-surface-light border-surface-lighter'
          : 'bg-danger/5 border-danger/20'
      }`}
    >
      <div
        className={`w-14 text-center font-bold text-sm py-1 rounded ${
          isWin
            ? 'bg-success/20 text-success'
            : isDraw
            ? 'bg-gray-500/20 text-gray-400'
            : 'bg-danger/20 text-danger'
        }`}
      >
        {isWin ? 'W' : isDraw ? 'D' : 'L'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">
          {match.game_name || 'Partida'}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {match.created_at
            ? new Date(match.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : ''}
        </div>
      </div>
      {match.score && (
        <div className="text-sm text-gray-400 font-medium">{match.score}</div>
      )}
      {match.rating_change !== undefined && match.rating_change !== null && (
        <div
          className={`text-sm font-bold ${
            match.rating_change > 0
              ? 'text-success'
              : match.rating_change < 0
              ? 'text-danger'
              : 'text-gray-400'
          }`}
        >
          {match.rating_change > 0 ? '+' : ''}{match.rating_change}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const { userId: paramUserId } = useParams();
  const { user, profile: authProfile, updateProfile } = useAuth();

  const isOwnProfile = !paramUserId || (user && paramUserId === user.id);
  const targetUserId = paramUserId || user?.id;

  const [profileData, setProfileData] = useState(null);
  const [gameStats, setGameStats] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: '',
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [profileResult, statsResult, matchesResult] = await Promise.allSettled([
          isOwnProfile && authProfile ? Promise.resolve(authProfile) : api.getProfile(targetUserId),
          api.getProfileStats(targetUserId),
          api.getProfileMatches(targetUserId),
        ]);

        if (cancelled) return;

        if (profileResult.status === 'fulfilled') {
          setProfileData(profileResult.value);
          setEditForm({
            display_name: profileResult.value?.display_name || '',
            bio: profileResult.value?.bio || '',
            avatar_url: profileResult.value?.avatar_url || '',
          });
        } else {
          throw new Error('Perfil não encontrado.');
        }

        if (statsResult.status === 'fulfilled') {
          setGameStats(Array.isArray(statsResult.value) ? statsResult.value : []);
        }

        if (matchesResult.status === 'fulfilled') {
          setMatches(Array.isArray(matchesResult.value) ? matchesResult.value : []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [targetUserId, isOwnProfile, authProfile]);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);

    try {
      const updated = await updateProfile({
        display_name: editForm.display_name || null,
        bio: editForm.bio || null,
        avatar_url: editForm.avatar_url || null,
      });
      setProfileData((prev) => ({ ...prev, ...updated }));
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Erro ao salvar perfil.');
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (!targetUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <User size={64} className="text-surface-lighter mb-4" />
        <p className="text-gray-400 text-lg">Faça login para ver seu perfil.</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-danger text-lg mb-4">{error || 'Perfil não encontrado.'}</p>
      </div>
    );
  }

  const totalWins = gameStats.reduce((sum, s) => sum + (s.wins || 0), 0);
  const totalLosses = gameStats.reduce((sum, s) => sum + (s.losses || 0), 0);
  const totalGames = totalWins + totalLosses;

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-surface rounded-2xl border border-surface-light/50 overflow-hidden mb-8">
        <div className="h-32 bg-gradient-to-r from-primary-dark via-primary to-primary-light" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="relative">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt={profileData.username}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-surface bg-surface"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-surface-light border-4 border-surface flex items-center justify-center">
                  <User size={36} className="text-gray-400" />
                </div>
              )}
              {isOwnProfile && editing && (
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-surface">
                  <Camera size={14} className="text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">
                {profileData.display_name || profileData.username}
              </h1>
              <p className="text-gray-400">@{profileData.username}</p>
              {profileData.bio && (
                <p className="text-sm text-gray-300 mt-1">{profileData.bio}</p>
              )}
            </div>
            {isOwnProfile && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="px-5 py-2 bg-surface-light hover:bg-surface-lighter text-white font-medium rounded-xl border border-surface-lighter transition-colors flex items-center gap-2 self-start sm:self-auto"
              >
                <Edit3 size={16} />
                Editar Perfil
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isOwnProfile && editing && (
        <div className="bg-surface rounded-xl border border-surface-light/50 p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Editar Perfil</h2>

          {saveError && (
            <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-danger flex-shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{saveError}</p>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Nome de exibição
              </label>
              <input
                type="text"
                value={editForm.display_name}
                onChange={(e) => setEditForm({ ...editForm, display_name: e.target.value })}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Seu nome de exibicao"
                maxLength={30}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                URL do Avatar
              </label>
              <input
                type="url"
                value={editForm.avatar_url}
                onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="https://exemplo.com/avatar.png"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio</label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-surface-light border border-surface-lighter rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Conte algo sobre você..."
                maxLength={200}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 bg-primary hover:bg-primary-light disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
              >
                {saveLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Salvar
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setSaveError(null);
                  setEditForm({
                    display_name: profileData.display_name || '',
                    bio: profileData.bio || '',
                    avatar_url: profileData.avatar_url || '',
                  });
                }}
                className="px-6 py-2.5 bg-surface-light hover:bg-surface-lighter text-white rounded-xl border border-surface-lighter transition-colors flex items-center gap-2"
              >
                <X size={18} />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Swords} label="Partidas" value={totalGames} color="text-primary-light" />
        <StatCard icon={Trophy} label="Vitórias" value={totalWins} color="text-success" />
        <StatCard
          icon={Gamepad2}
          label="Jogos"
          value={gameStats.length}
          color="text-accent"
        />
        <StatCard
          icon={Clock}
          label="Win Rate"
          value={totalGames > 0 ? `${Math.round((totalWins / totalGames) * 100)}%` : '0%'}
          color="text-cyan-400"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-primary text-white'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Estatísticas por Jogo
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-primary text-white'
              : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter'
          }`}
        >
          Histórico de Partidas
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          {gameStats.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-light/50 p-12 text-center">
              <Gamepad2 size={48} className="text-surface-lighter mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma estatística disponível.</p>
              <p className="text-sm text-gray-500 mt-1">Jogue partidas para ver suas stats!</p>
            </div>
          ) : (
            gameStats.map((stat) => {
              const wins = stat.wins || 0;
              const losses = stat.losses || 0;
              const total = wins + losses;
              const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
              const tier = getTierLabel(stat.rating || 0);

              return (
                <div
                  key={stat.game_slug || stat.game_id}
                  className="bg-surface rounded-xl border border-surface-light/50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Gamepad2 size={20} className="text-primary-light" />
                      <h3 className="text-lg font-bold text-white">
                        {stat.game_name || 'Jogo'}
                      </h3>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${tier.color}`}>
                      {tier.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Rating</div>
                      <div className="text-xl font-bold text-white">{stat.rating || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Vitórias</div>
                      <div className="text-xl font-bold text-success">{wins}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Derrotas</div>
                      <div className="text-xl font-bold text-danger">{losses}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Win Rate</div>
                      <div className={`text-xl font-bold ${winRate >= 50 ? 'text-success' : 'text-gray-400'}`}>
                        {winRate}%
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-3">
          {matches.length === 0 ? (
            <div className="bg-surface rounded-xl border border-surface-light/50 p-12 text-center">
              <Swords size={48} className="text-surface-lighter mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma partida registrada.</p>
              <p className="text-sm text-gray-500 mt-1">Participe de lobbies e campeonatos!</p>
            </div>
          ) : (
            matches.map((match, idx) => (
              <MatchHistoryRow key={match.id || idx} match={match} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
