import { useState, useEffect } from 'react';
import { Trophy, Loader2, Users, Gamepad2 } from 'lucide-react';
import * as api from '../lib/api';

function RankBadge({ position }) {
  if (position === 1) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-yellow-500/20 text-yellow-400 font-bold text-sm border border-yellow-500/30">
        1
      </span>
    );
  }
  if (position === 2) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-300/20 text-gray-300 font-bold text-sm border border-gray-300/30">
        2
      </span>
    );
  }
  if (position === 3) {
    return (
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-orange-400/20 text-orange-400 font-bold text-sm border border-orange-400/30">
        3
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-surface-lighter text-gray-400 font-bold text-sm">
      {position}
    </span>
  );
}

function getTierLabel(rating) {
  if (rating >= 2000) return { label: 'Challenger', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  if (rating >= 1700) return { label: 'Diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
  if (rating >= 1400) return { label: 'Platinum', color: 'text-teal-400', bg: 'bg-teal-400/10' };
  if (rating >= 1100) return { label: 'Gold', color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
  if (rating >= 800) return { label: 'Silver', color: 'text-gray-300', bg: 'bg-gray-300/10' };
  return { label: 'Bronze', color: 'text-orange-400', bg: 'bg-orange-400/10' };
}

export default function RankingsPage() {
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchGames() {
      try {
        const data = await api.getGames();
        if (cancelled) return;

        const gameList = Array.isArray(data) ? data : [];
        setGames(gameList);

        if (gameList.length > 0) {
          const firstSlug = gameList[0].slug || gameList[0].id;
          setSelectedGame(firstSlug);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchGames();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedGame) return;

    let cancelled = false;

    async function fetchRankings() {
      setRankingsLoading(true);
      try {
        const data = await api.getRankings(selectedGame);
        if (!cancelled) {
          setRankings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) setRankings([]);
      } finally {
        if (!cancelled) setRankingsLoading(false);
      }
    }

    fetchRankings();
    return () => { cancelled = true; };
  }, [selectedGame]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-danger text-lg mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-surface-light hover:bg-surface-lighter text-white rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Rankings</h1>
        <p className="text-gray-400 mt-1">Os melhores jogadores da plataforma</p>
      </div>

      {/* Game Selector */}
      {games.length === 0 ? (
        <div className="text-center py-20">
          <Gamepad2 size={64} className="text-surface-lighter mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Nenhum jogo disponível</h2>
          <p className="text-gray-400">Rankings aparecerão quando houver jogos na plataforma.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {games.map((game) => {
              const slug = game.slug || game.id;
              const isActive = selectedGame === slug;
              return (
                <button
                  key={game.id || game.slug}
                  onClick={() => setSelectedGame(slug)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg shadow-primary/25'
                      : 'bg-surface-light text-gray-400 hover:text-white hover:bg-surface-lighter border border-surface-lighter'
                  }`}
                >
                  <Gamepad2 size={16} />
                  {game.name}
                </button>
              );
            })}
          </div>

          {/* Rankings Table */}
          {rankingsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="text-primary-light animate-spin" />
            </div>
          ) : rankings.length === 0 ? (
            <div className="text-center py-20">
              <Trophy size={64} className="text-surface-lighter mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Nenhum jogador ranqueado</h2>
              <p className="text-gray-400">Jogue partidas para aparecer no ranking.</p>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-light/50 bg-surface-light/30">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        Posição
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jogador
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        V/D
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        <tr
                          key={player.user_id || idx}
                          className={`hover:bg-surface-light/50 transition-colors ${
                            idx < 3 ? 'bg-surface-light/10' : ''
                          }`}
                        >
                          <td className="px-6 py-4">
                            <RankBadge position={idx + 1} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {player.avatar_url ? (
                                <img
                                  src={player.avatar_url}
                                  alt={player.username}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-surface-lighter"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-surface-lighter flex items-center justify-center border-2 border-surface-lighter">
                                  <Users size={16} className="text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="text-white font-medium">
                                  {player.username || 'Jogador'}
                                </div>
                                {player.display_name && player.display_name !== player.username && (
                                  <div className="text-xs text-gray-500">
                                    {player.display_name}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-white font-bold text-lg">
                              {player.rating || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-2.5 py-1 rounded text-xs font-semibold ${tier.color} ${tier.bg}`}
                            >
                              {tier.label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-success font-medium">{wins}</span>
                            <span className="text-gray-500 mx-1">/</span>
                            <span className="text-danger font-medium">{losses}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-surface-light rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    winRate >= 60
                                      ? 'bg-success'
                                      : winRate >= 50
                                      ? 'bg-primary'
                                      : winRate >= 40
                                      ? 'bg-warning'
                                      : 'bg-danger'
                                  }`}
                                  style={{ width: `${winRate}%` }}
                                />
                              </div>
                              <span
                                className={`text-sm font-medium ${
                                  winRate >= 50 ? 'text-success' : 'text-gray-400'
                                }`}
                              >
                                {winRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
