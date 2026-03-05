import { Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, Swords, ArrowRight, Loader2, Lock, Target, Flame, Medal, Star, Crown, Zap, Award, Gamepad2, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCachedData } from '../hooks/useCache';
import { fetchTournaments, fetchUserRankings, fetchGames } from '../lib/fetchers';

const ACHIEVEMENTS = [
  { id: 1, name: 'Primeira Vitória', description: 'Vença sua primeira partida', icon: Trophy, color: 'from-green-500 to-emerald-600', rarity: 'Comum' },
  { id: 2, name: 'Sequência de 5', description: 'Vença 5 partidas seguidas', icon: Flame, color: 'from-orange-500 to-red-600', rarity: 'Raro' },
  { id: 3, name: 'Veterano', description: 'Jogue 100 partidas', icon: Medal, color: 'from-blue-500 to-blue-700', rarity: 'Raro' },
  { id: 4, name: 'Campeão', description: 'Vença um campeonato', icon: Crown, color: 'from-yellow-500 to-amber-600', rarity: 'Épico' },
  { id: 5, name: 'Imbatível', description: 'Vença 10 partidas seguidas', icon: Zap, color: 'from-purple-500 to-purple-700', rarity: 'Épico' },
  { id: 6, name: 'Lenda', description: 'Alcance o Nível 10 no ranking', icon: Star, color: 'from-red-500 to-rose-700', rarity: 'Lendário' },
  { id: 7, name: 'Precisão Mortal', description: 'Win rate acima de 80% em 20+ partidas', icon: Target, color: 'from-cyan-500 to-teal-600', rarity: 'Épico' },
  { id: 8, name: 'Elite', description: 'Fique no top 3 do ranking', icon: Award, color: 'from-amber-400 to-yellow-600', rarity: 'Lendário' },
];

const RARITY_COLORS = {
  'Comum': 'text-gray-400 bg-gray-400/10',
  'Raro': 'text-blue-400 bg-blue-400/10',
  'Épico': 'text-purple-400 bg-purple-400/10',
  'Lendário': 'text-yellow-400 bg-yellow-400/10',
};

function AchievementCard({ achievement }) {
  const Icon = achievement.icon;
  const rarityClass = RARITY_COLORS[achievement.rarity] || 'text-gray-400 bg-gray-400/10';

  return (
    <div className="bg-surface rounded-xl border border-surface-light/50 p-4 relative overflow-hidden opacity-60 grayscale hover:opacity-80 hover:grayscale-[50%] transition-all duration-300">
      <div className="absolute top-3 right-3">
        <Lock size={14} className="text-gray-500" />
      </div>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center mb-3 opacity-50`}>
        <Icon size={24} className="text-white" />
      </div>
      <h4 className="font-bold text-white text-sm">{achievement.name}</h4>
      <p className="text-xs text-gray-500 mt-1">{achievement.description}</p>
      <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold ${rarityClass}`}>
        {achievement.rarity}
      </span>
    </div>
  );
}

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

function TournamentCard({ tournament }) {
  return (
    <Link
      to="/tournaments"
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
            <Trophy size={40} className="text-surface-lighter" />
          </div>
        )}
        <div className="absolute bottom-2 left-2 w-7 h-7 rounded-lg bg-surface/80 backdrop-blur-sm flex items-center justify-center border border-surface-light/50">
          <Gamepad2 size={14} className="text-gray-300" />
        </div>
      </div>

      <div className="p-3">
        {tournament.start_date && (
          <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mb-1">
            <Clock size={11} />
            {formatTournamentDate(tournament.start_date)}
          </p>
        )}
        <h4 className="font-bold text-white text-sm truncate">{tournament.name}</h4>
        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
          <span>{tournament.game_name || 'Jogo'}</span>
          <span className="text-gray-600">•</span>
          <span>{tournament.max_players || '?'} slots</span>
        </p>
        <div className="mt-2">
          <span
            className={`inline-block px-2.5 py-1 text-[11px] font-semibold rounded-lg text-white ${
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

function getLevelInfo(rp) {
  if (rp >= 3000) return { level: 10, label: 'Nível 10', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' };
  if (rp >= 2501) return { level: 9, label: 'Nível 9', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' };
  if (rp >= 2101) return { level: 8, label: 'Nível 8', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30' };
  if (rp >= 1701) return { level: 7, label: 'Nível 7', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' };
  if (rp >= 1301) return { level: 6, label: 'Nível 6', color: 'text-lime-400', bg: 'bg-lime-400/10', border: 'border-lime-400/30' };
  if (rp >= 901)  return { level: 5, label: 'Nível 5', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/30' };
  if (rp >= 601)  return { level: 4, label: 'Nível 4', color: 'text-teal-400', bg: 'bg-teal-400/10', border: 'border-teal-400/30' };
  if (rp >= 301)  return { level: 3, label: 'Nível 3', color: 'text-cyan-400', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30' };
  if (rp >= 101)  return { level: 2, label: 'Nível 2', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30' };
  return { level: 1, label: 'Nível 1', color: 'text-slate-400', bg: 'bg-slate-400/10', border: 'border-slate-400/30' };
}

const LEVEL_THRESHOLDS = [0, 101, 301, 601, 901, 1301, 1701, 2101, 2501, 3000];

const RING_COLOR_MAP = {
  'text-slate-400': '#94a3b8',
  'text-blue-400': '#60a5fa',
  'text-cyan-400': '#22d3ee',
  'text-teal-400': '#2dd4bf',
  'text-emerald-400': '#34d399',
  'text-lime-400': '#a3e635',
  'text-yellow-400': '#facc15',
  'text-amber-400': '#fbbf24',
  'text-orange-400': '#fb923c',
  'text-red-500': '#ef4444',
};

function LevelRing({ level, rp, color }) {
  const size = 96;
  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const currentMin = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextMin = LEVEL_THRESHOLDS[level] ?? 3000;
  const progress = level >= 10 ? 1 : Math.min((rp - currentMin) / (nextMin - currentMin), 1);
  const dashOffset = circumference * (1 - progress);
  const stroke = RING_COLOR_MAP[color] || '#94a3b8';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1e293b" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none" stroke={stroke} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`text-3xl font-black ${color} z-10`}>{level}</span>
    </div>
  );
}

function GameLevelCard({ ranking }) {
  const rp = ranking.rating || 0;
  const tier = getLevelInfo(rp);
  const wins = ranking.wins || 0;
  const losses = ranking.losses || 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className={`bg-surface rounded-xl border ${tier.border} p-4 flex flex-col items-center gap-2`}>
      <span className="text-xs font-semibold text-gray-400">{ranking.game_name}</span>
      <LevelRing level={tier.level} rp={rp} color={tier.color} />
      <span className={`text-xs font-semibold ${tier.color}`}>{tier.label}</span>
      <div className="text-[11px] text-gray-500">{rp} RP • {winRate}% WR</div>
    </div>
  );
}

function UnrankedGameCard({ game }) {
  const tier = getLevelInfo(0);
  return (
    <div className={`bg-surface rounded-xl border ${tier.border} p-4 flex flex-col items-center gap-2`}>
      <span className="text-xs font-semibold text-gray-400">{game.name}</span>
      <LevelRing level={1} rp={0} color={tier.color} />
      <span className={`text-xs font-semibold ${tier.color}`}>{tier.label}</span>
      <div className="text-[11px] text-gray-500">0 RP • 0% WR</div>
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const { data: tournaments, loading: tournamentsLoading } = useCachedData('tournaments', fetchTournaments);
  const { data: games } = useCachedData('games', fetchGames);
  const [userRankings, setUserRankings] = useState([]);

  const fetchRankings = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchUserRankings(user.id);
      setUserRankings(data);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const loading = tournamentsLoading;
  const displayTournaments = (tournaments || []).slice(0, 4);

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
              Participe de campeonatos e suba no ranking. Prove que você é o melhor.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              {user ? (
                <>
                  <Link
                    to="/tournaments"
                    className="px-8 py-3 bg-gradient-to-r from-[#f28c38] to-[#e8611a] hover:from-[#f59e0b] hover:to-[#f28c38] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#e8611a]/25 flex items-center gap-2"
                  >
                    <Trophy size={20} />
                    Ver Campeonatos
                  </Link>
                  <Link
                    to="/rankings"
                    className="px-8 py-3 bg-surface-light hover:bg-surface-lighter text-white font-bold rounded-xl border border-surface-lighter transition-colors flex items-center gap-2"
                  >
                    <Swords size={20} />
                    Rankings
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

      {/* User Game Levels Section */}
      {user && (
        <section className="py-16 border-y border-surface-light/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-white text-center mb-6">Seus Níveis</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {(games || []).map((game) => {
                const ranking = userRankings.find(r => r.game_id === game.id);
                return ranking
                  ? <GameLevelCard key={game.id} ranking={{ ...ranking, game_name: game.name }} />
                  : <UnrankedGameCard key={game.id} game={game} />;
              })}
            </div>
          </div>
        </section>
      )}

      {/* Achievements Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">Conquistas</h2>
            <p className="text-gray-400 mt-1">Desbloqueie conquistas jogando na plataforma</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
