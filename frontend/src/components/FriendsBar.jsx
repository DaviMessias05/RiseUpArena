import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X, MessageCircle, ArrowLeft, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { supabase } from '../lib/supabase';

function getDirectChannelId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function DirectChatView({ channelId, otherUser, onBack }) {
  const { user } = useAuth();
  const { subscribeChat } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from('chat_messages')
        .select('id, content, created_at, user_id')
        .eq('channel_type', 'direct')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(100);
      if (!cancelled) {
        setMessages(data || []);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [channelId]);

  useEffect(() => {
    const cleanup = subscribeChat('direct', channelId, ({ message }) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });
    return cleanup;
  }, [channelId, subscribeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !user) return;
    setSending(true);
    setInput('');
    try {
      await supabase.from('chat_messages').insert({
        channel_type: 'direct',
        channel_id: channelId,
        content: trimmed,
        user_id: user.id,
      });
    } catch (err) {
      console.error('Erro ao enviar DM:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header da conversa */}
      <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-white/5 flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="w-7 h-7 rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center flex-shrink-0">
          {otherUser?.avatar_url ? (
            <img src={otherUser.avatar_url} className="w-full h-full object-cover" alt="" />
          ) : (
            <span className="text-[10px] font-bold text-white">
              {(otherUser?.display_name || otherUser?.username || '?')[0].toUpperCase()}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold text-white truncate">
          {otherUser?.display_name || otherUser?.username || 'Usuário'}
        </span>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 size={16} className="animate-spin text-gray-500" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-[11px] text-gray-600 text-center py-6">
            Nenhuma mensagem ainda. Diga olá!
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] px-2.5 py-1.5 rounded-xl text-xs leading-relaxed ${
                    isOwn ? 'bg-[#e8611a]/80 text-white' : 'bg-white/8 text-gray-200'
                  }`}
                  title={msg.created_at ? formatTime(msg.created_at) : ''}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-3 py-2.5 border-t border-white/5 flex-shrink-0"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Mensagem..."
          maxLength={1000}
          className="flex-1 bg-white/5 text-xs text-white placeholder-gray-600 rounded-lg px-3 py-2 outline-none focus:bg-white/8 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="p-2 rounded-lg bg-[#e8611a] text-white hover:opacity-90 disabled:opacity-40 transition-opacity flex-shrink-0"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}

export default function FriendsBar({ isOpen, onClose }) {
  const { user } = useAuth();
  const [tab, setTab] = useState('mensagens');
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [activeConv, setActiveConv] = useState(null);

  useEffect(() => {
    if (!isOpen || !user || tab !== 'mensagens') return;
    let cancelled = false;

    async function loadConversations() {
      setConvLoading(true);
      const userId = user.id;

      const { data: messages } = await supabase
        .from('chat_messages')
        .select('channel_id, content, created_at, user_id')
        .eq('channel_type', 'direct')
        .or(`channel_id.like.${userId}_%,channel_id.like.%_${userId}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (cancelled) return;
      if (!messages || messages.length === 0) {
        setConversations([]);
        setConvLoading(false);
        return;
      }

      // Uma mensagem por conversa (mais recente)
      const convMap = {};
      for (const msg of messages) {
        if (!convMap[msg.channel_id]) convMap[msg.channel_id] = msg;
      }

      // IDs dos outros usuários
      const otherIds = Object.keys(convMap)
        .map((cid) => cid.split('_').find((p) => p !== userId))
        .filter(Boolean);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', otherIds);

      if (cancelled) return;
      const profileMap = {};
      for (const p of profiles || []) profileMap[p.id] = p;

      const list = Object.entries(convMap).map(([channelId, lastMsg]) => {
        const otherId = channelId.split('_').find((p) => p !== userId);
        return { channelId, lastMsg, otherUser: profileMap[otherId] || null };
      });

      setConversations(list);
      setConvLoading(false);
    }

    loadConversations();
    return () => { cancelled = true; };
  }, [isOpen, user, tab]);

  // Fecha conversa ao fechar o painel
  useEffect(() => {
    if (!isOpen) setActiveConv(null);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-30 md:hidden" onClick={onClose} />
      <div className="fixed top-14 right-0 bottom-0 w-64 bg-[#0f1116] border-l border-white/5 z-30 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Social</span>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-600 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Sem login */}
        {!user ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <p className="text-[11px] text-gray-600 text-center">
              Faça login para acessar o social.
            </p>
          </div>
        ) : activeConv ? (
          <DirectChatView
            channelId={activeConv.channelId}
            otherUser={activeConv.otherUser}
            onBack={() => setActiveConv(null)}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex border-b border-white/5 flex-shrink-0">
              <button
                onClick={() => setTab('mensagens')}
                className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  tab === 'mensagens'
                    ? 'text-white border-b-2 border-[#e8611a]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Mensagens
              </button>
              <button
                onClick={() => setTab('amigos')}
                className={`flex-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  tab === 'amigos'
                    ? 'text-white border-b-2 border-[#e8611a]'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Amigos
              </button>
            </div>

            {tab === 'mensagens' ? (
              <div className="flex-1 overflow-y-auto">
                {convLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 size={16} className="animate-spin text-gray-500" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <MessageCircle size={28} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-[11px] text-gray-600">Nenhuma conversa ainda.</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {conversations.map((conv) => (
                      <button
                        key={conv.channelId}
                        onClick={() => setActiveConv(conv)}
                        className="flex items-center gap-2.5 w-full px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#e8611a] overflow-hidden flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {conv.otherUser?.avatar_url ? (
                            <img src={conv.otherUser.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            (conv.otherUser?.display_name || conv.otherUser?.username || '?')[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {conv.otherUser?.display_name || conv.otherUser?.username || 'Usuário'}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">{conv.lastMsg.content}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    Seus Amigos
                  </p>
                  <button className="text-gray-600 hover:text-white transition-colors p-0.5 rounded">
                    <Plus size={13} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-600 text-center py-4">
                  Nenhum amigo ainda.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
