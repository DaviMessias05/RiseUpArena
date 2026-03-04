import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Gamepad2,
  Loader2,
  Trophy,
  Users,
  BarChart3,
  Medal,
  ArrowLeft,
  Swords,
} from 'lucide-react';
import * as api from '../lib/api';

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: Gamepad2 },
  { id: 'rankings', label: 'Rankings', icon: Trophy },
  { id: 'tournaments', label: 'Campeonatos', icon: Medal },
  { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
];

function RankBadge({ position }) {
  if (position === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm">
        1
      </span>
    );
  }
  if (position === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-300/20 text-gray-300 font-bold text-sm">
        2
      </span>
    );
  }
  if (position === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-400/20 text-orange-400 font-bold text-sm">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-lighter text-gray-400 font-bold text-sm">
      {position}
    </span>
  );
}

function getTierLabel(rating) {
  if (rating >= 2000) return { label: 'Challenger', color: 'text-yellow-400' };
  if (rating >= 1700) return { label: 'Diamond', color: 'text-cyan-400' };
  if (rating >= 1400) return { label: 'Platinum', color: 'text-teal-400' };
  if (rating >= 1100) return { label: 'Gold', color: 'text-yellow-500' };
  if (rating >= 800) return { label: 'Silver', color: 'text-gray-300' };
  return { label: 'Bronze', color: 'text-orange-400' };
}

export default function GameDetailPage() {
  const { slug } = useParams();
  const [game, setGame] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [gameData, rankingsData, tournamentsData] = await Promise.allSettled([
          api.getGame(slug),
          api.getRankings(slug),
          api.getTournaments(),
        ]);

        if (cancelled) return;

        if (gameData.status === 'fulfilled') {
          setGame(gameData.value);
        } else {
          throw new Error('Jogo não encontrado.');
        }

        if (rankingsData.status === 'fulfilled') {
          setRankings(Array.isArray(rankingsData.value) ? rankingsData.value.slice(0, 10) : []);
        }

        if (tournamentsData.status === 'fulfilled') {
          const allTournaments = Array.isArray(tournamentsData.value) ? tournamentsData.value : [];
          setTournaments(
            allTournaments.filter(
              (t) =>
                t.game_slug === slug || t.game_id === gameData.value?.id
            )
          );
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-danger text-lg mb-4">{error || 'Jogo não encontrado.'}</p>
        <Link
          to="/games"
          className="flex items-center gap-2 text-primary-light hover:text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar para Jogos
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Banner */}
      <div className="relative h-64 sm:h-80 bg-surface-light overflow-hidden">
        {game.banner_url ? (
          <img
            src={game.banner_url}
            alt={game.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 size={80} className="text-surface-lighter" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/games"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            Jogos
          </Link>
          <h1 className="text-4xl sm:text-5xl font-black text-white">{game.name}</h1>
          {game.genre && (
            <span className="inline-block mt-2 px-3 py-1 bg-primary/80 text-white text-sm font-semibold rounded">
              {game.genre}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-16 z-30 bg-surface/80 backdrop-blur-xl border-b border-surface-light/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white hover:bg-surface-light'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="bg-surface rounded-xl border border-surface-light/50 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Sobre o Jogo</h2>
              <p className="text-gray-300 leading-relaxed">
                {game.description || 'Sem descrição disponível para este jogo.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6 text-center">
                <Users size={28} className="text-primary-light mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{rankings.length}</div>
                <div className="text-sm text-gray-400">Jogadores ranqueados</div>
              </div>
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6 text-center">
                <Trophy size={28} className="text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{tournaments.length}</div>
                <div className="text-sm text-gray-400">Campeonatos</div>
              </div>
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6 text-center">
                <Swords size={28} className="text-success mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">{game.match_count || 0}</div>
                <div className="text-sm text-gray-400">Partidas jogadas</div>
              </div>
            </div>

            {rankings.length > 0 && (
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6">
                <h2 className="text-xl font-bold text-white mb-4">Top 3 Jogadores</h2>
                <div className="space-y-3">
                  {rankings.slice(0, 3).map((player, idx) => {
                    const tier = getTierLabel(player.rating || 0);
                    return (
                      <div
                        key={player.user_id || idx}
                        className="flex items-center gap-4 p-3 bg-surface-light rounded-lg"
                      >
                        <RankBadge position={idx + 1} />
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {player.avatar_url ? (
                            <img
                              src={player.avatar_url}
                              alt={player.username}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-lighter flex items-center justify-center">
                              <Users size={18} className="text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate">
                              {player.username || 'Jogador'}
                            </div>
                            <div className={`text-xs ${tier.color}`}>{tier.label}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{player.rating || 0}</div>
                          <div className="text-xs text-gray-500">pontos</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'rankings' && (
          <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
            <div className="p-6 border-b border-surface-light/50">
              <h2 className="text-xl font-bold text-white">Rankings - Top 10</h2>
            </div>
            {rankings.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy size={48} className="text-surface-lighter mx-auto mb-4" />
                <p className="text-gray-400">Nenhum jogador ranqueado ainda neste jogo.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-light/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jogador
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        V/D
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Win Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-light/30">
                    {rankings.map((player, idx) => {
                      const tier = getTierLabel(player.rating || 0);
                      const wins = player.wins || 0;
                      const losses = player.losses || 0;
                      const total = wins + losses;
                      const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
                      return (
                        <tr key={player.user_id || idx} className="hover:bg-surface-light/50 transition-colors">
                          <td className="px-6 py-4">
                            <RankBadge position={idx + 1} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {player.avatar_url ? (
                                <img
                                  src={player.avatar_url}
                                  alt={player.username}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-surface-lighter flex items-center justify-center">
                                  <Users size={14} className="text-gray-400" />
                                </div>
                              )}
                              <span className="text-white font-medium">
                                {player.username || 'Jogador'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-white font-bold">{player.rating || 0}</td>
                          <td className="px-6 py-4">
                            <span className={`font-medium ${tier.color}`}>{tier.label}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-success">{wins}</span>
                            <span className="text-gray-500"> / </span>
                            <span className="text-danger">{losses}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={winRate >= 50 ? 'text-success' : 'text-gray-400'}>
                              {winRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Campeonatos</h2>
            {tournaments.length === 0 ? (
              <div className="bg-surface rounded-xl border border-surface-light/50 p-12 text-center">
                <Medal size={48} className="text-surface-lighter mx-auto mb-4" />
                <p className="text-gray-400">Nenhum campeonato para este jogo ainda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tournaments.map((t) => {
                  const statusColors = {
                    open: 'bg-success',
                    in_progress: 'bg-warning',
                    finished: 'bg-gray-500',
                  };
                  const statusLabels = {
                    open: 'Aberto',
                    in_progress: 'Em andamento',
                    finished: 'Finalizado',
                  };

                  return (
                    <div
                      key={t.id}
                      className="bg-surface rounded-xl p-5 border border-surface-light/50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-white">{t.name}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded text-white ${
                            statusColors[t.status] || 'bg-gray-500'
                          }`}
                        >
                          {statusLabels[t.status] || t.status}
                        </span>
                      </div>
                      {t.description && (
                        <p className="text-sm text-gray-400 mb-3">{t.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {t.max_players || '?'} jogadores
                        </span>
                        {t.prize_pool && (
                          <span className="flex items-center gap-1">
                            <Trophy size={14} />
                            {t.prize_pool}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white mb-4">Estatísticas do Jogo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6 text-center">
                <div className="text-3xl font-bold text-white">{rankings.length}</div>
                <div className="text-sm text-gray-400 mt-1">Jogadores Ranqueados</div>
              </div>
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6 text-center">
                <div className="text-3xl font-bold text-white">{tournaments.length}</div>
                <div className="text-sm text-gray-400 mt-1">Campeonatos</div>
              </div>
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6 text-center">
                <div className="text-3xl font-bold text-white">{game.match_count || 0}</div>
                <div className="text-sm text-gray-400 mt-1">Total de Partidas</div>
              </div>
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6 text-center">
                <div className="text-3xl font-bold text-white">
                  {rankings.length > 0
                    ? Math.round(
                        rankings.reduce((sum, p) => sum + (p.rating || 0), 0) / rankings.length
                      )
                    : 0}
                </div>
                <div className="text-sm text-gray-400 mt-1">Rating Médio</div>
              </div>
            </div>

            {rankings.length > 0 && (
              <div className="bg-surface rounded-xl border border-surface-light/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Distribuição de Tiers</h3>
                <div className="space-y-3">
                  {['Challenger', 'Diamond', 'Platinum', 'Gold', 'Silver', 'Bronze'].map(
                    (tierName) => {
                      const count = rankings.filter((p) => {
                        const tier = getTierLabel(p.rating || 0);
                        return tier.label === tierName;
                      }).length;
                      const percentage =
                        rankings.length > 0
                          ? Math.round((count / rankings.length) * 100)
                          : 0;
                      const tierInfo = getTierLabel(
                        tierName === 'Challenger'
                          ? 2000
                          : tierName === 'Diamond'
                          ? 1700
                          : tierName === 'Platinum'
                          ? 1400
                          : tierName === 'Gold'
                          ? 1100
                          : tierName === 'Silver'
                          ? 800
                          : 0
                      );

                      return (
                        <div key={tierName} className="flex items-center gap-3">
                          <span className={`w-24 text-sm font-medium ${tierInfo.color}`}>
                            {tierName}
                          </span>
                          <div className="flex-1 h-4 bg-surface-light rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-400 w-16 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
