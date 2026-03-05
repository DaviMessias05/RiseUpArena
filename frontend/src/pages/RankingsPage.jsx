import { useState, useEffect, useCallback } from 'react';
import { Trophy, Loader2, Users, Gamepad2, RefreshCw } from 'lucide-react';
import { useCachedData } from '../hooks/useCache';
import { fetchGames, fetchRankings } from '../lib/fetchers';

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

function getLevelInfo(rp) {
  if (rp >= 3000) return { level: 10, label: 'Nível 10', color: 'text-red-400', bg: 'bg-red-400/10' };
  if (rp >= 2501) return { level: 9, label: 'Nível 9', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  if (rp >= 2101) return { level: 8, label: 'Nível 8', color: 'text-purple-400', bg: 'bg-purple-400/10' };
  if (rp >= 1701) return { level: 7, label: 'Nível 7', color: 'text-purple-300', bg: 'bg-purple-300/10' };
  if (rp >= 1301) return { level: 6, label: 'Nível 6', color: 'text-blue-400', bg: 'bg-blue-400/10' };
  if (rp >= 901)  return { level: 5, label: 'Nível 5', color: 'text-cyan-400', bg: 'bg-cyan-400/10' };
  if (rp >= 601)  return { level: 4, label: 'Nível 4', color: 'text-green-400', bg: 'bg-green-400/10' };
  if (rp >= 301)  return { level: 3, label: 'Nível 3', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
  if (rp >= 101)  return { level: 2, label: 'Nível 2', color: 'text-gray-300', bg: 'bg-gray-300/10' };
  return { level: 1, label: 'Nível 1', color: 'text-gray-400', bg: 'bg-gray-400/10' };
}

export default function RankingsPage() {
  const { data: games, loading: gamesLoading, error: gamesError } = useCachedData('games', fetchGames);
  const [selectedGame, setSelectedGame] = useState('');
  const [rankings, setRankings] = useState([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Set first game as selected when games load
  useEffect(() => {
    if (games && games.length > 0 && !selectedGame) {
      setSelectedGame(games[0].slug || games[0].id);
    }
  }, [games, selectedGame]);

  async function loadRankings() {
    if (!selectedGame) return;
    setRankingsLoading(true);
    try {
      const data = await fetchRankings(selectedGame);
      setRankings(data);
    } catch {
      setRankings([]);
    } finally {
      setRankingsLoading(false);
    }
  }

  // Fetch rankings when game changes
  useEffect(() => {
    loadRankings();
  }, [selectedGame]);

  if (gamesLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (gamesError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-danger text-lg mb-4">{gamesError.message}</p>
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Rankings</h1>
          <p className="text-gray-400 mt-1">Os melhores jogadores da plataforma</p>
        </div>
        <button
          onClick={loadRankings}
          disabled={rankingsLoading}
          className="p-2.5 bg-surface-light hover:bg-surface-lighter text-gray-400 hover:text-white rounded-xl border border-surface-lighter transition-colors disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw size={18} className={rankingsLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Game Selector */}
      {(games || []).length === 0 ? (
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
                        RP
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nível
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
                      const tier = getLevelInfo(player.rating || 0);
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
