import { Link } from 'react-router-dom';
import { Gamepad2, Trophy, Users, Swords, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCachedData } from '../hooks/useCache';
import { fetchGames, fetchTournaments, fetchPlatformStats } from '../lib/fetchers';

function GameCard({ game }) {
  return (
    <Link
      to={`/games/${game.slug}`}
      className="group bg-surface rounded-xl overflow-hidden border border-surface-light/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-video bg-surface-light relative overflow-hidden">
        {game.banner_url ? (
          <img
            src={game.banner_url}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Gamepad2 size={48} className="text-surface-lighter" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <span className="px-2 py-1 bg-primary/80 text-white text-xs font-semibold rounded">
            {game.genre || 'Esports'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-bold text-white group-hover:text-primary-light transition-colors">
          {game.name}
        </h3>
        <p className="text-sm text-gray-400 mt-1 line-clamp-2">
          {game.description || 'Compete agora neste jogo!'}
        </p>
      </div>
    </Link>
  );
}

function TournamentCard({ tournament }) {
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
    <Link
      to={`/tournaments`}
      className="bg-surface rounded-xl p-4 border border-surface-light/50 hover:border-primary/50 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-white">{tournament.name}</h4>
        <span
          className={`px-2 py-0.5 text-xs font-semibold rounded text-white ${
            statusColors[tournament.status] || 'bg-gray-500'
          }`}
        >
          {statusLabels[tournament.status] || tournament.status}
        </span>
      </div>
      <p className="text-sm text-gray-400">{tournament.game_name || 'Campeonato'}</p>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users size={14} />
          {tournament.max_players || '?'} jogadores
        </span>
        <span className="flex items-center gap-1">
          <Trophy size={14} />
          {tournament.prize_pool || 'A definir'}
        </span>
      </div>
    </Link>
  );
}

function StatBlock({ icon: Icon, value, label }) {
  return (
    <div className="text-center">
      <Icon size={32} className="text-primary-light mx-auto mb-2" />
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { data: games, loading: gamesLoading } = useCachedData('games', fetchGames, 10 * 60 * 1000);
  const { data: tournaments, loading: tournamentsLoading } = useCachedData('tournaments', fetchTournaments, 5 * 60 * 1000);
  const { data: stats } = useCachedData('platform_stats', fetchPlatformStats, 5 * 60 * 1000);

  const loading = gamesLoading || tournamentsLoading;
  const displayGames = (games || []).slice(0, 3);
  const displayTournaments = (tournaments || []).slice(0, 4);
  const displayStats = stats || { users: 0, matches: 0, tournaments: 0 };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8611a]/15 via-bg to-bg" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#f28c38]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#e8611a]/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center">
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#f28c38] to-[#e8611a] bg-clip-text text-transparent">RISE UP</span>
              <span className="text-gray-300"> ARENA</span>
            </h1>
            <p className="mt-4 text-xl sm:text-2xl text-gray-400 font-medium max-w-2xl mx-auto">
              Plataforma competitiva de esports
            </p>
            <p className="mt-2 text-gray-500 max-w-xl mx-auto">
              Participe de lobbies, campeonatos e suba no ranking. Prove que você é o melhor.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/lobbies"
                    className="px-8 py-3 bg-gradient-to-r from-[#f28c38] to-[#e8611a] hover:from-[#f59e0b] hover:to-[#f28c38] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#e8611a]/25 flex items-center gap-2"
                  >
                    <Swords size={20} />
                    Entrar em um Lobby
                  </Link>
                  <Link
                    to="/tournaments"
                    className="px-8 py-3 bg-surface-light hover:bg-surface-lighter text-white font-bold rounded-xl border border-surface-lighter transition-colors flex items-center gap-2"
                  >
                    <Trophy size={20} />
                    Ver Campeonatos
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/register"
                    className="px-8 py-3 bg-gradient-to-r from-[#f28c38] to-[#e8611a] hover:from-[#f59e0b] hover:to-[#f28c38] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#e8611a]/25 flex items-center gap-2"
                  >
                    Criar Conta
                    <ArrowRight size={20} />
                  </Link>
                  <Link
                    to="/auth/login"
                    className="px-8 py-3 bg-surface-light hover:bg-surface-lighter text-white font-bold rounded-xl border border-surface-lighter transition-colors"
                  >
                    Já tenho conta
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-surface-light/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8">
            <StatBlock icon={Users} value={displayStats.users} label="Jogadores" />
            <StatBlock icon={Swords} value={displayStats.matches} label="Partidas" />
            <StatBlock icon={Trophy} value={displayStats.tournaments} label="Campeonatos" />
          </div>
        </div>
      </section>

      {/* Featured Games Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">Jogos em Destaque</h2>
              <p className="text-gray-400 mt-1">Escolha seu jogo e comece a competir</p>
            </div>
            <Link
              to="/games"
              className="hidden sm:flex items-center gap-1 text-primary-light hover:text-primary font-medium transition-colors"
            >
              Ver todos
              <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="text-primary-light animate-spin" />
            </div>
          ) : displayGames.length === 0 ? (
            <div className="text-center py-16">
              <Gamepad2 size={48} className="text-surface-lighter mx-auto mb-4" />
              <p className="text-gray-400">Nenhum jogo disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayGames.map((game) => (
                <GameCard key={game.id || game.slug} game={game} />
              ))}
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link
              to="/games"
              className="text-primary-light hover:text-primary font-medium transition-colors"
            >
              Ver todos os jogos
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Tournaments Section */}
      <section className="py-20 bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white">Campeonatos Recentes</h2>
              <p className="text-gray-400 mt-1">Participe e conquiste prêmios</p>
            </div>
            <Link
              to="/tournaments"
              className="hidden sm:flex items-center gap-1 text-primary-light hover:text-primary font-medium transition-colors"
            >
              Ver todos
              <ArrowRight size={18} />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="text-primary-light animate-spin" />
            </div>
          ) : displayTournaments.length === 0 ? (
            <div className="text-center py-16">
              <Trophy size={48} className="text-surface-lighter mx-auto mb-4" />
              <p className="text-gray-400">Nenhum campeonato disponível.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayTournaments.map((t) => (
                <TournamentCard key={t.id} tournament={t} />
              ))}
            </div>
          )}

          <div className="sm:hidden mt-6 text-center">
            <Link
              to="/tournaments"
              className="text-primary-light hover:text-primary font-medium transition-colors"
            >
              Ver todos os campeonatos
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Pronto para competir?
            </h2>
            <p className="mt-4 text-gray-400 text-lg">
              Crie sua conta gratuitamente e entre na arena agora mesmo.
            </p>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 mt-8 px-10 py-4 bg-gradient-to-r from-[#f28c38] to-[#e8611a] hover:from-[#f59e0b] hover:to-[#f28c38] text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-[#e8611a]/25"
            >
              Começar Agora
              <ArrowRight size={22} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
