import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Swords, Trophy, Clock, Users, ArrowLeft, Loader2,
  CheckCircle2, AlertCircle, Send, MessageCircle, Crown,
} from 'lucide-react';
import { supabase, sessionReady } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

function formatTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const ROUND_LABELS = { 1: 'Rodada 1', 2: 'Rodada 2', 3: 'Quartas de Final', 4: 'Semifinal', 5: 'Final' };

export default function MatchRoomPage() {
  const { tournamentId } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!user || !tournamentId) return;

    async function load() {
      setLoading(true);
      await sessionReady;
      try {
        // Load tournament info
        const { data: t } = await supabase
          .from('tournaments')
          .select('id, name, status, games(name)')
          .eq('id', tournamentId)
          .single();
        if (t) setTournament({ ...t, game_name: t.games?.name || 'Jogo' });

        // Find the user's current match in this tournament
        const { data: matches } = await supabase
          .from('tournament_matches')
          .select('*, player1:player1_id(id, username, display_name, avatar_url), player2:player2_id(id, username, display_name, avatar_url), winner:winner_id(id, username, display_name, avatar_url)')
          .eq('tournament_id', tournamentId)
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('round', { ascending: false })
          .limit(10);

        // Find the most recent in-progress or latest match for this user
        const active = matches?.find(m => m.status === 'in_progress')
          || matches?.find(m => m.status === 'pending')
          || matches?.[0];
        setMatch(active || null);

        // Load room chat
        const { data: msgs } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, user_id, profiles!user_id(username, display_name, avatar_url)')
          .eq('channel_type', 'match_room')
          .eq('channel_id', tournamentId)
          .order('created_at', { ascending: true })
          .limit(100);
        setMessages(msgs || []);
      } finally {
        setLoading(false);
      }
    }

    load();

    // Realtime: tournament_matches changes
    const matchChannel = supabase
      .channel(`match-room-matches-${tournamentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_matches', filter: `tournament_id=eq.${tournamentId}` }, async () => {
        const { data: matches } = await supabase
          .from('tournament_matches')
          .select('*, player1:player1_id(id, username, display_name, avatar_url), player2:player2_id(id, username, display_name, avatar_url), winner:winner_id(id, username, display_name, avatar_url)')
          .eq('tournament_id', tournamentId)
          .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
          .order('round', { ascending: false })
          .limit(10);
        const active = matches?.find(m => m.status === 'in_progress')
          || matches?.find(m => m.status === 'pending')
          || matches?.[0];
        setMatch(active || null);
      })
      .subscribe();

    // Realtime: tournament status
    const tournChannel = supabase
      .channel(`match-room-tourn-${tournamentId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` }, (payload) => {
        setTournament(prev => prev ? { ...prev, status: payload.new.status } : prev);
      })
      .subscribe();

    // Realtime: chat
    const chatChannel = supabase
      .channel(`match-room-chat-${tournamentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${tournamentId}` }, async (payload) => {
        if (payload.new.channel_type !== 'match_room') return;
        const { data: prof } = await supabase.from('profiles').select('username, display_name, avatar_url').eq('id', payload.new.user_id).single();
        setMessages(prev => [...prev, { ...payload.new, profiles: prof }]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(tournChannel);
      supabase.removeChannel(chatChannel);
    };
  }, [user, tournamentId]);

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages]);

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || chatSending || !user) return;
    setChatSending(true);
    await supabase.from('chat_messages').insert({
      channel_type: 'match_room',
      channel_id: tournamentId,
      user_id: user.id,
      content: chatInput.trim(),
    });
    setChatInput('');
    setChatSending(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 size={36} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <AlertCircle size={48} className="text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">Torneio não encontrado.</p>
        <Link to="/tournaments" className="text-primary-light hover:underline text-sm mt-3 block">Voltar</Link>
      </div>
    );
  }

  const opponent = match
    ? (match.player1_id === user?.id ? match.player2 : match.player1)
    : null;
  const isWinner = match?.winner_id === user?.id;
  const isLoser = match?.winner_id && match.winner_id !== user?.id;
  const roundLabel = match ? (ROUND_LABELS[match.round] || `Rodada ${match.round}`) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link to={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
        <ArrowLeft size={16} />
        Voltar para o torneio
      </Link>

      {/* Header */}
      <div className="bg-surface rounded-2xl border border-surface-light/50 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Swords size={18} className="text-primary-light" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sessão Atual</span>
            </div>
            <h1 className="text-xl font-black text-white">{tournament.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{tournament.game_name}</p>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${
            tournament.status === 'in_progress' ? 'bg-warning/20 text-warning border border-warning/30' :
            tournament.status === 'finished' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30' :
            'bg-success/20 text-success border border-success/30'
          }`}>
            {tournament.status === 'in_progress' ? 'Em andamento' : tournament.status === 'finished' ? 'Finalizado' : 'Aguardando'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match card */}
        <div className="lg:col-span-2 space-y-4">
          {/* Current match */}
          <div className="bg-surface rounded-2xl border border-surface-light/50 p-6">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Trophy size={15} className="text-primary-light" />
              {roundLabel || 'Sua Partida'}
            </h2>

            {!match ? (
              <div className="text-center py-10">
                <CheckCircle2 size={40} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">
                  {tournament.status === 'finished'
                    ? 'O torneio foi encerrado.'
                    : 'Aguardando início das partidas...'}
                </p>
              </div>
            ) : match.status === 'pending' ? (
              <div className="text-center py-10">
                <Clock size={40} className="text-yellow-600 mx-auto mb-3" />
                <p className="text-gray-300 text-sm font-semibold">Aguardando oponente...</p>
                <p className="text-gray-500 text-xs mt-1">Sua partida começará em breve</p>
              </div>
            ) : (
              <>
                {/* VS display */}
                <div className="flex items-center gap-4 mb-6">
                  {/* You */}
                  <div className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border ${
                    isWinner ? 'border-success/40 bg-success/5' :
                    isLoser ? 'border-gray-700/40 bg-gray-800/20' :
                    'border-primary/30 bg-primary/5'
                  }`}>
                    <div className="w-12 h-12 rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center">
                      {match[match.player1_id === user?.id ? 'player1' : 'player2']?.avatar_url ? (
                        <img src={match[match.player1_id === user?.id ? 'player1' : 'player2'].avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${match[match.player1_id === user?.id ? 'player1' : 'player2']?.display_name || 'jogador'}`} />
                      ) : (
                        <span className="text-sm font-bold text-white">{(match[match.player1_id === user?.id ? 'player1' : 'player2']?.display_name || match[match.player1_id === user?.id ? 'player1' : 'player2']?.username || 'V')[0].toUpperCase()}</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-white">Você</span>
                    {match.status === 'finished' && (
                      <span className={`text-2xl font-black ${isWinner ? 'text-success' : 'text-gray-500'}`}>
                        {match.player1_id === user?.id ? match.score_player1 ?? 0 : match.score_player2 ?? 0}
                      </span>
                    )}
                    {isWinner && <Crown size={16} className="text-yellow-400" />}
                  </div>

                  <div className="text-gray-600 font-black text-lg">VS</div>

                  {/* Opponent */}
                  <div className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border ${
                    isLoser ? 'border-success/40 bg-success/5' :
                    isWinner ? 'border-gray-700/40 bg-gray-800/20' :
                    'border-white/10 bg-white/2'
                  }`}>
                    {opponent ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-surface-light overflow-hidden flex items-center justify-center">
                          {opponent.avatar_url ? (
                            <img src={opponent.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${opponent.display_name || opponent.username || 'oponente'}`} />
                          ) : (
                            <span className="text-sm font-bold text-gray-400">{(opponent.display_name || opponent.username || '?')[0].toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-white truncate max-w-full px-2">
                          {opponent.display_name || opponent.username}
                        </span>
                        {match.status === 'finished' && (
                          <span className={`text-2xl font-black ${isLoser ? 'text-success' : 'text-gray-500'}`}>
                            {match.player1_id === user?.id ? match.score_player2 ?? 0 : match.score_player1 ?? 0}
                          </span>
                        )}
                        {isLoser && <Crown size={16} className="text-yellow-400" />}
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center">
                          <Users size={20} className="text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-500">A definir</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Result */}
                {match.status === 'finished' && (
                  <div className={`text-center py-3 rounded-xl font-bold text-sm ${
                    isWinner ? 'bg-success/10 text-success border border-success/30' :
                    isLoser ? 'bg-gray-700/30 text-gray-400 border border-gray-700' :
                    'bg-surface-light text-gray-300'
                  }`}>
                    {isWinner ? '🏆 Você venceu! Aguarde a próxima rodada.' :
                     isLoser ? 'Eliminado. Boa sorte na próxima!' :
                     'Partida encerrada'}
                  </div>
                )}

                {match.status === 'in_progress' && (
                  <div className="text-center py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary-light text-sm font-semibold flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    Partida em andamento — aguarde o resultado do admin
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat da sala */}
        <div className="bg-surface rounded-2xl border border-surface-light/50 flex flex-col" style={{ height: 440 }}>
          <div className="flex items-center gap-2 p-4 border-b border-surface-light/50 flex-shrink-0">
            <MessageCircle size={15} className="text-primary-light" />
            <h2 className="text-sm font-bold text-white">Chat da Sala</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2">
                <MessageCircle size={28} className="text-gray-700" />
                <p className="text-gray-500 text-xs">Nenhuma mensagem ainda</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.user_id === user?.id;
                const name = msg.profiles?.display_name || msg.profiles?.username || 'Jogador';
                return (
                  <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className="w-6 h-6 rounded-full bg-surface-light flex items-center justify-center flex-shrink-0 overflow-hidden mt-0.5">
                      {msg.profiles?.avatar_url
                        ? <img src={msg.profiles.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${name}`} />
                        : <span className="text-[8px] font-bold text-gray-400">{name[0].toUpperCase()}</span>}
                    </div>
                    <div className={`flex flex-col gap-0.5 max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {!isMe && <span className="text-[10px] text-gray-500">{name}</span>}
                      <div className={`px-2.5 py-1.5 rounded-xl text-xs leading-relaxed break-words ${
                        isMe ? 'bg-primary text-white rounded-tr-sm' : 'bg-surface-light text-gray-200 rounded-tl-sm'
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

          <div className="p-2.5 border-t border-surface-light/50 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                maxLength={500}
                placeholder="Mensagem..."
                className="flex-1 bg-surface-light rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatSending}
                className="px-2.5 py-1.5 bg-primary hover:bg-primary-light rounded-lg text-white transition-colors disabled:opacity-40 flex-shrink-0"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
