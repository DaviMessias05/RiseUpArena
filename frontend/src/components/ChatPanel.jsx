import { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useRealtime } from '../contexts/RealtimeContext';
import { supabase } from '../lib/supabase';

function formatTimestamp(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatPanel({ channelType, channelId }) {
  const { user } = useAuth();
  const { subscribeChat } = useRealtime();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Fetch existing messages on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchMessages() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, content, created_at, user_id, profiles(username, display_name)')
          .eq('channel_type', channelType)
          .eq('channel_id', channelId)
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMessages();
    return () => { cancelled = true; };
  }, [channelType, channelId]);

  // Subscribe to realtime messages
  useEffect(() => {
    const cleanup = subscribeChat(channelType, channelId, async ({ message }) => {
      const { data } = await supabase
        .from('chat_messages')
        .select('id, content, created_at, user_id, profiles(username, display_name)')
        .eq('id', message.id)
        .single();

      const mapped = data
        ? { ...data, username: data.profiles?.username || data.profiles?.display_name }
        : message;

      setMessages((prev) => {
        if (prev.some((m) => m.id === mapped.id)) return prev;
        return [...prev, mapped];
      });
    });

    return cleanup;
  }, [channelType, channelId, subscribeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending || !user) return;

    try {
      setSending(true);
      const { error } = await supabase
        .from('chat_messages')
        .insert({ channel_type: channelType, channel_id: channelId, content: trimmed, user_id: user.id });
      if (error) throw error;
      setInput('');
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro ao enviar mensagem:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl border border-surface-light overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-surface-light bg-surface-light/30">
        <h3 className="text-sm font-semibold text-gray-200">Chat</h3>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin scrollbar-thumb-surface-lighter scrollbar-track-transparent"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            Nenhuma mensagem ainda. Comece a conversa!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = user && (msg.user_id === user.id || msg.username === user.username);
            return (
              <div key={msg.id || idx} className="group">
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-sm font-semibold ${
                      isOwn ? 'text-primary-light' : 'text-accent'
                    }`}
                  >
                    {msg.username || 'Anônimo'}
                  </span>
                  <span className="text-[10px] text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.created_at ? formatTimestamp(msg.created_at) : ''}
                  </span>
                </div>
                <p className="text-sm text-gray-300 break-words">{msg.content}</p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {user ? (
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-4 py-3 border-t border-surface-light"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            maxLength={1000}
            className="flex-1 bg-surface-light text-sm text-gray-200 placeholder-gray-500 px-3 py-2 rounded-lg border border-surface-lighter focus:outline-none focus:border-primary-light transition-colors"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2 rounded-lg bg-primary hover:bg-primary-light text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </form>
      ) : (
        <div className="px-4 py-3 border-t border-surface-light text-center text-sm text-gray-500">
          Faça login para enviar mensagens
        </div>
      )}
    </div>
  );
}
