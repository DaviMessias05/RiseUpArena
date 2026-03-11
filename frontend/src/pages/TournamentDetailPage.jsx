import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Trophy, Users, Gamepad2, ArrowLeft, Loader2,
  Calendar, Award, GitBranch, Medal, Clock, ScrollText,
  CheckCircle2, MessageCircle, Send, Globe, Play, Crown,
  ChevronRight, AlertTriangle,
} from 'lucide-react';
import { supabase, sessionReady } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { startTournament, recordBracketResult } from '../lib/api';

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

function formatDateShort(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).toUpperCase()
    + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatChatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const TABS = [
  { id: 'overview', label: 'Visão Geral' },
  { id: 'rules', label: 'Regras' },
  { id: 'bracket', label: 'Chaves' },
  { id: 'teams', label: 'Equipes' },
  { id: 'chat', label: 'Chat' },
  { id: 'results', label: 'Resultados' },
];

export default function TournamentDetailPage() {
  const { id } = useParams();
  const { hash } = useLocation();
  const { user, profile, isAdmin } = useAuth();
  const { addNotification, setActiveSession } = useNotifications();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [participantId, setParticipantId] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [readyCount, setReadyCount] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(null);
  const [notification, setNotification] = useState(null); // { type: 'checkin'|'started', msg }
  const [bracketMatches, setBracketMatches] = useState([]);
  const [bracketLoading, setBracketLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [resultModal, setResultModal] = useState(null); // { match, score1, score2, winnerId }
  const [resultSaving, setResultSaving] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await sessionReady;
      try {
        // Run all independent queries in parallel
        const queries = [
          supabase.from('tournaments').select('*, games(name, slug, max_team_size)').eq('id', id).single(),
          supabase.from('tournament_participants').select('id, registered_at, status, profiles(username, display_name, avatar_url)').eq('tournament_id', id).order('registered_at', { ascending: true }),
          supabase.from('chat_messages').select('id, content, created_at, user_id, profiles!user_id(username, display_name, avatar_url)').eq('channel_type', 'tournament').eq('channel_id', id).order('created_at', { ascending: true }).limit(100),
        ];
        if (user) {
          queries.push(
            supabase.from('tournament_participants').select('id, status').eq('tournament_id', id).eq('user_id', user.id).maybeSingle()
          );
        }

        const results = await Promise.all(queries);
        const [tournamentRes, partsRes, msgsRes, regRes] = results;

        if (!tournamentRes.error && tournamentRes.data) {
          const data = tournamentRes.data;
          setTournament({
            ...data,
            game_name: data.games?.name || 'Jogo',
            game_slug: data.games?.slug,
            team_size: data.team_size || data.games?.max_team_size || 5,
            prize_pool: data.prize_description || data.prize_pool,
            max_players: data.max_participants || data.max_players,
          });
        }

        const partsData = partsRes.data || [];
        setParticipants(partsData);
        setParticipantCount(partsData.length);
        setReadyCount(partsData.filter(p => p.status === 'checked_in').length);

        setMessages(msgsRes.data || []);

        if (regRes?.data) {
          setRegistered(true);
          setParticipantId(regRes.data.id);
          setIsReady(regRes.data.status === 'checked_in');
        }
      } finally {
        setLoading(false);
      }
    }

    load();

    const chatChannel = supabase
      .channel(`tournament-chat-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${id}` },
        async (payload) => {
          const msg = payload.new;
          const { data: prof } = await supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', msg.user_id)
            .single();
          setMessages(prev => [...prev, { ...msg, profiles: prof }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(chatChannel); };
  }, [id, user]);

  useEffect(() => {
    if (activeTab === 'chat') {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [activeTab, messages]);

  // Check-in window: opens 10 min before start + notifications
  const prevCanCheckIn = useRef(false);
  const prevStatus = useRef(null);
  useEffect(() => {
    if (!tournament?.start_date) return;

    function check() {
      const msLeft = new Date(tournament.start_date) - Date.now();
      const minsLeft = Math.ceil(msLeft / 60000);
      setMinutesLeft(minsLeft);
      const nowCanCheckIn = msLeft <= 10 * 60 * 1000 && msLeft > 0;
      setCanCheckIn(nowCanCheckIn);

      // Notify when check-in window opens
      if (nowCanCheckIn && !prevCanCheckIn.current && registered && !isReady) {
        setNotification({ type: 'checkin', msg: 'O check-in está aberto! Marque-se como pronto antes do início.' });
        addNotification({
          type: 'checkin',
          title: 'Check-in aberto',
          message: `Marque-se como pronto para "${tournament.name}"`,
          tournamentId: id,
        });
      }
      prevCanCheckIn.current = nowCanCheckIn;
    }

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [tournament?.start_date, registered, isReady]);

  // Notify when tournament starts
  useEffect(() => {
    if (!tournament) return;
    if (prevStatus.current && prevStatus.current !== 'in_progress' && tournament.status === 'in_progress' && isReady) {
      setNotification({ type: 'started', msg: 'O campeonato começou! Verifique o chaveamento.' });
      addNotification({
        type: 'tournament_start',
        title: 'Campeonato iniciado!',
        message: `"${tournament.name}" começou. Sua partida está pronta.`,
        tournamentId: id,
      });
      setActiveSession({
        tournamentId: id,
        tournamentName: tournament.name,
        round: 1,
      });
    }
    prevStatus.current = tournament.status;
  }, [tournament?.status, isReady]);

  // Load bracket matches
  const loadBracket = useCallback(async () => {
    if (!id) return;
    setBracketLoading(true);
    const { data } = await supabase
      .from('tournament_matches')
      .select('*, player1:player1_id(id, username, display_name, avatar_url), player2:player2_id(id, username, display_name, avatar_url), winner:winner_id(id, username, display_name, avatar_url)')
      .eq('tournament_id', id)
      .order('round').order('match_order');
    setBracketMatches(data || []);
    setBracketLoading(false);
  }, [id]);

  useEffect(() => {
    if (activeTab === 'bracket') loadBracket();
  }, [activeTab, loadBracket]);

  // Realtime: bracket updates
  useEffect(() => {
    const ch = supabase.channel(`bracket-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches', filter: `tournament_id=eq.${id}` }, loadBracket)
      .subscribe();
    return () => ch.unsubscribe();
  }, [id, loadBracket]);

  // Realtime: tournament status changes (e.g. auto-start fires on the server)
  useEffect(() => {
    const ch = supabase.channel(`tournament-row-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, (payload) => {
        setTournament(prev => prev ? { ...prev, ...payload.new, game_name: prev.game_name, game_slug: prev.game_slug, team_size: prev.team_size, prize_pool: prev.prize_pool, max_players: prev.max_players } : prev);
      })
      .subscribe();
    return () => ch.unsubscribe();
  }, [id]);

  useEffect(() => {
    if (hash === '#prize' && !loading) {
      setActiveTab('overview');
      setTimeout(() => {
        document.getElementById('prize-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [hash, loading]);

  async function handleRegister() {
    if (!user || registered || registering) return;
    setRegistering(true);
    const { data, error } = await supabase
      .from('tournament_participants')
      .insert({ tournament_id: id, user_id: user.id })
      .select('id, registered_at, status, profiles!user_id(username, display_name, avatar_url)')
      .single();
    if (!error && data) {
      setRegistered(true);
      setParticipantId(data.id);
      setParticipants(prev => [...prev, data]);
      setParticipantCount(c => c + 1);
    }
    setRegistering(false);
  }

  async function handleReady() {
    if (!participantId || isReady) return;
    const { error } = await supabase
      .from('tournament_participants')
      .update({ status: 'checked_in' })
      .eq('id', participantId);
    if (!error) {
      setIsReady(true);
      setReadyCount(c => c + 1);
    }
  }

  async function handleStartTournament() {
    if (starting) return;
    setStarting(true);
    try {
      await startTournament(id);
      setTournament(prev => ({ ...prev, status: 'in_progress' }));
      setActiveTab('bracket');
      loadBracket();
    } catch (err) {
      alert(err.message || 'Erro ao iniciar torneio.');
    }
    setStarting(false);
  }

  async function handleSaveResult() {
    if (!resultModal || resultSaving) return;
    const { match, score1, score2, winnerId } = resultModal;
    if (!winnerId) return alert('Selecione o vencedor.');
    setResultSaving(true);
    try {
      await recordBracketResult(id, match.id, {
        winner_id: winnerId,
        score_player1: parseInt(score1) || 0,
        score_player2: parseInt(score2) || 0,
      });
      setResultModal(null);
      loadBracket();
      // Refresh tournament status
      const { data } = await supabase.from('tournaments').select('status').eq('id', id).single();
      if (data) setTournament(prev => ({ ...prev, status: data.status }));
    } catch (err) {
      alert(err.message || 'Erro ao salvar resultado.');
    }
    setResultSaving(false);
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || chatSending || !user) return;
    setChatSending(true);
    await supabase.from('chat_messages').insert({
      channel_type: 'tournament',
      channel_id: id,
      user_id: user.id,
      content: chatInput.trim(),
    });
    setChatInput('');
    setChatSending(false);
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

  const isOpen = ['open', 'upcoming'].includes(tournament.status);
  const isFull = participantCount >= (tournament.max_players || Infinity);

  // Bracket helpers
  const bracketRounds = [...new Set(bracketMatches.map(m => m.round))].sort((a, b) => a - b);
  const roundLabel = (r, total) => {
    if (r === total) return 'Final';
    if (r === total - 1) return 'Semifinal';
    if (r === total - 2) return 'Quartas';
    return `Rodada ${r}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Notification banner */}
      {notification && (
        <div className={`mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
          notification.type === 'started'
            ? 'bg-primary/10 border-primary/40 text-primary-light'
            : 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300'
        }`}>
          {notification.type === 'started' ? <Play size={16} /> : <Clock size={16} />}
          <span className="flex-1">{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-white ml-2">✕</button>
        </div>
      )}

      {/* Result Modal */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#13161d] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-primary-light" /> Registrar Resultado
            </h3>
            <div className="flex items-center gap-3 mb-4">
              {/* Player 1 */}
              <button
                onClick={() => setResultModal(m => ({ ...m, winnerId: m.match.player1_id }))}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                  resultModal.winnerId === resultModal.match.player1_id
                    ? 'border-success bg-success/10 text-success'
                    : 'border-white/10 text-gray-300 hover:border-white/30'
                }`}
              >
                {resultModal.match.player1?.display_name || resultModal.match.player1?.username || 'Jogador 1'}
              </button>
              <span className="text-gray-600 text-xs font-bold">VS</span>
              {/* Player 2 */}
              <button
                onClick={() => setResultModal(m => ({ ...m, winnerId: m.match.player2_id }))}
                className={`flex-1 py-2.5 px-3 rounded-xl border text-sm font-semibold transition-colors ${
                  resultModal.winnerId === resultModal.match.player2_id
                    ? 'border-success bg-success/10 text-success'
                    : 'border-white/10 text-gray-300 hover:border-white/30'
                }`}
              >
                {resultModal.match.player2?.display_name || resultModal.match.player2?.username || 'Jogador 2'}
              </button>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Placar J1</label>
                <input type="number" min="0" value={resultModal.score1}
                  onChange={e => setResultModal(m => ({ ...m, score1: e.target.value }))}
                  className="w-full bg-white/5 text-white text-center rounded-lg px-2 py-2 text-sm outline-none focus:bg-white/8"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 uppercase mb-1 block">Placar J2</label>
                <input type="number" min="0" value={resultModal.score2}
                  onChange={e => setResultModal(m => ({ ...m, score2: e.target.value }))}
                  className="w-full bg-white/5 text-white text-center rounded-lg px-2 py-2 text-sm outline-none focus:bg-white/8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setResultModal(null)} className="flex-1 py-2 rounded-xl border border-white/10 text-gray-400 text-sm hover:bg-white/5 transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveResult} disabled={!resultModal.winnerId || resultSaving}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#f28c38] to-[#e8611a] text-white text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {resultSaving ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-6 right-6">
          <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[tournament.status] || 'bg-gray-500 text-white'}`}>
            {STATUS_LABELS[tournament.status] || tournament.status}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">{tournament.name}</h1>
          {tournament.start_date && (
            <p className="text-gray-300 text-sm mt-1 flex items-center gap-1.5">
              <Clock size={14} />
              {formatDate(tournament.start_date)}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-light/50 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-light text-primary-light'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.id === 'teams' && (
                <span className="ml-1.5 text-[11px] bg-surface-light px-1.5 py-0.5 rounded-full text-gray-400">
                  {participantCount}
                </span>
              )}
              {tab.id === 'chat' && messages.length > 0 && (
                <span className="ml-1.5 text-[11px] bg-primary/20 text-primary-light px-1.5 py-0.5 rounded-full">
                  {messages.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              {/* Format cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface rounded-xl border border-surface-light/50 p-4 text-center">
                  <Gamepad2 size={22} className="text-primary-light mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Jogo</p>
                  <p className="text-sm text-white font-bold">{tournament.game_name}</p>
                </div>
                <div className="bg-surface rounded-xl border border-surface-light/50 p-4 text-center">
                  <Users size={22} className="text-primary-light mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Tamanho da Equipe</p>
                  <p className="text-sm text-white font-bold">{tournament.team_size} × {tournament.team_size}</p>
                </div>
                <div className="bg-surface rounded-xl border border-surface-light/50 p-4 text-center">
                  <GitBranch size={22} className="text-primary-light mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 uppercase font-semibold mb-1">Formato</p>
                  <p className="text-sm text-white font-bold">{FORMAT_LABELS[tournament.format] || tournament.format || '—'}</p>
                </div>
              </div>

              {/* Prize */}
              {tournament.prize_pool && (
                <div id="prize-section" className="bg-surface rounded-2xl border border-yellow-500/30 p-6 scroll-mt-24">
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={20} className="text-yellow-400" />
                    <h2 className="text-lg font-bold text-white">Premiação</h2>
                  </div>
                  <p className="text-yellow-400 font-semibold text-sm">
                    {(() => {
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

              {/* Description */}
              {tournament.description && (
                <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
                  <h2 className="text-lg font-bold text-white mb-3">Sobre o campeonato</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">{tournament.description}</p>
                </div>
              )}
            </>
          )}

          {/* RULES TAB */}
          {activeTab === 'rules' && (
            <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <ScrollText size={20} className="text-primary-light" />
                <h2 className="text-lg font-bold text-white">Regras do Campeonato</h2>
              </div>
              {tournament.rules ? (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{tournament.rules}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">Nenhuma regra definida para este campeonato.</p>
              )}
            </div>
          )}

          {/* BRACKET TAB */}
          {activeTab === 'bracket' && (
            <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <GitBranch size={20} className="text-primary-light" />
                  <h2 className="text-lg font-bold text-white">Chaveamento</h2>
                </div>
                {tournament.status === 'finished' && (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 px-2.5 py-1 rounded-lg">
                    <Crown size={12} /> Finalizado
                  </span>
                )}
              </div>

              {bracketLoading ? (
                <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-gray-500" /></div>
              ) : bracketMatches.length === 0 ? (
                <div className="text-center py-16">
                  <GitBranch size={52} className="text-surface-lighter mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">O chaveamento será gerado quando o torneio iniciar.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex gap-0 min-w-max">
                    {bracketRounds.map((round, ri) => {
                      const roundMatches = bracketMatches.filter(m => m.round === round);
                      const total = bracketRounds.length;
                      return (
                        <div key={round} className="flex flex-col" style={{ minWidth: 180 }}>
                          {/* Round header */}
                          <div className="text-center mb-3 px-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                              {roundLabel(round, total)}
                            </span>
                          </div>

                          {/* Matches */}
                          <div className="flex flex-col justify-around flex-1 gap-2 px-2">
                            {roundMatches.map(match => {
                              const p1 = match.player1;
                              const p2 = match.player2;
                              const winner = match.winner_id;
                              const canReport = isAdmin && match.status === 'in_progress' && p1 && p2;

                              return (
                                <div key={match.id} className="relative flex items-center">
                                  <div className={`flex-1 rounded-xl border overflow-hidden transition-all ${
                                    match.status === 'finished' ? 'border-white/10' :
                                    match.status === 'in_progress' ? 'border-primary/40' : 'border-white/5'
                                  }`}>
                                    {/* Player 1 */}
                                    <div className={`flex items-center gap-2 px-2.5 py-2 border-b border-white/5 ${
                                      winner === match.player1_id ? 'bg-success/10' : 'bg-surface-light/20'
                                    }`}>
                                      <div className="w-5 h-5 rounded-full bg-surface-light flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {p1?.avatar_url ? <img src={p1.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${p1?.display_name || p1?.username || 'jogador'}`} />
                                          : <span className="text-[8px] text-gray-400">{(p1?.display_name || p1?.username || '?')[0].toUpperCase()}</span>}
                                      </div>
                                      <span className={`text-xs flex-1 truncate font-medium ${
                                        winner === match.player1_id ? 'text-success font-bold' :
                                        winner && winner !== match.player1_id ? 'text-gray-600 line-through' : 'text-gray-300'
                                      }`}>
                                        {p1?.display_name || p1?.username || (match.player1_id ? '...' : 'BYE')}
                                      </span>
                                      {match.status === 'finished' && (
                                        <span className={`text-xs font-bold ml-1 ${winner === match.player1_id ? 'text-success' : 'text-gray-600'}`}>
                                          {match.score_player1 ?? 0}
                                        </span>
                                      )}
                                      {winner === match.player1_id && <Crown size={10} className="text-yellow-400 flex-shrink-0" />}
                                    </div>
                                    {/* Player 2 */}
                                    <div className={`flex items-center gap-2 px-2.5 py-2 ${
                                      winner === match.player2_id ? 'bg-success/10' : 'bg-surface-light/20'
                                    }`}>
                                      <div className="w-5 h-5 rounded-full bg-surface-light flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {p2?.avatar_url ? <img src={p2.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${p2?.display_name || p2?.username || 'jogador'}`} />
                                          : <span className="text-[8px] text-gray-400">{(p2?.display_name || p2?.username || '?')[0].toUpperCase()}</span>}
                                      </div>
                                      <span className={`text-xs flex-1 truncate font-medium ${
                                        winner === match.player2_id ? 'text-success font-bold' :
                                        winner && winner !== match.player2_id ? 'text-gray-600 line-through' : 'text-gray-300'
                                      }`}>
                                        {p2?.display_name || p2?.username || (match.player2_id ? '...' : 'BYE')}
                                      </span>
                                      {match.status === 'finished' && (
                                        <span className={`text-xs font-bold ml-1 ${winner === match.player2_id ? 'text-success' : 'text-gray-600'}`}>
                                          {match.score_player2 ?? 0}
                                        </span>
                                      )}
                                      {winner === match.player2_id && <Crown size={10} className="text-yellow-400 flex-shrink-0" />}
                                    </div>

                                    {/* Admin: report button */}
                                    {canReport && (
                                      <button
                                        onClick={() => setResultModal({ match, score1: 0, score2: 0, winnerId: null })}
                                        className="w-full py-1.5 text-[10px] font-bold text-primary-light bg-primary/10 hover:bg-primary/20 transition-colors"
                                      >
                                        Registrar Resultado
                                      </button>
                                    )}
                                  </div>

                                  {/* Connector arrow (not last round) */}
                                  {ri < bracketRounds.length - 1 && (
                                    <ChevronRight size={14} className="text-gray-700 flex-shrink-0 ml-1" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    {/* Champion */}
                    {tournament.status === 'finished' && (() => {
                      const final = bracketMatches.find(m => m.bracket_type === 'grand_final' && m.status === 'finished');
                      const champ = final?.winner;
                      if (!champ) return null;
                      return (
                        <div className="flex flex-col items-center justify-center px-6">
                          <Crown size={28} className="text-yellow-400 mb-2" />
                          <div className="w-12 h-12 rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center mb-2">
                            {champ.avatar_url
                              ? <img src={champ.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${champ.display_name || champ.username || 'campeao'}`} />
                              : <span className="text-sm font-bold text-white">{(champ.display_name || champ.username || '?')[0].toUpperCase()}</span>}
                          </div>
                          <p className="text-sm font-bold text-yellow-400 text-center">{champ.display_name || champ.username}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">Campeão</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TEAMS TAB */}
          {activeTab === 'teams' && (
            <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users size={20} className="text-primary-light" />
                  <h2 className="text-lg font-bold text-white">Inscritos ({participantCount})</h2>
                </div>
                {readyCount > 0 && (
                  <span className="text-xs text-success bg-success/10 border border-success/30 px-2 py-1 rounded-lg font-semibold">
                    {readyCount} prontos
                  </span>
                )}
              </div>
              {participants.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={40} className="text-surface-lighter mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhum participante inscrito ainda.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {participants.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-light/30 rounded-xl">
                      <span className="text-gray-600 text-xs w-5 text-right flex-shrink-0">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-full bg-surface-light flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {p.profiles?.avatar_url ? (
                          <img src={p.profiles.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${p.profiles?.display_name || p.profiles?.username || 'participante'}`} />
                        ) : (
                          <Users size={14} className="text-gray-500" />
                        )}
                      </div>
                      <span className="text-sm text-white font-medium flex-1">
                        {p.profiles?.display_name || p.profiles?.username || 'Jogador'}
                      </span>
                      {p.status === 'checked_in' && (
                        <span className="text-[10px] text-success bg-success/10 border border-success/30 px-1.5 py-0.5 rounded font-semibold flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          PRONTO
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RESULTS TAB */}
          {activeTab === 'results' && (
            <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Medal size={20} className="text-primary-light" />
                <h2 className="text-lg font-bold text-white">Resultados</h2>
              </div>
              <div className="text-center py-16">
                <Medal size={52} className="text-surface-lighter mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Os resultados serão exibidos após o término do torneio.</p>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div className="bg-surface rounded-2xl border border-surface-light/50 flex flex-col" style={{ height: '520px' }}>
              <div className="flex items-center gap-2 p-4 border-b border-surface-light/50 flex-shrink-0">
                <MessageCircle size={18} className="text-primary-light" />
                <h2 className="text-base font-bold text-white">Chat do Torneio</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <MessageCircle size={36} className="text-surface-lighter" />
                    <p className="text-gray-500 text-sm">Nenhuma mensagem ainda. Seja o primeiro!</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMe = msg.user_id === user?.id;
                    const name = msg.profiles?.display_name || msg.profiles?.username || 'Jogador';
                    return (
                      <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className="w-7 h-7 rounded-full bg-surface-light flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                          {msg.profiles?.avatar_url ? (
                            <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${name}`} />
                          ) : (
                            <Users size={12} className="text-gray-500" />
                          )}
                        </div>
                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                          <div className="flex items-baseline gap-1.5">
                            {!isMe && <span className="text-[11px] font-semibold text-gray-400">{name}</span>}
                            <span className="text-[10px] text-gray-600">{formatChatTime(msg.created_at)}</span>
                          </div>
                          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed break-words ${
                            isMe
                              ? 'bg-primary text-white rounded-tr-sm'
                              : 'bg-surface-light text-gray-200 rounded-tl-sm'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-surface-light/50 flex-shrink-0">
                {user ? (
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      maxLength={500}
                      placeholder="Escreva uma mensagem..."
                      className="flex-1 bg-surface-light rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatSending}
                      className="px-3 py-2 bg-primary hover:bg-primary-light rounded-xl text-white transition-colors disabled:opacity-40 flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </form>
                ) : (
                  <Link to="/auth/login" className="text-sm text-primary-light hover:underline">
                    Faça login para participar do chat
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Slot counter */}
          <div className="bg-surface rounded-2xl border border-surface-light/50 p-5">
            <h3 className="text-sm font-bold text-white mb-4">Equipes</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-2xl font-black text-white">{participantCount}</p>
                <p className="text-[11px] text-gray-500 mt-1">Inscritos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-success">{readyCount}</p>
                <p className="text-[11px] text-gray-500 mt-1">Prontos</p>
              </div>
              <div>
                <p className="text-2xl font-black text-primary-light">{tournament.max_players || '∞'}</p>
                <p className="text-[11px] text-gray-500 mt-1">Vagas</p>
              </div>
            </div>
            <div className="mt-4 w-full h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f28c38] to-[#e8611a] rounded-full"
                style={{ width: `${Math.min((participantCount / (tournament.max_players || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Region */}
          {tournament.region && (
            <div className="bg-surface rounded-2xl border border-surface-light/50 p-5">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Globe size={15} className="text-primary-light" />
                Região
              </h3>
              <p className="text-sm text-gray-300">{tournament.region}</p>
            </div>
          )}

          {/* Timeline */}
          {tournament.start_date && (
            <div className="bg-surface rounded-2xl border border-surface-light/50 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Calendar size={15} className="text-primary-light" />
                Linha do Tempo
              </h3>
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOpen ? 'bg-success' : 'bg-gray-600'}`} />
                    <div className="w-px h-7 bg-surface-light/60 mt-1" />
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-semibold text-white leading-tight">
                      Inscrições {isOpen ? 'Abertas' : 'Encerradas'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isOpen ? 'Participe agora' : 'Encerradas'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center mt-0.5">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${canCheckIn && !isReady ? 'bg-yellow-400 animate-pulse' : isReady ? 'bg-success' : 'bg-gray-600'}`} />
                    <div className="w-px h-7 bg-surface-light/60 mt-1" />
                  </div>
                  <div className="pb-3">
                    <p className="text-xs font-semibold text-white leading-tight">Check-in</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {isReady ? 'Confirmado ✓' : canCheckIn ? 'Aberto agora!' : `Abre 10min antes`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-primary-light mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">Início do Torneio</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{formatDateShort(tournament.start_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin: Start tournament */}
          {isAdmin && ['open', 'upcoming'].includes(tournament.status) && participantCount >= 2 && (
            <div className="bg-surface rounded-2xl border border-yellow-500/30 p-5">
              <h3 className="text-sm font-bold text-yellow-400 mb-1 flex items-center gap-2">
                <AlertTriangle size={14} /> Painel Admin
              </h3>
              <p className="text-[11px] text-gray-500 mb-3">{participantCount} inscritos prontos.</p>
              <button
                onClick={handleStartTournament}
                disabled={starting}
                className="w-full py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {starting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                {starting ? 'Iniciando...' : 'Iniciar Torneio'}
              </button>
            </div>
          )}

          {/* Registration */}
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
              <div className="space-y-2">
                <div className="w-full py-3 bg-success/20 border border-success/40 text-success font-bold rounded-xl text-sm text-center">
                  ✓ Inscrito
                </div>
                {isOpen && (
                  isReady ? (
                    <div className="w-full py-2.5 bg-success/10 border border-success/30 text-success font-semibold rounded-xl text-sm text-center flex items-center justify-center gap-2">
                      <CheckCircle2 size={15} />
                      Pronto para jogar!
                    </div>
                  ) : canCheckIn ? (
                    <button
                      onClick={handleReady}
                      className="w-full py-2.5 border border-success/60 text-success hover:bg-success/10 font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 animate-pulse"
                    >
                      <CheckCircle2 size={15} />
                      Marcar como Pronto
                    </button>
                  ) : minutesLeft !== null && minutesLeft > 0 ? (
                    <div className="w-full py-2.5 bg-surface-light/50 border border-surface-light text-gray-500 font-semibold rounded-xl text-sm text-center flex items-center justify-center gap-2">
                      <Clock size={14} />
                      Check-in abre em {minutesLeft > 60
                        ? `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}min`
                        : `${minutesLeft}min`}
                    </div>
                  ) : minutesLeft !== null && minutesLeft <= 0 && tournament.status === 'upcoming' ? (
                    <div className="w-full py-2.5 bg-primary/10 border border-primary/30 text-primary-light font-semibold rounded-xl text-sm text-center flex items-center justify-center gap-2 animate-pulse">
                      <Loader2 size={14} className="animate-spin" />
                      Aguardando início automático...
                    </div>
                  ) : null
                )}
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
          </div>
        </div>
      </div>
    </div>
  );
}
