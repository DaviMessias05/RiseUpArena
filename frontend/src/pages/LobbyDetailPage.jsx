import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Loader2,
  ArrowLeft,
  Users,
  Swords,
  CheckCircle2,
  XCircle,
  Play,
  LogOut,
  Send,
  Crown,
  Shield,
  Clock,
  Trophy,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import * as api from '../lib/api';
import { supabase } from '../lib/supabase';

const STATUS_LABELS = {
  waiting: 'Aguardando jogadores',
  ready: 'Aguardando início',
  in_match: 'Partida em andamento',
  finished: 'Partida finalizada',
};

function ChatPanel({ lobbyId }) {
  const { user } = useAuth();
  const { subscribeChat } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, user_id, profiles(username, display_name)')
          .eq('channel_type', 'lobby')
          .eq('channel_id', lobbyId)
          .order('created_at', { ascending: true })
          .limit(100);
        if (error) throw error;
        if (!cancelled) {
          setMessages(
            (data || []).map((msg) => ({
              ...msg,
              username: msg.profiles?.username || msg.profiles?.display_name,
            }))
          );
        }
      } catch (err) {
        if (import.meta.env.DEV) console.error('Erro ao carregar mensagens:', err);
      }
    }

    fetchMessages();
    return () => { cancelled = true; };
  }, [lobbyId]);

  useEffect(() => {
    const unsub = subscribeChat('lobby', lobbyId, (event) => {
      if (event.eventType === 'INSERT' && event.message) {
        setMessages((prev) => [...prev, event.message]);
      }
    });

    return unsub;
  }, [lobbyId, subscribeChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({ channel_type: 'lobby', channel_id: lobbyId, content: newMessage.trim(), user_id: user.id });
      if (error) throw error;
      setNewMessage('');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <div className="bg-surface rounded-xl border border-surface-light/50 flex flex-col h-80">
      <div className="px-4 py-3 border-b border-surface-light/50">
        <h3 className="text-sm font-bold text-white">Chat do Lobby</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 text-sm">Nenhuma mensagem ainda.</p>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isOwn
                      ? 'bg-primary/20 border border-primary/30'
                      : 'bg-surface-light border border-surface-lighter'
                  }`}
                >
                  {!isOwn && (
                    <div className="text-xs text-primary-light font-medium mb-0.5">
                      {msg.username || 'Jogador'}
                    </div>
                  )}
                  <p className="text-sm text-gray-200 break-words">{msg.content}</p>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {msg.created_at
                      ? new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      {user && (
        <form onSubmit={handleSend} className="p-3 border-t border-surface-light/50 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite uma mensagem..."
            maxLength={1000}
            className="flex-1 px-3 py-2 bg-surface-light border border-surface-lighter rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sendingMessage}
            className="px-3 py-2 bg-primary hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {sendingMessage ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function PlayerSlot({ player, isCreator, lobbyStatus }) {
  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg border ${
        player.is_ready
          ? 'bg-success/5 border-success/30'
          : 'bg-surface-light border-surface-lighter'
      }`}
    >
      <div className="relative">
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
        {isCreator && (
          <Crown
            size={14}
            className="absolute -top-1 -right-1 text-accent"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">
          {player.username || 'Jogador'}
        </div>
        <div className="text-xs text-gray-500">
          {player.rating ? `Rating: ${player.rating}` : ''}
        </div>
      </div>
      {lobbyStatus === 'waiting' || lobbyStatus === 'ready' ? (
        player.is_ready ? (
          <CheckCircle2 size={18} className="text-success flex-shrink-0" />
        ) : (
          <Clock size={18} className="text-gray-500 flex-shrink-0" />
        )
      ) : null}
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-surface-lighter">
      <div className="w-10 h-10 rounded-full bg-surface-light flex items-center justify-center">
        <Users size={18} className="text-surface-lighter" />
      </div>
      <span className="text-sm text-gray-500">Slot vazio</span>
    </div>
  );
}

export default function LobbyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscribeLobby } = useRealtime();

  const [lobby, setLobby] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchLobby = useCallback(async () => {
    try {
      const data = await api.getLobby(id);
      setLobby(data);
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const data = await api.getLobby(id);
        if (!cancelled) setLobby(data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    const unsub = subscribeLobby(id, (event) => {
      if (event.table === 'lobbies' && event.new) {
        setLobby((prev) => (prev ? { ...prev, ...event.new } : prev));
      }
      if (event.table === 'lobby_players') {
        fetchLobby();
      }
    });

    return unsub;
  }, [id, subscribeLobby, fetchLobby]);

  const players = lobby?.players || [];
  const maxPlayers = lobby?.max_players || 10;
  const halfMax = Math.ceil(maxPlayers / 2);

  const team1 = players.filter((p) => p.team === 1 || p.team === 'team1');
  const team2 = players.filter((p) => p.team === 2 || p.team === 'team2');
  const unassigned = players.filter((p) => !p.team || (p.team !== 1 && p.team !== 2 && p.team !== 'team1' && p.team !== 'team2'));

  const isCreator = user && lobby && (lobby.creator_id === user.id);
  const isInLobby = user && players.some((p) => p.user_id === user.id);
  const currentPlayer = user ? players.find((p) => p.user_id === user.id) : null;
  const allReady = players.length >= 2 && players.every((p) => p.is_ready);

  async function handleJoin(team) {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.joinLobby(id, team);
      await fetchLobby();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleLeave() {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.leaveLobby(id);
      await fetchLobby();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReady() {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.setReady(id);
      await fetchLobby();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartMatch() {
    setActionLoading(true);
    setActionError(null);
    try {
      await api.startMatch(id);
      await fetchLobby();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 size={40} className="text-primary-light animate-spin" />
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-danger text-lg mb-4">{error || 'Lobby não encontrado.'}</p>
        <Link
          to="/lobbies"
          className="flex items-center gap-2 text-primary-light hover:text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          Voltar para Lobbies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/lobbies"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft size={16} />
          Lobbies
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">{lobby.name || 'Lobby'}</h1>
            <p className="text-gray-400 mt-1">{lobby.game_name || 'Jogo'}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1.5 text-sm font-semibold rounded-lg text-white ${
                lobby.status === 'waiting'
                  ? 'bg-accent'
                  : lobby.status === 'ready'
                  ? 'bg-success'
                  : lobby.status === 'in_match'
                  ? 'bg-primary'
                  : 'bg-gray-500'
              }`}
            >
              {STATUS_LABELS[lobby.status] || lobby.status}
            </span>
            <span className="text-sm text-gray-400 flex items-center gap-1">
              <Users size={16} />
              {players.length}/{maxPlayers}
            </span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl flex items-start gap-3">
          <XCircle size={20} className="text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger">{actionError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status-specific UI */}
          {lobby.status === 'finished' && lobby.result && (
            <div className="bg-surface rounded-xl border border-accent/30 p-6 text-center">
              <Trophy size={40} className="text-accent mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-2">Partida Finalizada</h2>
              <p className="text-gray-400">
                {lobby.result.winner
                  ? `Vencedor: ${lobby.result.winner}`
                  : 'Resultado registrado.'}
              </p>
              {lobby.result.score && (
                <p className="text-2xl font-bold text-white mt-2">{lobby.result.score}</p>
              )}
            </div>
          )}

          {lobby.status === 'in_match' && (
            <div className="bg-surface rounded-xl border border-primary/30 p-6 text-center">
              <Swords size={40} className="text-primary-light mx-auto mb-3 animate-pulse" />
              <h2 className="text-xl font-bold text-white mb-2">Partida em Andamento</h2>
              <p className="text-gray-400">A partida está acontecendo agora. Boa sorte!</p>
              {lobby.match_id && (
                <p className="text-sm text-gray-500 mt-2">Match ID: {lobby.match_id}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Team 1 */}
            <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
              <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
                <h3 className="font-bold text-primary-light flex items-center gap-2">
                  <Shield size={18} />
                  Time 1
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {team1.map((player) => (
                  <PlayerSlot
                    key={player.user_id || player.id}
                    player={player}
                    isCreator={player.user_id === lobby.creator_id}
                    lobbyStatus={lobby.status}
                  />
                ))}
                {Array.from({ length: Math.max(0, halfMax - team1.length) }).map((_, idx) => (
                  <EmptySlot key={`empty-t1-${idx}`} />
                ))}
                {user && !isInLobby && lobby.status === 'waiting' && team1.length < halfMax && (
                  <button
                    onClick={() => handleJoin(1)}
                    disabled={actionLoading}
                    className="w-full py-2 bg-primary/20 hover:bg-primary/30 text-primary-light font-medium rounded-lg border border-primary/30 transition-colors text-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Entrando...' : 'Entrar no Time 1'}
                  </button>
                )}
              </div>
            </div>

            {/* Team 2 */}
            <div className="bg-surface rounded-xl border border-surface-light/50 overflow-hidden">
              <div className="px-4 py-3 bg-accent/10 border-b border-accent/20">
                <h3 className="font-bold text-accent-light flex items-center gap-2">
                  <Shield size={18} />
                  Time 2
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {team2.map((player) => (
                  <PlayerSlot
                    key={player.user_id || player.id}
                    player={player}
                    isCreator={player.user_id === lobby.creator_id}
                    lobbyStatus={lobby.status}
                  />
                ))}
                {Array.from({ length: Math.max(0, halfMax - team2.length) }).map((_, idx) => (
                  <EmptySlot key={`empty-t2-${idx}`} />
                ))}
                {user && !isInLobby && lobby.status === 'waiting' && team2.length < halfMax && (
                  <button
                    onClick={() => handleJoin(2)}
                    disabled={actionLoading}
                    className="w-full py-2 bg-accent/20 hover:bg-accent/30 text-accent-light font-medium rounded-lg border border-accent/30 transition-colors text-sm disabled:opacity-50"
                  >
                    {actionLoading ? 'Entrando...' : 'Entrar no Time 2'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Unassigned players */}
          {unassigned.length > 0 && (
            <div className="bg-surface rounded-xl border border-surface-light/50 p-4">
              <h3 className="font-bold text-gray-300 mb-3">Jogadores sem time</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unassigned.map((player) => (
                  <PlayerSlot
                    key={player.user_id || player.id}
                    player={player}
                    isCreator={player.user_id === lobby.creator_id}
                    lobbyStatus={lobby.status}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {user && (lobby.status === 'waiting' || lobby.status === 'ready') && (
            <div className="flex flex-wrap gap-3">
              {isInLobby && (
                <>
                  <button
                    onClick={handleReady}
                    disabled={actionLoading}
                    className={`px-6 py-2.5 font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 ${
                      currentPlayer?.is_ready
                        ? 'bg-surface-light hover:bg-surface-lighter text-gray-300 border border-surface-lighter'
                        : 'bg-success hover:bg-success/80 text-white'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    {currentPlayer?.is_ready ? 'Cancelar Pronto' : 'Estou Pronto'}
                  </button>
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="px-6 py-2.5 bg-danger/10 hover:bg-danger/20 text-danger font-bold rounded-xl border border-danger/30 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <LogOut size={18} />
                    Sair do Lobby
                  </button>
                </>
              )}
              {isCreator && allReady && (
                <button
                  onClick={handleStartMatch}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-accent hover:bg-accent-light text-black font-bold rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Play size={18} />
                  )}
                  Iniciar Partida
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat */}
        <div className="lg:col-span-1">
          <ChatPanel lobbyId={id} />
        </div>
      </div>
    </div>
  );
}
