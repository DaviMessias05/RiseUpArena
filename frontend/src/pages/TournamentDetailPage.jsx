import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { Trophy, Clock, Users, Gamepad2, ArrowLeft, Loader2, Calendar, Award, ChevronRight, ScrollText, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const STATUS_COLORS = {
  open: 'bg-success text-white',
  in_progress: 'bg-warning text-white',
  finished: 'bg-gray-500 text-white',
  draft: 'bg-gray-600 text-white',
};

const STATUS_LABELS = {
  open: 'Aberto',
  in_progress: 'Em andamento',
  finished: 'Finalizado',
  draft: 'Rascunho',
};

const FORMAT_LABELS = {
  single_elimination: 'Eliminação Simples',
  double_elimination: 'Eliminação Dupla',
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    + ' às '
    + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { hash } = useLocation();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tournaments')
        .select('*, games(name, slug, max_team_size)')
        .eq('id', id)
        .single();

      if (!error && data) {
        setTournament({
          ...data,
          game_name: data.games?.name || 'Jogo',
          game_slug: data.games?.slug,
          team_size: data.team_size || data.games?.max_team_size || 5,
          prize_pool: data.prize_description || data.prize_pool,
          max_players: data.max_participants || data.max_players,
        });
      }

      // Count participants
      const { count } = await supabase
        .from('tournament_participants')
        .select('*', { count: 'exact', head: true })
        .eq('tournament_id', id);
      setParticipantCount(count || 0);

      // Check if user is registered
      if (user) {
        const { data: reg } = await supabase
          .from('tournament_participants')
          .select('id')
          .eq('tournament_id', id)
          .eq('user_id', user.id)
          .single();
        setRegistered(!!reg);
      }

      setLoading(false);
    }
    load();
  }, [id, user]);

  // Scroll to prize section if hash is #prize
  useEffect(() => {
    if (hash === '#prize' && !loading) {
      setTimeout(() => {
        document.getElementById('prize-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [hash, loading]);

  async function handleRegister() {
    if (!user || registered || registering) return;
    setRegistering(true);
    await supabase.from('tournament_participants').insert({ tournament_id: id, user_id: user.id });
    setRegistered(true);
    setParticipantCount(c => c + 1);
    setRegistering(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Trophy size={64} className="text-surface-lighter mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Campeonato não encontrado</h2>
        <Link to="/tournaments" className="text-primary-light hover:text-primary">Voltar para campeonatos</Link>
      </div>
    );
  }

  const isOpen = tournament.status === 'open';
  const isFull = participantCount >= (tournament.max_players || Infinity);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link to="/tournaments" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para campeonatos
      </Link>

      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden aspect-[21/9] bg-surface-light mb-6">
        {tournament.banner_url ? (
          <img src={tournament.banner_url} alt={tournament.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-surface-light to-surface">
            <Trophy size={80} className="text-surface-lighter" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-6">
          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[tournament.status] || 'bg-gray-500 text-white'}`}>
            {STATUS_LABELS[tournament.status] || tournament.status}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">{tournament.name}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {showRules ? (
            /* Rules panel */
            <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ScrollText size={20} className="text-primary-light" />
                  <h2 className="text-lg font-bold text-white">Regras do Campeonato</h2>
                </div>
                <button
                  onClick={() => setShowRules(false)}
                  className="p-1.5 rounded-lg hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              {tournament.rules ? (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{tournament.rules}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">Nenhuma regra definida para este campeonato.</p>
              )}
            </div>
          ) : (
            <>
              {/* Prize */}
              {tournament.prize_pool && (
                <div id="prize-section" className="bg-surface rounded-2xl border border-yellow-500/30 p-6 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-4">
                    <Award size={20} className="text-yellow-400" />
                    <h2 className="text-lg font-bold text-white">Premiação</h2>
                  </div>
                  <p className="text-yellow-400 font-semibold text-sm">
                    1º lugar: {(() => {
                      const matches = tournament.prize_pool.match(/[\d.,]+\s*RC/gi) || [];
                      if (matches.length === 0) return tournament.prize_pool;
                      const total = matches.reduce((acc, m) => {
                        const n = parseInt(m.replace(/[.,\s]/g, '').replace(/RC/i, ''));
                        return acc + (isNaN(n) ? 0 : n);
                      }, 0);
                      return total.toLocaleString('pt-BR') + ' RC';
                    })()}
                  </p>
                </div>
              )}

              {/* Details card */}
              <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
                <h2 className="text-lg font-bold text-white mb-4">Detalhes</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Gamepad2 size={18} className="text-primary-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Jogo</p>
                      <p className="text-sm text-white font-medium">{tournament.game_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-primary-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Formato</p>
                      <p className="text-sm text-white font-medium">{tournament.team_size}vs{tournament.team_size}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Trophy size={18} className="text-primary-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Chaveamento</p>
                      <p className="text-sm text-white font-medium">{FORMAT_LABELS[tournament.format] || tournament.format}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users size={18} className="text-primary-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Vagas</p>
                      <p className="text-sm text-white font-medium">{participantCount} / {tournament.max_players || '?'}</p>
                    </div>
                  </div>
                  {tournament.start_date && (
                    <div className="flex items-start gap-3 col-span-2">
                      <Calendar size={18} className="text-primary-light mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[11px] text-gray-500 uppercase font-semibold">Data de início</p>
                        <p className="text-sm text-white font-medium">{formatDate(tournament.start_date)}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 col-span-2">
                    <ChevronRight size={18} className="text-primary-light mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Nível requerido</p>
                      <p className="text-sm text-white font-medium">{tournament.min_level ?? 1} → {tournament.max_level ?? 10}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {tournament.description && (
                <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
                  <h2 className="text-lg font-bold text-white mb-3">Sobre o campeonato</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{tournament.description}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Register */}
          <div className="bg-surface rounded-2xl border border-surface-light/50 p-5">
            <h3 className="text-base font-bold text-white mb-3">Inscrição</h3>
            {!user ? (
              <Link
                to="/auth/login"
                className="w-full block text-center py-3 bg-gradient-to-r from-[#f28c38] to-[#e8611a] text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                Faça login para se inscrever
              </Link>
            ) : registered ? (
              <div className="w-full py-3 bg-success/20 border border-success/40 text-success font-bold rounded-xl text-sm text-center">
                ✓ Inscrito
              </div>
            ) : !isOpen ? (
              <div className="w-full py-3 bg-surface-light text-gray-500 font-bold rounded-xl text-sm text-center">
                Inscrições encerradas
              </div>
            ) : isFull ? (
              <div className="w-full py-3 bg-surface-light text-gray-500 font-bold rounded-xl text-sm text-center">
                Vagas esgotadas
              </div>
            ) : (
              <button
                onClick={handleRegister}
                disabled={registering}
                className="w-full py-3 bg-gradient-to-r from-[#f28c38] to-[#e8611a] text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {registering ? 'Inscrevendo...' : 'Inscrever-se'}
              </button>
            )}
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-500">{participantCount} de {tournament.max_players || '?'} vagas preenchidas</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f28c38] to-[#e8611a] rounded-full"
                style={{ width: `${Math.min((participantCount / (tournament.max_players || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Rules button */}
          <button
            onClick={() => setShowRules(v => !v)}
            className={`w-full flex items-center justify-center gap-2 py-3 border font-semibold rounded-2xl text-sm transition-all ${
              showRules
                ? 'bg-primary/10 border-primary/50 text-primary-light'
                : 'bg-surface border-surface-light/50 hover:border-primary/50 text-gray-300 hover:text-white'
            }`}
          >
            <ScrollText size={16} />
            {showRules ? 'Fechar Regras' : 'Ver Regras'}
          </button>
        </div>
      </div>
    </div>
  );
}
